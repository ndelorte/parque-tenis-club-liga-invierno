/**
 * Importador histórico del ranking 2026 del Circuito del Parque — Sprint C7.
 *
 * Reemplaza el enfoque original (API de Challonge, ver import-challonge.ts):
 * el club ya lleva el ranking anual a mano en una planilla de Google Sheets
 * (una pestaña/gid por categoría, una columna por torneo mensual, con los
 * puntos YA calculados por jugador según la escala de
 * reglas-circuito-del-parque.md). Importar esa planilla directo es más
 * simple y confiable que reconstruir puntos desde la API de Challonge (que
 * además pasó a pedir OAuth2 client id/secret en vez de una API key simple).
 *
 * Fuente: planilla pública (solo lectura) de Google Sheets, exportada como
 * CSV por gid — no necesita credenciales.
 *
 * Uso:
 *   npm run import:circuito-sheet -- --dry-run
 *   npm run import:circuito-sheet
 *
 * Relevado con el organizador el 2026-09-09 (conversación de esta sesión):
 * - Mapeo gid → categorySlug: confirmado a mano, ver GID_TO_CATEGORY abajo.
 * - Mapeo columna de torneo → mes 2026: confirmado cruzando los encabezados
 *   reales de las 10 planillas contra lo que dijo el organizador (ver
 *   MONTH_BY_TOURNAMENT_NAME). Los meses 1/5/7/9 (Australia Open, Roland
 *   Garros, Wimbledon, Us Open) son "Grand Slam".
 * - Una columna ausente en una planilla puntual = esa categoría no se abrió
 *   ese mes (no es un torneo que falte cargar).
 * - "Toronto" y "Cincinnati Open" son el mismo mes (agosto) con nombre
 *   distinto según la categoría.
 *
 * Ya se corrió una vez (2026-09-09): 429 filas de ranking, 181 jugadores
 * nuevos en `players`, 12 ediciones 2026 creadas. Julio a diciembre
 * quedaron sin datos (la planilla real todavía no los tenía cargados) — sus
 * ediciones se corrigieron a mano a status "active" en vez de "finished"
 * (este script crea la edición apenas ve la columna en el encabezado, sin
 * saber todavía si va a tener puntos). Si se vuelve a correr contra una
 * base vacía, aplicar la misma corrección a mano para los meses sin datos.
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient, type AdminClient } from "./lib/db"
import { parseCSV } from "./lib/csv"
import { parseArgs, log, ok, warn } from "./lib/utils"
import { CIRCUITO_FIXED_CATEGORIES } from "../lib/data/circuito/categories"
import { upsertCircuitoRankingPoints, type CircuitoRankingPointsInput } from "../lib/data/circuito/ranking"

const SHEET_ID = "1HN39ZznWLlVsW8WkkD1aEbwr_h-xsIBpO9zxp9NfvGc"
const YEAR = 2026

const GID_TO_CATEGORY: Record<string, string> = {
  "0": "caballeros-primera-single",
  "1762172063": "caballeros-intermedia-single",
  "203604704": "caballeros-segunda-single",
  "26699410": "caballeros-tercera-single",
  "1905176390": "caballeros-mas50-single",
  "1140466033": "damas-segunda-single",
  "909002115": "mixto-intermedia-dobles",
  "901301306": "damas-primera-dobles", // confirmado con el organizador — la pestaña dice "intermedia" pero es Primera Dobles
  "715921640": "damas-segunda-dobles",
  "1962076584": "caballeros-segunda-dobles",
}

const MONTH_BY_TOURNAMENT_NAME: Record<string, number> = {
  "australia open": 1,
  "argentina open": 2,
  miami: 3,
  "monte carlo": 4,
  "roland garros": 5,
  halle: 6,
  wimbledon: 7,
  toronto: 8,
  "cincinnati open": 8,
  "us open": 9,
  "china open": 10,
  "paris open": 11,
  "belgrado open": 12,
}

function monthFromColumnHeader(header: string): number | null {
  const name = header
    .replace(/\s*26\s*$/i, "")
    .trim()
    .toLowerCase()
  return MONTH_BY_TOURNAMENT_NAME[name] ?? null
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

async function fetchSheetCsv(gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se pudo leer la planilla (gid=${gid}): HTTP ${res.status}`)
  return res.text()
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

// Crea el jugador si no existe todavía. Comparte `players` con Liga (único
// dato compartido intencional entre módulos, ADR-002) — un participante del
// Circuito que ya juega Liga reusa su fila; si no, se crea una nueva acá.
// El mapa se actualiza al toque para que la misma persona no se duplique
// si aparece en más de una categoría dentro de esta misma corrida.
async function findOrCreatePlayer(
  db: AdminClient,
  name: string,
  playersByName: Map<string, string>,
  dryRun: boolean,
): Promise<string> {
  const key = normalizeName(name)
  const existing = playersByName.get(key)
  if (existing) return existing

  if (dryRun) {
    const placeholder = `[dry-run:player:${key}]`
    playersByName.set(key, placeholder)
    return placeholder
  }

  const parts = name.trim().split(/\s+/)
  const first_name = parts.length > 1 ? parts.slice(0, -1).join(" ") : parts[0]
  const last_name = parts.length > 1 ? parts[parts.length - 1] : ""

  const { data, error } = await db
    .from("players")
    .insert({ first_name, last_name, display_name: name.trim(), active: true })
    .select("id")
    .single()
  if (error || !data) throw new Error(`Error creando jugador "${name}": ${error?.message ?? "sin datos"}`)

  playersByName.set(key, data.id)
  return data.id
}

async function findOrCreateEdition(db: AdminClient, month: number, dryRun: boolean): Promise<string> {
  const slug = `circuito-${YEAR}-${String(month).padStart(2, "0")}`
  const { data: existing } = await db.from("circuito_editions").select("id").eq("slug", slug).maybeSingle()
  if (existing) return existing.id
  if (dryRun) return `[dry-run:edition:${slug}]`

  const { data, error } = await db
    .from("circuito_editions")
    .insert({ slug, name: `Circuito ${String(month).padStart(2, "0")}/${YEAR}`, month, year: YEAR, status: "finished" })
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

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const dryRun = args["dry-run"] === true
  if (dryRun) log("[DRY RUN — no se escribirá nada en la base de datos]")

  const db = createAdminClient()
  const playersByName = await loadPlayersByNormalizedName(db)

  const summary = {
    rows: 0,
    written: 0,
    playersCreated: 0,
    unmatchedColumns: new Set<string>(),
    duplicatesSkipped: [] as string[],
  }

  for (const [gid, categorySlug] of Object.entries(GID_TO_CATEGORY)) {
    log(`\n── ${categorySlug} (gid=${gid}) ──`)
    const csv = await fetchSheetCsv(gid)
    const rows = parseCSV(csv)
    if (rows.length === 0) {
      warn("Planilla vacía o sin filas de datos — se salta.")
      continue
    }

    // El organizador avisó que puede haber nombres repetidos por error de
    // carga dentro de la misma planilla — se detectan y se saltean del todo
    // (no se adivina cuál de las dos filas es la correcta).
    const nameCounts = new Map<string, number>()
    for (const row of rows) {
      const name = row["JUGADOR"]?.trim()
      if (!name) continue
      const key = normalizeName(name)
      nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1)
    }
    const duplicateKeys = new Set([...nameCounts.entries()].filter(([, n]) => n > 1).map(([k]) => k))
    if (duplicateKeys.size > 0) {
      warn(`${duplicateKeys.size} nombre(s) repetido(s) en esta planilla — se saltean: ${[...duplicateKeys].join(", ")}`)
      for (const k of duplicateKeys) summary.duplicatesSkipped.push(`${k} (${categorySlug})`)
    }

    const tournamentColumns = Object.keys(rows[0]).filter((h) => h && h !== "POSICION" && h !== "JUGADOR" && h !== "PUNTOS TOTALES")

    // Resuelve mes → edición/categoría una sola vez por columna (evita crear
    // la misma edición 10 veces, una por planilla).
    const editionIdByMonth = new Map<number, string>()
    const categoryIdByMonth = new Map<number, string>()
    for (const col of tournamentColumns) {
      const month = monthFromColumnHeader(col)
      if (month === null) {
        summary.unmatchedColumns.add(col)
        continue
      }
      if (!editionIdByMonth.has(month)) {
        editionIdByMonth.set(month, await findOrCreateEdition(db, month, dryRun))
      }
      if (!categoryIdByMonth.has(month)) {
        categoryIdByMonth.set(month, await findOrCreateCategory(db, editionIdByMonth.get(month)!, categorySlug, dryRun))
      }
    }

    const pointsRows: CircuitoRankingPointsInput[] = []

    for (const row of rows) {
      const name = row["JUGADOR"]?.trim()
      if (!name) continue
      if (duplicateKeys.has(normalizeName(name))) continue // reportado arriba, no se importa
      summary.rows++

      const hadPlayer = playersByName.has(normalizeName(name))
      const playerId = await findOrCreatePlayer(db, name, playersByName, dryRun)
      if (!hadPlayer) summary.playersCreated++

      for (const col of tournamentColumns) {
        const raw = row[col]?.trim()
        if (!raw || raw === "-") continue
        const points = parseInt(raw, 10)
        if (isNaN(points) || points <= 0) continue

        const month = monthFromColumnHeader(col)
        if (month === null) continue // ya reportado arriba
        const editionId = editionIdByMonth.get(month)!
        const categoryId = categoryIdByMonth.get(month)!

        pointsRows.push({ playerId, categoryId, editionId, points })
        summary.written++
      }
    }

    if (!dryRun && pointsRows.length > 0) {
      await upsertCircuitoRankingPoints(pointsRows)
    }
    ok(`${pointsRows.length} filas de ranking ${dryRun ? "a escribir (dry-run)" : "guardadas"}`)
  }

  log("\n── Resumen ──────────────────────────────────")
  log(`  Filas de jugador procesadas: ${summary.rows}`)
  log(`  Filas de ranking escritas:   ${summary.written}`)
  log(`  Jugadores nuevos creados en players: ${summary.playersCreated}`)
  log(`  Columnas sin mes reconocido: ${summary.unmatchedColumns.size}`)
  for (const c of summary.unmatchedColumns) log(`    - "${c}"`)
  log(`  Nombres repetidos salteados (revisar la planilla a mano): ${summary.duplicatesSkipped.length}`)
  for (const d of summary.duplicatesSkipped) log(`    - ${d}`)
  log(
    dryRun
      ? "\n  Dry run completado. Revisá los nombres repetidos antes de correr sin --dry-run."
      : "\n  Import completado.",
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
