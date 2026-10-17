/* eslint-disable */
// Uso puntual: completa parejas de dobles con un solo jugador vinculado.
//   npx tsx scripts/_completar-parejas.ts            → comprobación (no escribe)
//   npx tsx scripts/_completar-parejas.ts --apply    → aplica
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local", quiet: true })
import { createAdminClient } from "./lib/db"

const apply = process.argv.includes("--apply")
// participante → [jugador 1, jugador 2]; "renombrar" convierte un jugador con solo el apellido en el nombre completo.
const parejas = [
  { id: "5bda8658-f1be-4a43-a59e-90cae007f9ff", label: "Monte Carlo Mixto Segunda", p1: { nombre: "Michel Omar" }, p2: { nombre: "Toro Mariana" } },
  { id: "852caf65-c908-4a3d-a2cb-ba4fb4d3f8bc", label: "Monte Carlo Mixto Segunda", p1: { nombre: "Marcos Lucas" }, p2: { nombre: "Romero Marcela" } },
  { id: "55b3e060-1a22-4280-af27-a5843a4a26db", label: "Roland Garros Caballeros Segunda", p1: { nombre: "Alfieri Walter Hugo", actual: "Alfieri" }, p2: { nombre: "Olmedo Pablo" } },
]
const norm = (t: string) => t.trim().replace(/\s+/g, " ").toLowerCase()

async function main() {
  const db = createAdminClient()
  const { data } = await db.from("players").select("id, display_name, active")
  const players = (data ?? []).filter((p) => p.active).map((p) => ({ id: p.id as string, name: String(p.display_name) }))
  const split = (n: string) => { const [first, ...rest] = n.split(" "); return { first_name: first, last_name: rest.join(" ") } }

  async function resolve(spec: { nombre: string; actual?: string }, current: string | null): Promise<{ id: string; accion: string }> {
    const exact = players.filter((p) => norm(p.name) === norm(spec.nombre))
    if (exact.length === 1) return { id: exact[0].id, accion: "existe" }
    if (exact.length > 1) throw new Error(`Hay más de un jugador "${spec.nombre}"`)
    if (spec.actual && current && players.find((p) => p.id === current && norm(p.name) === norm(spec.actual!))) {
      if (apply) {
        const { error } = await db.from("players").update({ display_name: spec.nombre, ...split(spec.nombre) }).eq("id", current)
        if (error) throw new Error(error.message)
        players.find((p) => p.id === current)!.name = spec.nombre
      }
      return { id: current, accion: `renombrar "${spec.actual}" → "${spec.nombre}"` }
    }
    if (apply) {
      const { data: created, error } = await db.from("players").insert({ display_name: spec.nombre, ...split(spec.nombre), active: true }).select("id").single()
      if (error || !created) throw new Error(`No se pudo crear ${spec.nombre}: ${error?.message}`)
      players.push({ id: created.id as string, name: spec.nombre })
      return { id: created.id as string, accion: "crear" }
    }
    return { id: `(nuevo) ${spec.nombre}`, accion: "crear" }
  }

  for (const p of parejas) {
    const { data: part } = await db.from("circuito_participants").select("id, display_name, player_id, player_2_id").eq("id", p.id).maybeSingle()
    if (!part) { console.log(`✗ no existe el participante ${p.id}`); continue }
    const r1 = await resolve(p.p1, part.player_id as string | null)
    const r2 = await resolve(p.p2, part.player_2_id as string | null)
    const nombre = `${p.p1.nombre} / ${p.p2.nombre}`
    console.log(`${apply ? "✓" : "•"} ${p.label}: "${part.display_name}" → "${nombre}"   [${p.p1.nombre}: ${r1.accion}] [${p.p2.nombre}: ${r2.accion}]`)
    if (apply) {
      const { error } = await db.from("circuito_participants").update({ player_id: r1.id, player_2_id: r2.id, display_name: nombre }).eq("id", p.id)
      if (error) throw new Error(error.message)
    }
  }
  if (!apply) console.log("\nComprobación: no se escribió nada. Para aplicar: npx tsx scripts/_completar-parejas.ts --apply")
}
main().catch((e) => { console.error(e); process.exit(1) })
