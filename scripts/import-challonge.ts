/**
 * Importador histórico de Challonge — Sprint C7.
 *
 * Corre UNA sola vez para poblar el historial 2026 del Circuito del Parque
 * (cuenta Challonge "elcircuitodelparque"). De ahí en más, todo torneo se
 * carga desde /panel-circuito/mensual (Sprint C5) — este script no está
 * pensado para correr en cada deploy ni de forma recurrente (Challonge
 * limita a 500 req/mes en el plan gratuito).
 *
 * Decisión de diseño importante: NO reconstruye el cuadro (circuito_matches)
 * de cada torneo histórico. Los torneos de Challonge pueden haber usado un
 * formato (doble eliminación, byes repartidos distinto, etc.) que no
 * necesariamente coincide con el motor nuevo (lib/circuito/generateBracket.ts,
 * eliminación simple + repechaje). Forzar esos datos históricos a nuestra
 * estructura de rondas arriesgaría corromper el resultado. En cambio, usa el
 * `final_rank` que ya calcula Challonge (autoridad de la clasificación final,
 * resuelve ella misma empates/WO/etc.) para derivar la instancia de cada
 * participante (campeón/subcampeón/semifinal/...) y volcar directo a
 * circuito_ranking_points. Esto también evita depender de si `scores_csv`
 * viene con detalle set por set — no hace falta para esto.
 *
 * Uso:
 *   1) Listar torneos y ver la categoría que sugiere la heurística de nombre:
 *      npm run import:challonge -- --list
 *
 *   2) Confirmar/corregir el mapeo torneo → categoría a mano en un JSON:
 *      [{ "tournamentId": 12345, "categorySlug": "caballeros-primera-single" }, ...]
 *      (categorySlug: uno de los 14 slugs fijos, ver lib/data/circuito/categories.ts)
 *
 *   3) Dry-run (no escribe nada, solo reporta):
 *      npm run import:challonge -- --mapping ./data/challonge-mapping.json --dry-run
 *
 *   4) Import real:
 *      npm run import:challonge -- --mapping ./data/challonge-mapping.json
 *
 * Requiere CHALLONGE_API_KEY en .env.local (no commitear).
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import * as fs from "fs"
import { createAdminClient, type AdminClient } from "./lib/db"
import { parseArgs, log, ok, warn, err } from "./lib/utils"
import { listTournaments, getTournamentDetail, type ChallongeParticipant } from "./lib/challonge"
import { CIRCUITO_FIXED_CATEGORIES } from "../lib/data/circuito/categories"
import { selectDrawRule } from "../lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../lib/circuito/formatSpec"
import { pointsForInstance, isGrandSlamMonth, type CircuitoInstance } from "../lib/circuito/pointsTable"
import { upsertCircuitoRankingPoints, type CircuitoRankingPointsInput } from "../lib/data/circuito/ranking"

interface MappingEntry {
  tournamentId: number
  categorySlug: string
}

// ── Heurística de nombre (solo para --list; nunca escribe sin mapping) ──

function guessCategorySlug(tournamentName: string): string | null {
  const n = tournamentName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")

  const isDoubles = /doble|dupla|pareja/.test(n)
  const isMixto = /mixt/.test(n)
  const level = /primera|1ra|1a\b/.test(n)
    ? "primera"
    : /intermedia/.test(n)
      ? "intermedia"
      : /segunda|2da|2a\b/.test(n)
        ? "segunda"
        : /tercera|3ra|3a\b/.test(n)
          ? "tercera"
          : /\+\s*50|mas\s*50/.test(n)
            ? "mas50"
            : null
  if (!level) return null

  if (isMixto) {
    const slug = `mixto-${level}-dobles`
    return CIRCUITO_FIXED_CATEGORIES.some((c) => c.slug === slug) ? slug : null
  }

  const gender = /dama|femen/.test(n) ? "damas" : /caballer|masculin/.test(n) ? "caballeros" : null
  if (!gender) return null

  const type = isDoubles ? "dobles" : "single"
  const slug = `${gender}-${level}-${type}`
  return CIRCUITO_FIXED_CATEGORIES.some((c) => c.slug === slug) ? slug : null
}

// ── Instancia final según el final_rank que ya calculó Challonge ──
// Mismos cortes que reglas-circuito-del-parque.md, sección "Puntos y ranking".

function instanceFromFinalRank(finalRank: number, totalParticipants: number): CircuitoInstance | null {
  const rule = selectDrawRule(totalParticipants, CIRCUITO_FORMAT_SPEC)
  if (!rule) return null // <4 inscriptos: no corresponde (no se hubiera jugado)

  if (finalRank === 1) return "champion"
  if (finalRank === 2) return "runner_up"

  switch (rule.format) {
    case "round_robin_pure":
    case "round_robin_with_final":
      return "round_of_32_plus"
    case "groups_then_knockout":
      return finalRank <= 4 ? "semifinalist" : "round_of_32_plus"
    case "single_elimination":
      if (finalRank <= 4) return "semifinalist"
      if (finalRank <= 8) return "quarterfinalist"
      if (finalRank <= 16) return "round_of_16"
      return "round_of_32_plus"
  }
}

// ── Reconciliación de nombres (Challonge = texto libre, no FK a players) ──

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// Nombres de dobles suelen venir como "Fulano / Mengano" — separadores comunes.
function splitDoublesName(name: string): string[] {
  return name.split(/\s*(?:\/|&| y )\s*/i).filter(Boolean)
}

