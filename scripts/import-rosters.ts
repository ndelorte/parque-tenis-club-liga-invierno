/**
 * Importador de listas de buena fe.
 *
 * Uso:
 *   npm run import:rosters -- --file ./data/listas-buena-fe.csv --dry-run
 *   npm run import:rosters -- --file ./data/listas-buena-fe.csv
 *
 * Formato CSV:
 *   categoria,equipo,capitan,jugador
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import * as fs from "fs"
import { parseCSV } from "./lib/csv"
import { createAdminClient, type AdminClient } from "./lib/db"
import { slugify, parseName, parseArgs, log, ok, err } from "./lib/utils"

const REQUIRED_COLS = ["categoria", "equipo", "capitan", "jugador"]

// ── Tipos internos ────────────────────────────────────────────

type CategoryRow = { id: string; name: string; slug: string }
type TeamRow = { id: string; name: string; slug: string; category_id: string }
type PlayerRow = { id: string; display_name: string }

// ── Carga de datos base ───────────────────────────────────────

async function loadCategories(db: AdminClient): Promise<Map<string, CategoryRow>> {
  const { data, error } = await db.from("categories").select("id, name, slug")
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
    .select("id, name, slug, category_id")
    .eq("category_id", categoryId)
  if (error) throw new Error(`Error cargando equipos: ${error.message}`)
  const map = new Map<string, TeamRow>()
  for (const t of data ?? []) {
    map.set(t.slug, t as TeamRow)
  }
  return map
}

async function loadPlayers(db: AdminClient): Promise<Map<string, PlayerRow>> {
  const { data, error } = await db.from("players").select("id, display_name")
  if (error) throw new Error(`Error cargando jugadores: ${error.message}`)
  const map = new Map<string, PlayerRow>()
  for (const p of data ?? []) {
    map.set(p.display_name.toLowerCase(), p as PlayerRow)
  }
  return map
}

// map: player_id → Set<team_id> para category
async function loadTeamPlayersByCategory(
  db: AdminClient,
  categoryId: string,
): Promise<Map<string, Set<string>>> {
  const { data, error } = await db
    .from("team_players")
    .select("player_id, team_id, teams!inner(category_id)")
    .eq("teams.category_id", categoryId)
    .eq("active", true)
  if (error) throw new Error(`Error cargando team_players: ${error.message}`)
  const map = new Map<string, Set<string>>()
  for (const tp of (data ?? []) as { player_id: string; team_id: string }[]) {
    if (!map.has(tp.player_id)) map.set(tp.player_id, new Set())
    map.get(tp.player_id)!.add(tp.team_id)
  }
  return map
}

// ── Procesamiento principal ───────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const file = args["file"] as string | undefined
  const dryRun = args["dry-run"] === true

  if (!file) {
    console.error("Uso: npm run import:rosters -- --file <ruta.csv> [--dry-run]")
    process.exit(1)
  }
  if (!fs.existsSync(file)) {
    console.error(`Archivo no encontrado: ${file}`)
    process.exit(1)
  }

  log(`\nImportando listas de buena fe desde: ${file}`)
  if (dryRun) log("  [DRY RUN — no se escribirá nada en la base de datos]\n")

  const content = fs.readFileSync(file, "utf-8")
  const rows = parseCSV(content)

  if (rows.length === 0) {
    console.error("El CSV está vacío o no tiene datos después del encabezado.")
    process.exit(1)
  }

  // Validar columnas
  const missing = REQUIRED_COLS.filter((c) => !(c in rows[0]))
  if (missing.length > 0) {
    console.error(`Columnas faltantes en el CSV: ${missing.join(", ")}`)
    console.error(`Se esperan: ${REQUIRED_COLS.join(", ")}`)
    process.exit(1)
  }

  const db = createAdminClient()

  // Cargar datos base
  const categories = await loadCategories(db)
  const playersCache = await loadPlayers(db)

  // Estado por categoría (para no recargar cada vez)
  const teamsByCategory = new Map<string, Map<string, TeamRow>>()
  const tpByCategory = new Map<string, Map<string, Set<string>>>()

  const created = { teams: 0, players: 0, teamPlayers: 0 }
  let errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const lineNum = i + 2 // +1 header, +1 base-0
    const { categoria, equipo, capitan, jugador } = row

    if (!categoria || !equipo || !capitan || !jugador) {
      err(`Línea ${lineNum}: faltan campos requeridos`)
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

    // ── Equipos de esa categoría (cache) ──
    if (!teamsByCategory.has(cat.id)) {
      teamsByCategory.set(cat.id, await loadTeamsByCategory(db, cat.id))
    }
    const teamsMap = teamsByCategory.get(cat.id)!

    if (!tpByCategory.has(cat.id)) {
      tpByCategory.set(cat.id, await loadTeamPlayersByCategory(db, cat.id))
    }
    const tpMap = tpByCategory.get(cat.id)!

    // ── Equipo ──
    const teamSlug = slugify(equipo)
    let team = teamsMap.get(teamSlug)

    if (!team) {
      if (!dryRun) {
        const { data, error } = await db
          .from("teams")
          .insert({ category_id: cat.id, name: equipo, slug: teamSlug, captain_name: capitan })
          .select("id, name, slug, category_id")
          .single()
        if (error) {
          err(`Línea ${lineNum}: error creando equipo "${equipo}": ${error.message}`)
          errors++
          continue
        }
        team = data as TeamRow
        teamsMap.set(teamSlug, team)
      } else {
        // Dry-run: simular ID
        team = { id: `[new:team:${teamSlug}]`, name: equipo, slug: teamSlug, category_id: cat.id }
        teamsMap.set(teamSlug, team)
      }
      ok(`Equipo creado: "${equipo}" (${cat.name})${dryRun ? " [dry-run]" : ""}`)
      created.teams++
    } else if (team.name !== equipo && !dryRun) {
      // Actualizar captain_name si cambió
      await db.from("teams").update({ captain_name: capitan }).eq("id", team.id)
    }

    // ── Jugador ──
    const displayName = jugador
    let player = playersCache.get(displayName.toLowerCase())

    if (!player) {
      const { first_name, last_name } = parseName(displayName)
      if (!dryRun) {
        const { data, error } = await db
          .from("players")
          .insert({ first_name, last_name, display_name: displayName })
          .select("id, display_name")
          .single()
        if (error) {
          err(`Línea ${lineNum}: error creando jugador "${displayName}": ${error.message}`)
          errors++
          continue
        }
        player = data as PlayerRow
        playersCache.set(displayName.toLowerCase(), player)
      } else {
        player = { id: `[new:player:${slugify(displayName)}]`, display_name: displayName }
        playersCache.set(displayName.toLowerCase(), player)
      }
      ok(`Jugador creado: "${displayName}"${dryRun ? " [dry-run]" : ""}`)
      created.players++
    }

    // ── Validar que no esté en otro equipo de la misma categoría ──
    const playerTeams = tpMap.get(player.id) ?? new Set()
    for (const existingTeamId of playerTeams) {
      if (existingTeamId !== team.id) {
        err(
          `Línea ${lineNum}: "${displayName}" ya está activo en otro equipo de ${cat.name} (team_id: ${existingTeamId})`,
        )
        errors++
        continue
      }
    }
    if (playerTeams.has(team.id)) {
      // Ya está en este equipo, saltar
      continue
    }

    // ── Asociar jugador al equipo ──
    const isCaptain = displayName.toLowerCase() === capitan.toLowerCase()

    if (!dryRun) {
      const { error } = await db.from("team_players").insert({
        team_id: team.id,
        player_id: player.id,
        is_captain: isCaptain,
        active: true,
      })
      if (error && !error.message.includes("unique")) {
        err(`Línea ${lineNum}: error asociando "${displayName}" al equipo: ${error.message}`)
        errors++
        continue
      }
      // Actualizar cache de tp
      if (!tpMap.has(player.id)) tpMap.set(player.id, new Set())
      tpMap.get(player.id)!.add(team.id)
    }

    ok(
      `${isCaptain ? "Capitán " : "Jugador "}"${displayName}" → "${equipo}" (${cat.name})${dryRun ? " [dry-run]" : ""}`,
    )
    created.teamPlayers++
  }

  log("\n── Resumen ──────────────────────────────────")
  log(`  Equipos creados:   ${created.teams}`)
  log(`  Jugadores creados: ${created.players}`)
  log(`  Asociaciones:      ${created.teamPlayers}`)
  if (errors > 0) {
    log(`  Errores:           ${errors}`)
    process.exit(1)
  } else {
    log(`  Errores:           0`)
    log(dryRun ? "\n  Dry run completado. Revisá la salida y ejecutá sin --dry-run." : "\n  Importación completada.")
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
