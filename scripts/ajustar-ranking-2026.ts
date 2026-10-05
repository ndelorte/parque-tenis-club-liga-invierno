/**
 * Compara los puntos de ranking guardados de 2026 con los que da la regla
 * aplicada a los partidos cargados, y corrige las categorías donde lo guardado
 * es MENOR que la regla (jugadores sin fila, o campeón/subcampeón con puntos
 * de más abajo).
 *
 * NO toca:
 *  - categorías sin puntos guardados (para eso: npm run recalc:ranking-faltante);
 *  - categorías donde algún jugador tiene MÁS puntos guardados que la regla
 *    (p. ej. las zonas de enero que la planilla puntuaba con otra tabla).
 *
 * Uso:
 *   npm run ajustar:ranking             → informe (no escribe nada)
 *   npm run ajustar:ranking -- --apply  → recalcula esas categorías y guarda
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok } from "./lib/utils"
import { selectDrawRule } from "../lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../lib/circuito/formatSpec"
import { isGrandSlamMonth } from "../lib/circuito/pointsTable"
import { calculateRankingPoints } from "../lib/circuito/calculateRankingPoints"
import { recalculateAndPersistCircuitRanking } from "../lib/data/circuito/ranking"

async function main() {
  const apply = parseArgs(process.argv.slice(2))["apply"] === true
  const db = createAdminClient()

  const { data: players } = await db.from("players").select("id, display_name")
  const nameOf = new Map((players ?? []).map((p) => [p.id as string, String(p.display_name)]))
  const { data: editions } = await db.from("circuito_editions").select("id, name, month").eq("year", 2026).order("month")

  let fixed = 0
  for (const edition of editions ?? []) {
    const { data: categories } = await db
      .from("circuito_categories")
      .select("id, name, type, draw_size")
      .eq("edition_id", edition.id)
      .not("draw_size", "is", null)

    for (const category of categories ?? []) {
      const rule = selectDrawRule(category.draw_size as number, CIRCUITO_FORMAT_SPEC)
      if (!rule) continue
      const [{ data: participants }, { data: matches }, { data: stored }] = await Promise.all([
        db.from("circuito_participants").select("*").eq("category_id", category.id),
        db.from("circuito_matches").select("*").eq("category_id", category.id),
        db.from("circuito_ranking_points").select("player_id, points").eq("category_id", category.id),
      ])
      if (!participants?.length || !matches?.length) continue
      const have = new Map((stored ?? []).filter((r) => (r.points as number) > 0).map((r) => [r.player_id as string, r.points as number]))
      if (have.size === 0) continue // sin puntos guardados: lo hace recalc:ranking-faltante

      const pts = calculateRankingPoints({
        format: rule.format,
        participants: participants.map((p) => ({ id: p.id, seed: p.seed })),
        matches: matches.map((m) => ({
          bracket: m.bracket, round: m.round_number, position: m.position, zone: m.zone,
          participantAId: m.participant_a_id, participantBId: m.participant_b_id, winnerId: m.winner_id, score: m.score,
        })),
        isGrandSlam: isGrandSlamMonth(edition.month),
      })
      const expected = new Map<string, number>()
      for (const p of participants) {
        const v = pts.get(p.id) ?? 0
        if (v <= 0) continue
        for (const id of [p.player_id, p.player_2_id]) if (id) expected.set(id, Math.max(expected.get(id) ?? 0, v))
      }

      const lines: string[] = []
      let higher = false
      for (const id of new Set([...expected.keys(), ...have.keys()])) {
        const a = have.get(id) ?? 0
        const b = expected.get(id) ?? 0
        if (a === b) continue
        if (a > b) higher = true
        lines.push(`${(nameOf.get(id) ?? id).padEnd(28)} guardado ${String(a).padStart(5)} → regla ${String(b).padStart(5)}`)
      }
      if (lines.length === 0 || higher) continue

      fixed++
      log(`• ${edition.name} — ${category.name} (${category.type}, ${category.draw_size} inscriptos): ${lines.length} jugador(es)`)
      lines.forEach((l) => log(`    ${l}`))
      if (apply) {
        await recalculateAndPersistCircuitRanking(category.id)
        ok("    guardado")
      }
    }
  }

  log(`\n${fixed} categoría(s) con puntos por corregir${apply ? " (guardadas)" : ""}.`)
  if (!apply && fixed > 0) log("Para guardarlas: npm run ajustar:ranking -- --apply")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