async function loadPlayersByNormalizedName(db: AdminClient): Promise<Map<string, string>> {
  const { data, error } = await db.from("players").select("id, display_name")
  if (error) throw new Error(`Error cargando players: ${error.message}`)
  const map = new Map<string, string>()
  for (const p of (data ?? []) as Array<{ id: string; display_name: string }>) {
    map.set(normalizeName(p.display_name), p.id)
  }
  return map
}

function reconcileParticipant(
  challongeName: string,
  playersByName: Map<string, string>,
): { playerId: string | null; player2Id: string | null; matched: boolean } {
  const parts = splitDoublesName(challongeName)
  if (parts.length === 2) {
    const id1 = playersByName.get(normalizeName(parts[0])) ?? null
    const id2 = playersByName.get(normalizeName(parts[1])) ?? null
    return { playerId: id1, player2Id: id2, matched: !!id1 && !!id2 }
  }
  const id = playersByName.get(normalizeName(challongeName)) ?? null
  return { playerId: id, player2Id: null, matched: !!id }
}

// ── Edición mensual: se deriva de la fecha del torneo, no del nombre ──

async function findOrCreateEdition(
  db: AdminClient,
  year: number,
  month: number,
  dryRun: boolean,
): Promise<string> {
  const slug = `circuito-${year}-${String(month).padStart(2, "0")}`
  const { data: existing } = await db.from("circuito_editions").select("id").eq("slug", slug).maybeSingle()
  if (existing) return existing.id

  if (dryRun) return `[dry-run:edition:${slug}]`

  const { data, error } = await db
    .from("circuito_editions")
    .insert({ slug, name: `Circuito ${String(month).padStart(2, "0")}/${year}`, month, year, status: "finished" })
    .select("id")
    .single()
  if (error || !data) throw new Error(`Error creando edición ${slug}: ${error?.message ?? "sin datos"}`)
  ok(`Edición creada: ${slug}`)
  return data.id
}

async function findOrCreateCategory(
  db: AdminClient,
  editionId: string,
  categorySlug: string,
  dryRun: boolean,
): Promise<string> {
  const fixed = CIRCUITO_FIXED_CATEGORIES.find((c) => c.slug === categorySlug)
  if (!fixed) throw new Error(`categorySlug desconocido: "${categorySlug}"`)

  const { data: existing } = await db
    .from("circuito_categories")
    .select("id")
    .eq("edition_id", editionId)
    .eq("slug", categorySlug)
    .maybeSingle()
  if (existing) return existing.id

  if (dryRun) return `[dry-run:category:${categorySlug}]`

  const { data, error } = await db
    .from("circuito_categories")
    .insert({ edition_id: editionId, name: fixed.name, slug: fixed.slug, type: fixed.type, sort_order: 0 })
    .select("id")
    .single()
  if (error || !data) throw new Error(`Error creando categoría ${categorySlug}: ${error?.message ?? "sin datos"}`)
  return data.id
}

// ── Comando: --list ──────────────────────────────────────────

async function runList(subdomain?: string) {
  const tournaments = await listTournaments(subdomain)
  log(`\n${tournaments.length} torneos encontrados${subdomain ? ` (subdomain=${subdomain})` : ""}\n`)
  for (const t of tournaments) {
    const guess = guessCategorySlug(t.name)
    log(
      `  #${t.id}\t${t.state}\t${t.tournament_type}\t${t.participants_count} inscriptos\t` +
        `${t.started_at ?? t.created_at}\t"${t.name}"\t→ ${guess ?? "⚠ sin match automático"}`,
    )
  }
  log("\nArmá el JSON de mapping con los tournamentId + categorySlug confirmados y corré con --mapping.")
}

// ── Comando: --mapping ───────────────────────────────────────

