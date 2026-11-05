/**
 * Unifica el ranking de dobles mixtos del Circuito 2026 en UNA sola categoría,
 * "Doble Mixto Intermedia" (slug `mixto-intermedia-dobles`, sin cambios).
 *
 *  1. Borra las categorías "Mixto Segunda" (slug `mixto-segunda-dobles`) de
 *     Monte Carlo y Roland Garros, con sus inscriptos, partidos y puntos
 *     (las FK hacen cascade desde circuito_categories). Se conservan los
 *     puntos de la planilla, cargados en "Mixto Intermedia".
 *  2. Renombra todas las categorías con slug `mixto-intermedia-dobles` a
 *     "Doble Mixto Intermedia".
 *
 * Los jugadores duplicados se unifican después con `npm run dedupe:players -- --merge`.
 *
 * Uso:
 *   npx tsx scripts/unificar-mixto-2026.ts             → informe (no escribe nada)
 *   npx tsx scripts/unificar-mixto-2026.ts --apply     → borra y renombra
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok, warn } from "./lib/utils"

const NEW_NAME = "Doble Mixto Intermedia"
const KEEP_SLUG = "mixto-intermedia-dobles"
const OLD_SLUG = "mixto-segunda-dobles"
// Ids confirmados en producción (Monte Carlo y Roland Garros).
const SEGUNDA_IDS = ["079e2dc0-728c-40f0-895d-34870032934e", "b5318bad-5c5f-4e8e-bede-e8e6067914e6"]

async function main() {
  const apply = parseArgs(process.argv.slice(2))["apply"] === true
  const db = createAdminClient()

  const { data: editions } = await db.from("circuito_editions").select("id, name, slug")
  const editionName = new Map((editions ?? []).map((e) => [e.id as string, String(e.name)]))

  // 1) Categorías "Mixto Segunda" a borrar.
  const { data: segunda, error: segErr } = await db
    .from("circuito_categories")
    .select("id, name, slug, edition_id")
    .eq("slug", OLD_SLUG)
  if (segErr) throw new Error(`Leyendo categorías: ${segErr.message}`)
  const unexpected = (segunda ?? []).filter((c) => !SEGUNDA_IDS.includes(c.id as string))
  if (unexpected.length > 0 || (segunda ?? []).length !== SEGUNDA_IDS.length) {
    throw new Error(`Las categorías "${OLD_SLUG}" no coinciden con las esperadas (${SEGUNDA_IDS.join(", ")}): ${JSON.stringify(segunda)}`)
  }

  log(`\n${apply ? "APLICANDO" : "INFORME (no se escribe nada)"}\n`)
  for (const cat of segunda ?? []) {
    const id = cat.id as string
    const [parts, matches, points] = await Promise.all([
      db.from("circuito_participants").select("id", { count: "exact", head: true }).eq("category_id", id),
      db.from("circuito_matches").select("id", { count: "exact", head: true }).eq("category_id", id),
      db.from("circuito_ranking_points").select("id", { count: "exact", head: true }).eq("category_id", id),
    ])
    log(
      `• BORRAR "${cat.name}" de ${editionName.get(cat.edition_id as string)} (${id}): ` +
        `${parts.count ?? 0} inscriptos, ${matches.count ?? 0} partidos, ${points.count ?? 0} filas de puntos`,
    )
    if (apply) {
      const { error } = await db.from("circuito_categories").delete().eq("id", id)
      if (error) throw new Error(`Borrando ${id}: ${error.message}`)
    }
  }

  // 2) Renombrar "Mixto Intermedia" → "Doble Mixto Intermedia".
  const { data: keep, error: keepErr } = await db
    .from("circuito_categories")
    .select("id, name, edition_id")
    .eq("slug", KEEP_SLUG)
  if (keepErr) throw new Error(`Leyendo categorías: ${keepErr.message}`)
  for (const cat of keep ?? []) {
    const label = `${editionName.get(cat.edition_id as string)}: "${cat.name}" → "${NEW_NAME}"`
    if (cat.name === NEW_NAME) {
      log(`• ya renombrada  ${label}`)
      continue
    }
    log(`• RENOMBRAR      ${label}`)
    if (apply) {
      const { error } = await db.from("circuito_categories").update({ name: NEW_NAME }).eq("id", cat.id as string)
      if (error) throw new Error(`Renombrando ${cat.id}: ${error.message}`)
    }
  }

  const withoutMixto = (editions ?? []).filter((e) => !(keep ?? []).some((c) => c.edition_id === e.id))
  for (const e of withoutMixto) warn(`  (la edición ${e.name} no tiene categoría ${KEEP_SLUG}; no se crea)`)

  if (apply) ok("\nListo.")
  else log("\nEsto fue solo un informe. Para aplicar: npx tsx scripts/unificar-mixto-2026.ts --apply\n")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
