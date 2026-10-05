/**
 * Deja los nombres de los jugadores del ranking en el formato del sitio,
 * "Apellido Nombre". Detecta los que están escritos "Nombre Apellido" y propone
 * darlos vuelta; vos revisás el archivo antes de aplicar.
 *
 * Uso:
 *   1) npm run nombres:normalizar
 *        Escribe scripts/nombres-propuestos.json con los cambios propuestos y
 *        la lista de nombres dudosos. No cambia nada en la base.
 *   2) Revisar el archivo: en cada cambio podés corregir "propuesto" o poner
 *      "aplicar": false para saltearlo.
 *   3) npm run nombres:normalizar -- --apply
 *        Renombra los jugadores y actualiza el nombre de sus inscripciones.
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { existsSync, readFileSync, writeFileSync } from "fs"
import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok, warn } from "./lib/utils"
import { nameKey } from "../lib/players/similarNames"
import { suggestSurnameFirst } from "../lib/players/surnameFirst"

const FILE = "scripts/nombres-propuestos.json"

interface Change { id: string; actual: string; propuesto: string; aplicar: boolean; nota?: string }

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const db = createAdminClient()
  if (args["apply"] === true) return apply(db)

  const [{ data: players }, { data: ranked }, { data: part }] = await Promise.all([
    db.from("players").select("id, display_name").eq("active", true),
    db.from("circuito_ranking_points").select("player_id"),
    db.from("circuito_participants").select("player_id, player_2_id"),
  ])
  const inCircuito = new Set<string>()
  for (const r of ranked ?? []) inCircuito.add(r.player_id as string)
  for (const p of part ?? []) {
    if (p.player_id) inCircuito.add(p.player_id as string)
    if (p.player_2_id) inCircuito.add(p.player_2_id as string)
  }

  const all = (players ?? []).map((p) => ({ id: p.id as string, name: String(p.display_name) }))
  const keyOwners = new Map<string, string[]>()
  for (const p of all) keyOwners.set(nameKey(p.name), [...(keyOwners.get(nameKey(p.name)) ?? []), p.id])

  const changes: Change[] = []
  const ambiguous: string[] = []
  let okCount = 0
  let single = 0
  for (const p of all.filter((x) => inCircuito.has(x.id))) {
    const v = suggestSurnameFirst(p.name)
    if (v.kind === "ok") okCount++
    else if (v.kind === "single") single++
    else if (v.kind === "ambiguous") ambiguous.push(p.name)
    else {
      const clash = (keyOwners.get(nameKey(v.suggested)) ?? []).filter((id) => id !== p.id)
      changes.push({
        id: p.id,
        actual: p.name,
        propuesto: v.suggested,
        aplicar: clash.length === 0,
        ...(clash.length > 0 ? { nota: "ya existe otro jugador con ese nombre: unificarlos primero (npm run dedupe:players)" } : {}),
      })
    }
  }

  changes.sort((a, b) => a.actual.localeCompare(b.actual, "es"))
  writeFileSync(FILE, JSON.stringify({ cambios: changes, dudosos_revisar_a_mano: ambiguous.sort() }, null, 2))
  ok(`${changes.length} nombre(s) a dar vuelta → ${FILE}`)
  log(`   ya en "Apellido Nombre" (o sin poder saberlo): ${okCount} · una sola palabra: ${single} · dudosos: ${ambiguous.length}`)
  if (changes.some((c) => !c.aplicar)) warn("   Hay cambios marcados como aplicar:false (el nombre nuevo ya existe en otro jugador).")
  warn("   Revisá el archivo y después: npm run nombres:normalizar -- --apply")
}

async function apply(db: ReturnType<typeof createAdminClient>) {
  if (!existsSync(FILE)) throw new Error(`No existe ${FILE}. Primero: npm run nombres:normalizar`)
  const { cambios } = JSON.parse(readFileSync(FILE, "utf8")) as { cambios: Change[] }
  const todo = cambios.filter((c) => c.aplicar)

  // No pisar un nombre que ya tiene otro jugador.
  const { data: active } = await db.from("players").select("id, display_name").eq("active", true)
  const owners = new Map<string, string[]>()
  for (const p of active ?? []) owners.set(nameKey(String(p.display_name)), [...(owners.get(nameKey(String(p.display_name))) ?? []), p.id as string])

  const renamed: string[] = []
  for (const c of todo) {
    const clash = (owners.get(nameKey(c.propuesto)) ?? []).filter((id) => id !== c.id)
    if (clash.length > 0) { warn(`Se omite "${c.actual}" → "${c.propuesto}": ya existe otro jugador con ese nombre`); continue }
    const display = c.propuesto.trim().replace(/\s+/g, " ")
    const [first, ...rest] = display.split(" ")
    const { error } = await db.from("players").update({ display_name: display, first_name: first, last_name: rest.join(" ") }).eq("id", c.id)
    if (error) throw new Error(`No se pudo renombrar "${c.actual}": ${error.message}`)
    renamed.push(c.id)
    ok(`${c.actual}  →  ${display}`)
  }

  // El nombre de cada inscripción del Circuito es una copia: se recalcula.
  if (renamed.length > 0) {
    const list = renamed.join(",")
    const { data: affected } = await db.from("circuito_participants").select("id, player_id, player_2_id").or(`player_id.in.(${list}),player_2_id.in.(${list})`)
    const ids = [...new Set((affected ?? []).flatMap((p) => [p.player_id, p.player_2_id]).filter(Boolean) as string[])]
    const { data: ps } = await db.from("players").select("id, display_name").in("id", ids)
    const nameOf = (id: string) => String(ps?.find((p) => p.id === id)?.display_name ?? "?")
    for (const p of affected ?? []) {
      if (!p.player_id) continue
      const display = p.player_2_id ? `${nameOf(p.player_id)} / ${nameOf(p.player_2_id)}` : nameOf(p.player_id)
      await db.from("circuito_participants").update({ display_name: display }).eq("id", p.id)
    }
    log(`\nActualizadas ${affected?.length ?? 0} inscripción(es).`)
  }
  log(`${renamed.length} jugador(es) renombrados.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
