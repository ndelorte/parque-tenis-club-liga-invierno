/**
 * Validador de datos importados.
 *
 * Uso:
 *   npm run validate:data
 *   npm run validate:data -- --category "Caballeros A"
 *
 * Revisa:
 *   - Cantidad de equipos por categoría vs. teams_count esperado
 *   - Equipos sin jugadores
 *   - Equipos sin capitán
 *   - Jugadores activos en dos equipos de la misma categoría
 *   - Series con equipos inexistentes
 *   - Series duplicadas (mismo round, mismo par)
 *   - Series sin horario
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok, warn, err } from "./lib/utils"

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const filterCategory = args["category"] as string | undefined

  const db = createAdminClient()
  let totalIssues = 0

  log("\nValidando datos importados…\n")

  // ── 1. Cargar categorías ──
  const { data: categories, error: catErr } = await db
    .from("categories")
    .select("id, name, teams_count")
    .order("sort_order")

  if (catErr || !categories) throw new Error(`Error cargando categorías: ${catErr?.message}`)

  const filtered = filterCategory
    ? categories.filter((c) => c.name.toLowerCase() === filterCategory.toLowerCase())
    : categories

  if (filtered.length === 0) {
    console.error(`No se encontraron categorías${filterCategory ? ` con nombre "${filterCategory}"` : ""}.`)
    process.exit(1)
  }

  for (const cat of filtered) {
    log(`─── ${cat.name} ─────────────────────────────`)

    // ── 2. Equipos ──
    const { data: teams } = await db
      .from("teams")
      .select("id, name, captain_name, active")
      .eq("category_id", cat.id)
      .eq("active", true)

    const teamList = teams ?? []
    const teamCount = teamList.length

    if (teamCount !== cat.teams_count) {
      warn(`Equipos: ${teamCount} / ${cat.teams_count} esperados`)
      totalIssues++
    } else {
      ok(`Equipos: ${teamCount} / ${cat.teams_count}`)
    }

    for (const team of teamList) {
      // Capitán
      if (!team.captain_name) {
        warn(`  "${team.name}" no tiene capitán`)
        totalIssues++
      }

      // Jugadores
      const { count } = await db
        .from("team_players")
        .select("player_id", { count: "exact" })
        .eq("team_id", team.id)
        .eq("active", true)

      const playerCount = count ?? 0
      if (playerCount === 0) {
        err(`  "${team.name}" no tiene jugadores`)
        totalIssues++
      } else {
        ok(`  "${team.name}": ${playerCount} jugador(es)${team.captain_name ? `, capitán: ${team.captain_name}` : ""}`)
      }
    }

    // ── 3. Jugadores en dos equipos de la misma categoría ──
    const teamIds = teamList.map((t) => t.id)
    if (teamIds.length > 0) {
      const { data: tpAll } = await db
        .from("team_players")
        .select("player_id, team_id")
        .in("team_id", teamIds)
        .eq("active", true)

      const playerTeams = new Map<string, string[]>()
      for (const tp of (tpAll ?? []) as { player_id: string; team_id: string }[]) {
        if (!playerTeams.has(tp.player_id)) playerTeams.set(tp.player_id, [])
        playerTeams.get(tp.player_id)!.push(tp.team_id)
      }
      for (const [playerId, tids] of playerTeams) {
        if (tids.length > 1) {
          err(`  Jugador ${playerId} está activo en ${tids.length} equipos de ${cat.name}`)
          totalIssues++
        }
      }
    }

    // ── 4. Series ──
    const { data: series } = await db
      .from("series")
      .select("id, round_id, home_team_id, away_team_id, scheduled_time")
      .eq("category_id", cat.id)

    const seriesList = series ?? []

    if (seriesList.length === 0) {
      warn(`No hay series importadas para ${cat.name}`)
    } else {
      ok(`Series: ${seriesList.length}`)
    }

    // Series con equipo inexistente en la categoría
    const teamIdSet = new Set(teamList.map((t) => t.id))
    const orphanSeries = (seriesList as { id: string; home_team_id: string; away_team_id: string; scheduled_time: string | null }[]).filter(
      (s) => !teamIdSet.has(s.home_team_id) || !teamIdSet.has(s.away_team_id),
    )
    if (orphanSeries.length > 0) {
      err(`  ${orphanSeries.length} serie(s) referencian equipos fuera de la categoría`)
      totalIssues += orphanSeries.length
    }

    // Series duplicadas
    const seriesKeys = new Set<string>()
    let dupes = 0
    for (const s of seriesList as { id: string; round_id: string; home_team_id: string; away_team_id: string }[]) {
      const key = `${s.round_id}:${s.home_team_id}:${s.away_team_id}`
      if (seriesKeys.has(key)) dupes++
      else seriesKeys.add(key)
    }
    if (dupes > 0) {
      err(`  ${dupes} serie(s) duplicadas`)
      totalIssues += dupes
    }

    // Series sin horario
    const noTime = (seriesList as { scheduled_time: string | null }[]).filter((s) => !s.scheduled_time).length
    if (noTime > 0) {
      warn(`  ${noTime} serie(s) sin horario`)
    }

    log("")
  }

  log("── Resultado ─────────────────────────────────")
  if (totalIssues === 0) {
    ok("Todos los datos son válidos.")
  } else {
    err(`${totalIssues} problema(s) encontrado(s). Revisá los mensajes anteriores.`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
