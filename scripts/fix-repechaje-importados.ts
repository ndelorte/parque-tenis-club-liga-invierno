/**
 * Revisa los cuadros de eliminación del Circuito que NO se armaron desde el
 * panel (importados de Challonge) y repara lo que pudo tocar por error el
 * repechaje nuevo de la versión del 2026-10-05:
 *
 *  1. Repechajes "vacíos" que la página creó sobre un cuadro importado: se
 *     borran (con --apply). Solo se borran si TODAS sus filas están vacías
 *     (sin jugadores ni resultado).
 *  2. Partidos del cuadro principal que quedaron con los dos jugadores pero
 *     sin resultado: señal de que se limpió un resultado importado. Solo se
 *     informan: para recuperarlos hay que volver a importar ese torneo
 *     (npm run import:challonge).
 *
 * Uso:
 *   npm run fix:repechaje-importados             → informe (no cambia nada)
 *   npm run fix:repechaje-importados -- --apply  → borra los repechajes vacíos
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok, warn } from "./lib/utils"
import { selectDrawRule } from "../lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../lib/circuito/formatSpec"
import { isPanelGeneratedBracket, type BracketSlotMatch } from "../lib/circuito/syncBracketSlots"

async function main() {
  const apply = parseArgs(process.argv.slice(2))["apply"] === true
  const db = createAdminClient()

  const { data: categories, error } = await db
    .from("circuito_categories")
    .select("id, name, slug, draw_size, circuito_editions!inner(name)")
    .not("draw_size", "is", null)
  if (error || !categories) throw new Error(`Error leyendo categorías: ${error?.message}`)

  let emptyRepechajes = 0
  let withLostResults = 0

  for (const category of categories) {
    const rule = selectDrawRule(category.draw_size as number, CIRCUITO_FORMAT_SPEC)
    if (rule?.format !== "single_elimination") continue

    const [{ data: participants }, { data: matches }] = await Promise.all([
      db.from("circuito_participants").select("id, seed").eq("category_id", category.id),
      db.from("circuito_matches").select("*").eq("category_id", category.id),
    ])
    const rows = matches ?? []
    const slotMatches: BracketSlotMatch[] = rows.map((r) => ({
      id: r.id,
      bracket: r.bracket,
      round: r.round_number,
      position: r.position,
      zone: r.zone,
      participantAId: r.participant_a_id,
      participantBId: r.participant_b_id,
      winnerId: r.winner_id,
      score: r.score,
    }))
    const fromPanel = isPanelGeneratedBracket(
      (participants ?? []).map((p) => ({ id: p.id, seed: p.seed })),
      slotMatches,
      CIRCUITO_FORMAT_SPEC,
    )
    if (fromPanel) continue

    const edition = (category as unknown as { circuito_editions: { name: string } }).circuito_editions.name
    const label = `${edition} — ${category.name}`
    const repechaje = rows.filter((r) => r.bracket === "repechaje")
    const allEmpty = repechaje.length > 0 && repechaje.every((r) => !r.participant_a_id && !r.participant_b_id && !r.winner_id && !r.score)
    const lost = rows.filter((r) => r.bracket === "main" && r.participant_a_id && r.participant_b_id && !r.winner_id)

    if (!allEmpty && lost.length === 0) continue
    log(`• ${label}`)
    if (allEmpty) {
      emptyRepechajes++
      warn(`    repechaje vacío creado sobre un cuadro importado (${repechaje.length} partidos)`)
      if (apply) {
        const { error: delError } = await db.from("circuito_matches").delete().eq("category_id", category.id).eq("bracket", "repechaje")
        if (delError) throw new Error(`No se pudo borrar: ${delError.message}`)
        ok("    repechaje vacío borrado")
      }
    }
    if (lost.length > 0) {
      withLostResults++
      warn(`    ${lost.length} partido(s) del principal con los dos jugadores y SIN resultado → posible resultado perdido; volver a importar este torneo`)
    }
  }

  log("")
  log(`Repechajes vacíos sobre cuadros importados: ${emptyRepechajes}${apply ? " (borrados)" : ""}`)
  log(`Categorías con posibles resultados perdidos: ${withLostResults}`)
  if (!apply && emptyRepechajes > 0) log("Para borrar los repechajes vacíos: npm run fix:repechaje-importados -- --apply")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
