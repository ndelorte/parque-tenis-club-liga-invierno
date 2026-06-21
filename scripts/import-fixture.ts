/**
 * Importador de fixture.
 *
 * Uso:
 *   npm run import:fixture -- --file ./data/fixture.csv --dry-run
 *   npm run import:fixture -- --file ./data/fixture.csv
 *
 * Formato CSV:
 *   categoria,fase,fecha_numero,fecha_nombre,equipo_local,equipo_visitante,dia,hora
 *
 * Valores válidos para "fase": regular | quarterfinal | semifinal | final
 * "dia" en formato YYYY-MM-DD, "hora" en formato HH:MM
 *
 * IMPORTANTE: los equipos deben existir. Importar listas de buena fe primero.
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import * as fs from "fs"
import { parseCSV } from "./lib/csv"
import { createAdminClient, type AdminClient } from "./lib/db"
import { slugify, parseArgs, log, ok, warn, err } from "./lib/utils"

const REQUIRED_COLS = [
  "categoria",
  "fase",
  "fecha_numero",
  "fecha_nombre",
  "equipo_local",
  "equipo_visitante",
  "dia",
  "hora",
]

const VALID_PHASES = ["regular", "quarterfinal", "semifinal", "final"] as const
type Phase = (typeof VALID_PHASES)[number]

type CategoryRow = { id: string; name: string }
type TeamRow = { id: string; name: string; slug: string }
type RoundRow = { id: string; category_id: string; phase: string; round_number: number }

// ── Carga de datos base ───────────────────────────────────────

async function loadCategories(db: AdminClient): Promise<Map<string, CategoryRow>> {
  const { data, error } = await db.from("categories").select("id, name")
  if (error) throw new Error(`Error cargando categorías: ${error.message}`)
  const map = new Map<string, CategoryRow>()
  for (const cat of data ?? []) {
    map.set(cat.name.toLowerCase(), cat as CategoryRow)
  }
  return map
}

async function loadTeamsByCategory(
  db: AdminClient,
  categoryId: string,
): Promise<Map<string, TeamRow>> {
  const { data, error } = await db
    .from("teams")
    .select("id, name, slug")
    .eq("category_id", categoryId)
  if (error) throw new Error(`Error cargando equipos: ${error.message}`)
  const map = new Map<string, TeamRow>()
  for (const t of data ?? []) {
    map.set(t.slug, t as TeamRow)
    map.set(t.name.toLowerCase(), t as TeamRow) // también por nombre
  }
  return map
}

async function loadRoundsByCategory(
  db: AdminClient,
  categoryId: string,
): Promise<Map<string, RoundRow>> {
  const { data, error } = await db
    .from("rounds")
    .select("id, category_id, phase, round_number")
    .eq("category_id", categoryId)
  if (error) throw new Error(`Error cargando fechas: ${error.message}`)
  const map = new Map<string, RoundRow>()
  for (const r of data ?? []) {
    map.set(`${r.phase}:${r.round_number}`, r as RoundRow)
  }
  return map
}

// set de "roundId:homeTeamId:awayTeamId" para detectar duplicados
async function loadExistingSeries(db: AdminClient, categoryId: string): Promise<Set<string>> {
  const { data, error } = await db
    .from("series")
    .select("round_id, home_team_id, away_team_id")
    .eq("category_id", categoryId)
  if (error) throw new Error(`Error cargando series: ${error.message}`)
  const set = new Set<string>()
  for (const s of (data ?? []) as { round_id: string; home_team_id: string; away_team_id: string }[]) {
    set.add(`${s.round_id}:${s.home_team_id}:${s.away_team_id}`)
  }
  return set
}

// ── Procesamiento principal ───────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const file = args["file"] as string | undefined
  const dryRun = args["dry-run"] === true

  if (!file) {
    console.error("Uso: npm run import:fixture -- --file <ruta.csv> [--dry-run]")
    process.exit(1)
  }
  if (!fs.existsSync(file)) {
    console.error(`Archivo no encontrado: ${file}`)
    process.exit(1)
  }

  log(`\nImportando fixture desde: ${file}`)
  if (dryRun) log("  [DRY RUN — no se escribirá nada en la base de datos]\n")

  const content = fs.readFileSync(file, "utf-8")
  const rows = parseCSV(content)

  if (rows.length === 0) {
    console.error("El CSV está vacío o no tiene datos después del encabezado.")
    process.exit(1)
  }

  const missing = REQUIRED_COLS.filter((c) => !(c in rows[0]))
  if (missing.length > 0) {
    console.error(`Columnas faltantes en el CSV: ${missing.join(", ")}`)
    console.error(`Se esperan: ${REQUIRED_COLS.join(", ")}`)
    process.exit(1)
  }

  const db = createAdminClient()
  const categories = await loadCategories(db)

  const teamsByCategory = new Map<string, Map<string, TeamRow>>()
  const roundsByCategory = new Map<string, Map<string, RoundRow>>()
  const seriesByCategory = new Map<string, Set<string>>()

  const created = { rounds: 0, series: 0 }
  let errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNum = i + 2
    const {
      categoria,
      fase,
      fecha_numero,
      fecha_nombre,
      equipo_local,
      equipo_visitante,
      dia,
      hora,
    } = row

    // ── Validaciones básicas ──
    if (!VALID_PHASES.includes(fase as Phase)) {
      err(`Línea ${lineNum}: fase inválida → "${fase}". Valores válidos: ${VALID_PHASES.join(", ")}`)
      errors++
      continue
    }
    const roundNumber = parseInt(fecha_numero, 10)
    if (isNaN(roundNumber) || roundNumber < 1) {
      err(`Línea ${lineNum}: fecha_numero inválido → "${fecha_numero}"`)
      errors++
      continue
    }
    if (dia && !/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
      err(`Línea ${lineNum}: dia inválido → "${dia}" (esperado YYYY-MM-DD)`)
      errors++
      continue
    }
    if (hora && !/^\d{2}:\d{2}$/.test(hora)) {
      err(`Línea ${lineNum}: hora inválida → "${hora}" (esperado HH:MM)`)
      errors++
      continue
    }

    // ── Categoría ──
    const cat = categories.get(categoria.toLowerCase())
    if (!cat) {
      err(`Línea ${lineNum}: categoría no encontrada → "${categoria}"`)
      errors++
      continue
    }

    // ── Equipos ──
    if (!teamsByCategory.has(cat.id)) {
      teamsByCategory.set(cat.id, await loadTeamsByCategory(db, cat.id))
    }
    const teamsMap = teamsByCategory.get(cat.id)!

    const homeTeam =
      teamsMap.get(slugify(equipo_local)) ?? teamsMap.get(equipo_local.toLowerCase())
    if (!homeTeam) {
      err(
        `Línea ${lineNum}: equipo local no encontrado → "${equipo_local}" en categoría "${categoria}". Importá primero las listas de buena fe.`,
      )
      errors++
      continue
    }

    const awayTeam =
      teamsMap.get(slugify(equipo_visitante)) ?? teamsMap.get(equipo_visitante.toLowerCase())
    if (!awayTeam) {
      err(
        `Línea ${lineNum}: equipo visitante no encontrado → "${equipo_visitante}" en categoría "${categoria}". Importá primero las listas de buena fe.`,
      )
      errors++
      continue
    }

    if (homeTeam.id === awayTeam.id) {
      err(`Línea ${lineNum}: equipo local y visitante son el mismo → "${equipo_local}"`)
      errors++
      continue
    }

    // ── Round ──
    if (!roundsByCategory.has(cat.id)) {
      roundsByCategory.set(cat.id, await loadRoundsByCategory(db, cat.id))
    }
    const roundsMap = roundsByCategory.get(cat.id)!
    const roundKey = `${fase}:${roundNumber}`
    let round = roundsMap.get(roundKey)

    if (!round) {
      if (!dryRun) {
        const { data, error } = await db
          .from("rounds")
          .insert({
            category_id: cat.id,
            phase: fase as Phase,
            round_number: roundNumber,
            name: fecha_nombre || `Fecha ${roundNumber}`,
            scheduled_date: dia || null,
            status: "scheduled",
          })
          .select("id, category_id, phase, round_number")
          .single()
        if (error) {
          err(`Línea ${lineNum}: error creando fecha "${fecha_nombre}": ${error.message}`)
          errors++
          continue
        }
        round = data as RoundRow
        roundsMap.set(roundKey, round)
      } else {
        round = {
          id: `[new:round:${cat.id}:${roundKey}]`,
          category_id: cat.id,
          phase: fase,
          round_number: roundNumber,
        }
        roundsMap.set(roundKey, round)
      }
      ok(`Fecha creada: "${fecha_nombre}" (${cat.name})${dryRun ? " [dry-run]" : ""}`)
      created.rounds++
    }

    // ── Series duplicadas ──
    if (!seriesByCategory.has(cat.id)) {
      seriesByCategory.set(cat.id, await loadExistingSeries(db, cat.id))
    }
    const seriesSet = seriesByCategory.get(cat.id)!
    const seriesKey = `${round.id}:${homeTeam.id}:${awayTeam.id}`

    if (seriesSet.has(seriesKey)) {
      warn(`Línea ${lineNum}: serie ya existe → ${equipo_local} vs ${equipo_visitante} (${fecha_nombre})`)
      continue
    }

    // ── Crear serie ──
    if (!dryRun) {
      const { error } = await db.from("series").insert({
        round_id: round.id,
        category_id: cat.id,
        home_team_id: homeTeam.id,
        away_team_id: awayTeam.id,
        scheduled_date: dia || null,
        scheduled_time: hora || null,
        status: "scheduled",
        is_general_walkover: false,
      })
      if (error) {
        err(`Línea ${lineNum}: error creando serie: ${error.message}`)
        errors++
        continue
      }
      seriesSet.add(seriesKey)
    }

    ok(
      `Serie: ${equipo_local} vs ${equipo_visitante} · ${fecha_nombre} · ${dia}${hora ? ` ${hora}` : ""}${dryRun ? " [dry-run]" : ""}`,
    )
    created.series++
  }

  log("\n── Resumen ──────────────────────────────────")
  log(`  Fechas creadas: ${created.rounds}`)
  log(`  Series creadas: ${created.series}`)
  if (errors > 0) {
    log(`  Errores:        ${errors}`)
    process.exit(1)
  } else {
    log(`  Errores:        0`)
    log(dryRun ? "\n  Dry run completado. Revisá la salida y ejecutá sin --dry-run." : "\n  Importación completada.")
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
