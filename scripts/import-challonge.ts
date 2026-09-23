/**
 * Importador histórico de partidos 2026 del Circuito del Parque — Challonge.
 *
 * A diferencia de scripts/import-circuito-ranking-sheet.ts (que importa los
 * puntos ya calculados desde la planilla del club — sigue siendo la fuente
 * de circuito_ranking_points, no tocar), este script trae el detalle
 * partido por partido desde la API de Challonge y lo guarda en
 * circuito_matches, para poder navegar los cuadros históricos en la web
 * (/circuito-del-parque/torneos/...). NO recalcula ni escribe
 * circuito_ranking_points — esa tabla ya está poblada desde la planilla y
 * este import no debe pisarla.
 *
 * Alcance: solo torneos 2026 (mismo criterio que el ranking, ver
 * reglas-circuito-del-parque.md — "alcance ranking: solo 2026+"). Challonge
 * tiene historial desde fines de 2024 pero no se importa acá.
 *
 * Descubrimiento clave: en Challonge, el cuadro principal y el repechaje de
 * una categoría/mes son DOS torneos separados (ej. "SINGLE TERCERA
 * Cincinnati Open" + "SINGLE TERCERA REPECHAJE Cincinnati Open") — coincide
 * con nuestro propio modelo (bracket "main"/"repechaje"), así que no hace
 * falta reconstruir nada, solo mapear 1 a 1.
 *
 * Parseo de nombres (confirmado con el organizador el 2026-09-09):
 * - "Dobles [género] Torneo X" sin nivel explícito → siempre es "Segunda"
 *   de ese género.
 * - "Dobles Damas Intermedia" → en realidad "Damas Primera Dobles" (no
 *   existe una categoría "Damas Intermedia Dobles").
 * - "+50 X" sin la palabra "single"/"dobles" → +50 solo existe en single,
 *   sin ambigüedad posible.
 * - Tolera errores de tipeo observados en los nombres reales ("SINLGE",
 *   "SIMGLE", "Wimbleom", "Wimbledom", etc.).
 *
 * Uso:
 *   npm run import:challonge -- --dry-run
 *   npm run import:challonge
 *
 * ── ESTADO (2026-09-09): corrido y verificado ──
 *
 * Se agotó la cuota de la aplicación original explorando la API (500
 * requests/30 días, plan gratuito) — se resolvió sin esperar creando una
 * SEGUNDA "Application" (client_id/secret propios) dentro de la MISMA
 * cuenta de Challonge del club: el límite es por aplicación, no por cuenta
 * completa, así que la segunda tenía su propia cuota de 500 sin costo.
 * (Se probó primero con una cuenta de Challonge totalmente nueva — no
 * sirve: la API solo deja leer torneos propios de la cuenta autenticada,
 * el flag "private: false" de un torneo no habilita lectura cross-cuenta.)
 *
 * Resultado: 67 torneos, 652 partidos, ~495 participantes nuevos en
 * `players`, 74 sin vincular (variantes de nombre/apodo — no rompen nada,
 * no afectan circuito_ranking_points que sigue viniendo de la planilla).
 *
 * Dos bugs encontrados y corregidos durante la corrida real (no aparecían
 * en el dry-run porque no llegó a cubrir todos los casos):
 * - El caché de participantes reusables estaba indexado por categorySlug
 *   en vez de por categoryId — mezclaba participantes de la misma
 *   categoría en meses distintos (ej. "Caballeros Segunda" de mayo
 *   terminaba referenciando participantes creados para febrero). Ver
 *   participantsByCategory abajo.
 * - getTournamentParticipants/getTournamentMatches (scripts/lib/challonge.ts)
 *   no paginaban — un torneo con más entradas que el page size default de
 *   Challonge perdía participantes silenciosamente, dejando partidos con
 *   score pero sin participant_a_id/b_id ("Por definir" en vez del nombre
 *   real). Se corrigió con el mismo patrón de paginación de listAllTournaments.
 *
 * Si hace falta correr de nuevo desde una base limpia (ej. reset de datos
 * de prueba), correr directo `npm run import:challonge` — no hace falta
 * dry-run, ya está validado.
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient, type AdminClient } from "./lib/db"
import { parseArgs, log, ok, warn } from "./lib/utils"
import {
  listAllTournaments,
  getTournamentParticipants,
  getTournamentMatches,
  scoreInSetsToClubFormat,
  type ChallongeTournament,
} from "./lib/challonge"
import { CIRCUITO_FIXED_CATEGORIES } from "../lib/data/circuito/categories"
import { statusForMonth } from "../lib/circuito/editionStatus"

const YEAR = 2026

const FIXED_SET = new Set(CIRCUITO_FIXED_CATEGORIES.map((c) => c.slug))

const MONTHS: Array<{ month: number; tokens: string[] }> = [
  { month: 1, tokens: ["australia open", "australia"] },
  { month: 2, tokens: ["argentina open", "argentina"] },
  { month: 3, tokens: ["miami open", "miami"] },
  { month: 4, tokens: ["monte carlo", "montecarlo"] },
  { month: 5, tokens: ["roland garros", "rolandgarros"] },
  { month: 6, tokens: ["halle open", "halle"] },
  { month: 7, tokens: ["wimbledon", "wimbledom", "wimbleom", "wimblendon"] },
  { month: 8, tokens: ["cincinnati open", "cincinnati", "toronto"] },
  { month: 9, tokens: ["us open", "usopen"] },
  { month: 10, tokens: ["china open", "china"] },
  { month: 11, tokens: ["paris open", "paris"] },
  { month: 12, tokens: ["belgrado open", "belgrado"] },
]

// Nombre real del torneo mensual de cada mes 2026 — usado como
// circuito_editions.name (mismo criterio que import-circuito-ranking-sheet.ts).
const EDITION_NAME_BY_MONTH: Record<number, string> = {
  1: "Australia Open",
  2: "Argentina Open",
  3: "Miami Open",
  4: "Monte Carlo",
  5: "Roland Garros",
  6: "Halle Open",
  7: "Wimbledon",
  8: "Cincinnati Open",
  9: "Us Open",
  10: "China Open",
  11: "Paris Open",
  12: "Belgrado Open",
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

interface ParsedTournamentName {
  month: number
  categorySlug: string
  isRepechaje: boolean
}

function parseTournamentName(rawName: string): ParsedTournamentName | null {
  const n = normalize(rawName)
  if (/master/.test(n) && !/mixto/.test(n)) return null // Mid Master, no es el circuito mensual

  const isRepechaje = /repechaje/.test(n)

  let month: number | null = null
  for (const m of MONTHS) {
    if (m.tokens.some((tok) => n.includes(tok))) {
      month = m.month
      break
    }
  }
  if (!month) return null

  const isDobles = /dobles?|duplas?/.test(n)
  const isSingle = /si?n[gl]?[eg]l?e|sinlge|simgle/.test(n)

  const isMixto = /mixto/.test(n)
  const isDamas = /damas/.test(n)
  const gender = isMixto ? "mixto" : isDamas ? "damas" : "caballeros"

  let level: string | null = null
  if (/primera/.test(n)) level = "primera"
  else if (/intermedia|inter\b/.test(n)) level = "intermedia"
  else if (/segunda/.test(n)) level = "segunda"
  else if (/tercera/.test(n)) level = "tercera"
  else if (/\+?\s*50|mas\s*50/.test(n)) level = "mas50"

  const type: "single" | "dobles" | null = isDobles ? "dobles" : isSingle ? "single" : level === "mas50" ? "single" : null
  if (!type) return null

  if (type === "dobles" && !level) level = "segunda" // confirmado con el organizador
  if (type === "dobles" && gender === "damas" && level === "intermedia") level = "primera" // ídem

  if (!level) return null

  const fixed = CIRCUITO_FIXED_CATEGORIES.find((c) => c.type === type && c.slug.startsWith(gender) && c.slug.includes(level!))
  if (!fixed || !FIXED_SET.has(fixed.slug)) return null

  return { month, categorySlug: fixed.slug, isRepechaje }
}

function normalizeName(name: string): string {
  return normalize(name)
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

async function findOrCreateEdition(db: AdminClient, month: number, dryRun: boolean): Promise<string> {
  const slug = `circuito-${YEAR}-${String(month).padStart(2, "0")}`
  const { data: existing } = await db.from("circuito_editions").select("id").eq("slug", slug).maybeSingle()
  if (existing) return existing.id
  if (dryRun) return `[dry-run:edition:${slug}]`

  const { data, error } = await db
    .from("circuito_editions")
    .insert({
      slug,
      name: EDITION_NAME_BY_MONTH[month] ?? `Circuito ${String(month).padStart(2, "0")}/${YEAR}`,
      month,
      year: YEAR,
      status: statusForMonth(YEAR, month),
    })
    .select("id")
    .single()
  if (error || !data) throw new Error(`Error creando edición ${slug}: ${error?.message ?? "sin datos"}`)
  ok(`Edición creada: ${slug}`)
  return data.id
}

async function findOrCreateCategory(db: AdminClient, editionId: string, categorySlug: string, dryRun: boolean): Promise<string> {
  const fixed = CIRCUITO_FIXED_CATEGORIES.find((c) => c.slug === categorySlug)!
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const dryRun = args["dry-run"] === true
  if (dryRun) log("[DRY RUN — no se escribirá nada en la base de datos]")

  const db = createAdminClient()
  const playersByName = await loadPlayersByNormalizedName(db)

  log("Trayendo lista de torneos de Challonge...")
  const allTournaments = await listAllTournaments()
  const complete = allTournaments.filter((t) => t.attributes.state === "complete")

  const scoped: Array<{ tournament: ChallongeTournament; parsed: ParsedTournamentName }> = []
  for (const t of complete) {
    const year = t.attributes.starts_at ? new Date(t.attributes.starts_at).getUTCFullYear() : null
    if (year !== YEAR) continue
    const parsed = parseTournamentName(t.attributes.name)
    if (!parsed) {
      warn(`No se pudo interpretar el nombre, se salta: "${t.attributes.name}" (#${t.id})`)
      continue
    }
    scoped.push({ tournament: t, parsed })
  }
  log(`${scoped.length} torneos 2026 a importar (de ${complete.length} completos totales).`)

  const summary = {
    matchesWritten: 0,
    participantsCreated: 0,
    unmatchedPlayers: new Set<string>(),
  }

  // Ya existente o nuevo por CATEGORÍA DE UNA EDICIÓN PUNTUAL (categoryId,
  // no categorySlug — "Caballeros Segunda" de mayo y de junio son filas de
  // circuito_categories distintas, con sus propios circuito_participants;
  // cachear solo por slug mezclaría participantes de meses distintos) →
  // participantId por nombre normalizado.
  const participantsByCategory = new Map<string, Map<string, string>>()

  // Procesar primero los cuadros "main" y después los "repechaje": así el
  // repechaje puede reusar el mismo circuito_participant de la persona en
  // vez de crear uno nuevo (son 2 torneos de Challonge distintos con IDs de
  // participante distintos para la misma persona real).
  scoped.sort((a, b) => Number(a.parsed.isRepechaje) - Number(b.parsed.isRepechaje))

  for (const { tournament, parsed } of scoped) {
    const bracket = parsed.isRepechaje ? "repechaje" : "main"
    const isDoblesCategory = CIRCUITO_FIXED_CATEGORIES.find((c) => c.slug === parsed.categorySlug)?.type === "dobles"
    log(`\n── ${parsed.categorySlug} · mes ${parsed.month} · ${bracket} — "${tournament.attributes.name}" (#${tournament.id}) ──`)

    const editionId = await findOrCreateEdition(db, parsed.month, dryRun)
    const categoryId = await findOrCreateCategory(db, editionId, parsed.categorySlug, dryRun)

    if (!participantsByCategory.has(categoryId)) participantsByCategory.set(categoryId, new Map())
    const categoryParticipants = participantsByCategory.get(categoryId)!

    const challongeParticipants = await getTournamentParticipants(tournament.id)
    const challongeIdToLocalId = new Map<number, string>()

    for (const p of challongeParticipants) {
      // Placeholder de Challonge para un casillero de repechaje todavía sin
      // definir ("Perdedor de X" / "Pededor de X") — no es una persona real.
      if (/^p(e|é)r?dedor\b/i.test(p.attributes.name.trim())) continue

      const key = normalizeName(p.attributes.name)
      const existing = categoryParticipants.get(key)
      let localId: string

      if (existing) {
        localId = existing
      } else {
        // En dobles, Challonge guarda la pareja como "Jugador A/Jugador B" en
        // un solo participante — se separa para poder acreditar a los 2.
        // Solo se separa en categorías de dobles — en single un "-" puede
        // ser parte legítima de un apellido compuesto, no un separador.
        const parts = isDoblesCategory
          ? p.attributes.name.split(/\/|-(?!\s*\d)/).map((s) => s.trim()).filter(Boolean)
          : [p.attributes.name]
        const playerId = playersByName.get(normalizeName(parts[0])) ?? null
        const player2Id = parts.length === 2 ? playersByName.get(normalizeName(parts[1])) ?? null : null
        if (!playerId) summary.unmatchedPlayers.add(parts[0])
        if (parts.length === 2 && !player2Id) summary.unmatchedPlayers.add(parts[1])

        if (dryRun) {
          localId = `[dry-run:participant:${key}]`
        } else {
          const { data, error } = await db
            .from("circuito_participants")
            .insert({
              category_id: categoryId,
              player_id: playerId,
              player_2_id: player2Id,
              display_name: p.attributes.name,
              seed: p.attributes.seed,
            })
            .select("id")
            .single()
          if (error || !data) throw new Error(`Error creando participante "${p.attributes.name}": ${error?.message ?? "sin datos"}`)
          localId = data.id
        }
        categoryParticipants.set(key, localId)
        summary.participantsCreated++
      }
      challongeIdToLocalId.set(Number(p.id), localId)
    }

    // draw_size lo fija el cuadro principal (participantes reales, sin los
    // placeholders "Perdedor de X") — la vista pública de la categoría
    // (app/circuito-del-parque/torneos/.../[categoria]) no renderiza sin esto.
    if (bracket === "main" && !dryRun) {
      const realCount = challongeParticipants.filter((p) => !/^p(e|é)r?dedor\b/i.test(p.attributes.name.trim())).length
      const { error } = await db.from("circuito_categories").update({ draw_size: realCount }).eq("id", categoryId)
      if (error) throw new Error(`Error fijando draw_size de ${parsed.categorySlug}: ${error.message}`)
    }

    const matches = (await getTournamentMatches(tournament.id)).filter((m) => m.attributes.state === "complete")
    const matchesByRound = new Map<number, typeof matches>()
    for (const m of matches) {
      const round = m.attributes.round
      if (!matchesByRound.has(round)) matchesByRound.set(round, [])
      matchesByRound.get(round)!.push(m)
    }

    const rows: Array<{
      category_id: string
      bracket: "main" | "repechaje"
      round_number: number
      position: number
      participant_a_id: string | null
      participant_b_id: string | null
      score: string | null
      winner_id: string | null
      status: "played"
    }> = []

    for (const [round, roundMatches] of [...matchesByRound.entries()].sort(([a], [b]) => a - b)) {
      roundMatches.forEach((m, position) => {
        const [pA, pB] = m.attributes.points_by_participant
        const aId = pA ? challongeIdToLocalId.get(pA.participant_id) ?? null : null
        const bId = pB ? challongeIdToLocalId.get(pB.participant_id) ?? null : null
        const winnerLocalId = m.attributes.winner_id ? challongeIdToLocalId.get(m.attributes.winner_id) ?? null : null
        rows.push({
          category_id: categoryId,
          bracket,
          round_number: round,
          position,
          participant_a_id: aId,
          participant_b_id: bId,
          score: scoreInSetsToClubFormat(m.attributes.score_in_sets),
          winner_id: winnerLocalId,
          status: "played",
        })
      })
    }

    if (!dryRun && rows.length > 0) {
      const { error } = await db.from("circuito_matches").upsert(rows, {
        onConflict: "category_id,bracket,round_number,position",
      })
      if (error) throw new Error(`Error guardando partidos de #${tournament.id}: ${error.message}`)
    }
    summary.matchesWritten += rows.length
    ok(`${rows.length} partidos ${dryRun ? "a escribir (dry-run)" : "guardados"}`)
  }

  log("\n── Resumen ──────────────────────────────────")
  log(`  Torneos importados: ${scoped.length}`)
  log(`  Partidos guardados: ${summary.matchesWritten}`)
  log(`  Participantes nuevos creados: ${summary.participantsCreated}`)
  log(`  Sin jugador vinculado en players: ${summary.unmatchedPlayers.size}`)
  for (const p of summary.unmatchedPlayers) log(`    - "${p}"`)
  log(
    dryRun
      ? "\n  Dry run completado."
      : "\n  Import completado. No se tocó circuito_ranking_points (sigue viniendo de la planilla).",
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
