/**
 * Recalcula los puntos de ranking de todas las categorías de las ediciones con
 * puntos "en vivo" (LIVE_POINTS_EDITION_SLUGS en lib/circuito/livePoints.ts:
 * hoy `circuito-2026-10` China Open y `circuito-2026-11` Paris Open, 2026), que suman al ganar y no solo al perder.
 *
 * Correrlo una vez al activar el modo en vivo, para los partidos ya cargados.
 * No hace falta correrlo de nuevo al terminar el torneo: al finalizar, el modo
 * en vivo y la regla normal dan los mismos puntos.
 *
 * Uso:
 *   npm run recalc:ranking-en-vivo             → informe (no escribe nada)
 *   npm run recalc:ranking-en-vivo -- --apply  → recalcula y guarda
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok } from "./lib/utils"
import { LIVE_POINTS_EDITION_SLUGS } from "../lib/circuito/livePoints"
import { recalculateAndPersistCircuitRanking } from "../lib/data/circuito/ranking"

async function main() {
  const apply = parseArgs(process.argv.slice(2))["apply"] === true
  const db = createAdminClient()

  const { data: editions, error } = await db
    .from("circuito_editions")
    .select("id, name, slug")
    .in("slug", [...LIVE_POINTS_EDITION_SLUGS])
  if (error) throw new Error(error.message)
  if (!editions?.length) return log(`No se encontraron las ediciones en vivo: ${LIVE_POINTS_EDITION_SLUGS.join(", ")}.`)

  log(`Ediciones con puntos EN VIVO: ${LIVE_POINTS_EDITION_SLUGS.join(", ")}`)
  for (const edition of editions) {
    const { data: categories } = await db
      .from("circuito_categories")
      .select("id, name")
      .eq("edition_id", edition.id)
      .not("draw_size", "is", null)
    log(`• ${edition.name} (${edition.slug}): ${categories?.length ?? 0} categoría(s)`)
    if (!apply) continue
    for (const category of categories ?? []) {
      await recalculateAndPersistCircuitRanking(category.id)
      ok(`    ${category.name}`)
    }
  }
  if (!apply) log("Para guardar: npm run recalc:ranking-en-vivo -- --apply")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