async function runImport(mappingFile: string, dryRun: boolean) {
  if (!fs.existsSync(mappingFile)) {
    err(`No existe el archivo de mapping: ${mappingFile}`)
    process.exit(1)
  }
  const mapping = JSON.parse(fs.readFileSync(mappingFile, "utf-8")) as MappingEntry[]
  const invalidSlugs = mapping
    .map((m) => m.categorySlug)
    .filter((slug) => !CIRCUITO_FIXED_CATEGORIES.some((c) => c.slug === slug))
  if (invalidSlugs.length > 0) {
    err(`categorySlug inválido en el mapping: ${[...new Set(invalidSlugs)].join(", ")}`)
    process.exit(1)
  }

  const db = createAdminClient()
  const playersByName = await loadPlayersByNormalizedName(db)

  const summary = { tournaments: 0, participants: 0, matched: 0, unmatched: [] as string[], skipped: [] as string[] }

  for (const entry of mapping) {
    log(`\n── Torneo #${entry.tournamentId} → ${entry.categorySlug} ──`)
    const { tournament, participants } = await getTournamentDetail(entry.tournamentId)

    if (tournament.state !== "complete") {
      warn(`Estado "${tournament.state}" (no "complete") — se salta. Terminalo en Challonge antes de importar.`)
      summary.skipped.push(`#${entry.tournamentId} (${tournament.name}): estado ${tournament.state}`)
      continue
    }
    if (tournament.tournament_type !== "single elimination" && tournament.tournament_type !== "round robin") {
      warn(
        `Tipo "${tournament.tournament_type}" no tiene traducción definida a reglas-circuito-del-parque.md ` +
          `(solo eliminación simple / round robin) — se salta.`,
      )
      summary.skipped.push(`#${entry.tournamentId} (${tournament.name}): tipo ${tournament.tournament_type}`)
      continue
    }

    const dateStr = tournament.completed_at ?? tournament.started_at ?? tournament.created_at
    const date = new Date(dateStr)
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const grandSlam = isGrandSlamMonth(month)

    const editionId = await findOrCreateEdition(db, year, month, dryRun)
    const categoryId = await findOrCreateCategory(db, editionId, entry.categorySlug, dryRun)

    const ranked = participants.filter((p): p is ChallongeParticipant & { final_rank: number } => p.final_rank !== null)
    if (ranked.length !== participants.length) {
      warn(`${participants.length - ranked.length} participante(s) sin final_rank — se ignoran para el ranking.`)
    }

    const rows: CircuitoRankingPointsInput[] = []

    for (const p of ranked) {
      summary.participants++
      const { playerId, player2Id, matched } = reconcileParticipant(p.name, playersByName)
      if (matched) summary.matched++
      else summary.unmatched.push(`"${p.name}" (torneo #${entry.tournamentId})`)

      const instance = instanceFromFinalRank(p.final_rank, participants.length)
      if (!instance) continue
      const points = pointsForInstance(instance, grandSlam)
      if (points === 0) continue

      if (playerId) rows.push({ playerId, categoryId, editionId, points })
      if (player2Id) rows.push({ playerId: player2Id, categoryId, editionId, points })

      log(`  ${matched ? "✓" : "⚠"} ${p.name} — rank ${p.final_rank}/${participants.length} → ${instance} (${points} pts)`)
    }

    if (!dryRun && rows.length > 0) {
      await upsertCircuitoRankingPoints(rows)
    }

    summary.tournaments++
  }

  log("\n── Resumen ──────────────────────────────────")
  log(`  Torneos procesados: ${summary.tournaments}`)
  log(`  Torneos salteados:  ${summary.skipped.length}`)
  for (const s of summary.skipped) log(`    - ${s}`)
  log(`  Participantes:      ${summary.participants}`)
  log(`  Matcheados:         ${summary.matched}`)
  log(`  Sin matchear:       ${summary.unmatched.length}`)
  for (const u of summary.unmatched) log(`    - ${u}`)
  log(
    dryRun
      ? "\n  Dry run completado. Revisá la lista de \"sin matchear\" antes de correr sin --dry-run."
      : "\n  Import completado. Los no matcheados quedaron con display_name pero sin player_id — no suman al ranking hasta reconciliarlos a mano.",
  )
}

// ── main ─────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args["list"]) {
    await runList(typeof args["subdomain"] === "string" ? args["subdomain"] : "elcircuitodelparque")
    return
  }

  const mappingFile = args["mapping"] as string | undefined
  if (!mappingFile) {
    console.error(
      "Uso:\n" +
        "  npm run import:challonge -- --list [--subdomain elcircuitodelparque]\n" +
        "  npm run import:challonge -- --mapping ./data/challonge-mapping.json [--dry-run]",
    )
    process.exit(1)
  }

  const dryRun = args["dry-run"] === true
  if (dryRun) log("[DRY RUN — no se escribirá nada en la base de datos]")
  await runImport(mappingFile, dryRun)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
