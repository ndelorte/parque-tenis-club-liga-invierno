/**
 * Calcula los puntos de ranking de las categorías 2026 que tienen cuadro
 * jugado pero NINGUNA fila en circuito_ranking_points (típico de los torneos
 * importados de Challonge antes de que el importador calculara puntos).
 *
 * Solo toca categorías sin filas: nunca pisa puntos de la planilla del club
 * (enero-junio) ni los ya calculados.
 *
 * Uso:
 *   npm run recalc:ranking-faltante             → informe (no escribe nada)
 *   npm run recalc:ranking-faltante -- --apply  → calcula y guarda los puntos
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok, warn } from "./lib/utils"
import { selectDrawRule } from "../lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../lib/circuito/formatSpec"
import { isGrandSlamMonth } from "../lib/circuito/pointsTable"
import { calculateRankingPoints } from "../lib/circuito/calculateRankingPoints"
import { recalculateAndPersistCircuitRanking } from "../lib/data/circuito/ranking"

async function main() {
  const apply = parseArgs(process.argv.slice(2))["apply"] === true
  const db = createAdminClient()

  const { data: editions } = await db.from("circuito_editions").select("id, name, month").eq("year", 2026).order("month")
  let pending = 0

  for (const edition of editions ?? []) {
    const { data: categories } = await db
      .from("circuito_categories")
      .select("id, name, draw_size")
      .eq("edition_id", edition.id)
      .not("draw_size", "is", null)

    for (const category of categories ?? []) {
      const { count } = await db.from("circuito_ranking_points").select("id", { count: "exact", head: true }).eq("category_id", category.id)
      if ((count ?? 0) > 0) continue

      const rule = selectDrawRule(category.draw_size as number, CIRCUITO_FORMAT_SPEC)
      if (!rule) continue
      const [{ data: participants }, { data: matches }] = await Promise.all([
        db.from("circuito_participants").select("*").eq("category_id", category.id),
        db.from("circuito_matches").select("*").eq("category_id", category.id),
      ])
      if (!participants?.length || !matches?.length) continue

      const points = calculateRankingPoints({
        format: rule.format,
        participants: participants.map((p) => ({ id: p.id, seed: p.seed })),
        matches: matches.map((m) => ({
          bracket: m.bracket,
          round: m.round_number,
          zone: m.zone,
          participantAId: m.participant_a_id,
          participantBId: m.participant_b_id,
          winnerId: m.winner_id,
          score: m.score,
        })),
        isGrandSlam: isGrandSlamMonth(edition.month),
      })

      const scored = participants.filter((p) => (points.get(p.id) ?? 0) > 0)
      if (scored.length === 0) continue
      pending++

      const top = [...scored].sort((a, b) => (points.get(b.id) ?? 0) - (points.get(a.id) ?? 0)).slice(0, 3)
      log(`• ${edition.name} — ${category.name}  (${category.draw_size} inscriptos, ${rule.format})`)
      log(`    suman puntos ${scored.length} participantes · arriba: ${top.map((p) => `${p.display_name} ${points.get(p.id)}`).join(" | ")}`)
      const unlinked = scored.filter((p) => !p.player_id)
      if (unlinked.length > 0) warn(`    SIN jugador vinculado (no sumarían al ranking): ${unlinked.map((p) => p.display_name).join(", ")}`)

      if (apply) {
        await recalculateAndPersistCircuitRanking(category.id)
        ok("    puntos guardados")
      }
    }
  }

  log("")
  log(pending === 0 ? "No hay categorías con cuadro jugado y sin puntos." : `${pending} categoría(s) con puntos por calcular${apply ? " (guardados)" : ""}.`)
  if (!apply && pending > 0) log("Para guardarlos: npm run recalc:ranking-faltante -- --apply")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
