/**
 * Vincula a un jugador real los participantes del Circuito 2026 que quedaron
 * sin jugador (típico de lo importado de Challonge: apodos, errores de tipeo,
 * parejas de dobles con solo los apellidos). Sin jugador vinculado, un
 * participante no suma puntos al ranking.
 *
 * Uso (en 3 pasos):
 *   1) npm run link:participantes
 *        Escribe scripts/vinculos-participantes.json con cada nombre sin
 *        vincular y los jugadores candidatos. Completa solo los claros.
 *   2) Abrir ese archivo y, en cada "elegido", poner el jugador correcto: su
 *      nombre exacto (ej. "Ciarlantini Ignacio") o su id; null = no vincular.
 *      En dobles: uno por cada jugador ("partes").
 *   3) npm run link:participantes -- --apply
 *        Vincula lo elegido: pone el jugador en todos los participantes con ese
 *        nombre y actualiza el nombre mostrado al del jugador.
 *
 * Después de vincular: npm run recalc:ranking-faltante (calcula los puntos que faltan).
 */

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { readFileSync, writeFileSync, existsSync } from "fs"
import { createAdminClient } from "./lib/db"
import { parseArgs, log, ok, warn } from "./lib/utils"
import { compareNames, nameTokens, editDistance } from "../lib/players/similarNames"

const FILE = "scripts/vinculos-participantes.json"

// Diminutivos comunes → nombre completo.
const NICKNAMES: Record<string, string[]> = {
  nacho: ["ignacio"], facu: ["facundo"], maxi: ["maximo", "maximiliano"], maxy: ["maximo", "maximiliano"],
  jero: ["jeronimo"], leo: ["leonardo", "leandro"], nico: ["nicolas"], fede: ["federico"], santi: ["santiago"],
  gonza: ["gonzalo"], rodri: ["rodrigo"], seba: ["sebastian"], cris: ["cristian", "christian"],
  mati: ["matias"], ale: ["alejandro", "alejandra"], pablo: ["pablo"], juancho: ["juan"], lucho: ["luciano"],
  manu: ["manuel"], dami: ["damian"], ezequiel: ["exequiel"], exequiel: ["ezequiel"], gabi: ["gabriel", "gabriela"],
}

interface Player { id: string; displayName: string }
interface Candidate { id: string; nombre: string; inscripciones: number; puntos: number; equipos: number; coincidencia: string }

function isGiven(typed: string, other: string): boolean {
  if (typed === other) return true
  if (NICKNAMES[typed]?.some((n) => n === other || editDistance(n, other) <= 1)) return true
  if (typed.length >= 3 && other.startsWith(typed)) return true
  return typed.length >= 5 && editDistance(typed, other) <= 2
}

// Candidatos para un texto: mismo apellido (o parecido) y nombre de pila compatible.
function candidatesFor(text: string, players: Player[]): Array<{ player: Player; score: number; why: string }> {
  const typed = nameTokens(text)
  const out: Array<{ player: Player; score: number; why: string }> = []
  for (const p of players) {
    const cmp = compareNames(text, p.displayName)
    if (cmp === "same") { out.push({ player: p, score: 100, why: "mismo nombre" }); continue }
    if (cmp === "similar") { out.push({ player: p, score: 80, why: "nombre parecido" }); continue }
    const tokens = nameTokens(p.displayName)
    // apellido: alguna palabra larga igual/parecida; el resto del texto debe ser compatible con otra palabra del jugador
    for (const t of typed) {
      if (t.length < 4) continue
      const sur = tokens.find((u) => u === t || (u.length >= 5 && editDistance(t, u) <= 1))
      if (!sur) continue
      const restTyped = typed.filter((x) => x !== t)
      const restPlayer = tokens.filter((x) => x !== sur)
      if (restTyped.length === 0) { out.push({ player: p, score: 30, why: `mismo apellido (${sur})` }); break }
      if (restTyped.every((x) => restPlayer.some((u) => isGiven(x, u)))) {
        out.push({ player: p, score: 70, why: "apellido + nombre compatible (apodo/abreviatura)" })
      } else out.push({ player: p, score: 20, why: `mismo apellido (${sur}), otro nombre` })
      break
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 6)
}

async function main() {
  const apply = parseArgs(process.argv.slice(2))["apply"] === true
  const db = createAdminClient()

  if (apply) return applyLinks(db)

  const { data: playerRows } = await db.from("players").select("id, display_name").eq("active", true)
  const players: Player[] = (playerRows ?? []).map((p) => ({ id: p.id as string, displayName: p.display_name as string }))

  const { data } = await db
    .from("circuito_participants")
    .select("id, display_name, circuito_categories!inner(name, type, circuito_editions!inner(name, year))")
    .is("player_id", null)
  const rows = ((data ?? []) as unknown as Array<{ id: string; display_name: string; circuito_categories: { name: string; type: string; circuito_editions: { name: string; year: number } } }>).filter(
    (r) => r.circuito_categories.circuito_editions.year === 2026,
  )

  const usage = async (id: string) => {
    const [a, r, t] = await Promise.all([
      db.from("circuito_participants").select("id", { count: "exact", head: true }).or(`player_id.eq.${id},player_2_id.eq.${id}`),
      db.from("circuito_ranking_points").select("points").eq("player_id", id),
      db.from("team_players").select("id", { count: "exact", head: true }).eq("player_id", id),
    ])
    return { inscripciones: a.count ?? 0, puntos: (r.data ?? []).reduce((s, x) => s + (x.points as number), 0), equipos: t.count ?? 0 }
  }
  const toCandidates = async (text: string): Promise<Candidate[]> =>
    Promise.all(candidatesFor(text, players).map(async (c) => ({ id: c.player.id, nombre: c.player.displayName, ...(await usage(c.player.id)), coincidencia: c.why })))
  // Solo se propone solo cuando hay UN candidato con apellido y nombre compatibles
  // (o mismo nombre / nombre parecido). Con solo el apellido coincidiendo no se propone.
  const STRONG = new Set(["mismo nombre", "nombre parecido", "apellido + nombre compatible (apodo/abreviatura)"])
  const confident = (cs: Candidate[]) => {
    const same = cs.filter((c) => c.coincidencia === "mismo nombre")
    if (same.length === 1) return same[0].id
    const strong = cs.filter((c) => STRONG.has(c.coincidencia))
    return strong.length === 1 ? strong[0].id : null
  }

  // Agrupa por nombre mostrado (el mismo nombre se repite en varios torneos).
  const groups = new Map<string, { count: number; where: string[] }>()
  for (const r of rows) {
    const g = groups.get(r.display_name) ?? { count: 0, where: [] }
    g.count++
    g.where.push(`${r.circuito_categories.circuito_editions.name} — ${r.circuito_categories.name}`)
    groups.set(r.display_name, g)
  }

  const entries: unknown[] = []
  let auto = 0
  for (const [name, g] of [...groups.entries()].sort()) {
    const isDobles = /[/\-]/.test(name) && name.split(/\s*[/\-]\s*/).filter(Boolean).length >= 2
    if (isDobles) {
      const parts = name.split(/\s*[/\-]\s*/).filter(Boolean)
      const partes = []
      for (const text of parts.slice(0, 2)) {
        const candidatos = await toCandidates(text)
        const elegido = confident(candidatos)
        if (elegido) auto++
        partes.push({ texto: text, elegido, candidatos })
      }
      entries.push({ tipo: "dobles", nombre: name, veces: g.count, donde: [...new Set(g.where)], partes })
    } else {
      const candidatos = await toCandidates(name)
      const elegido = confident(candidatos)
      if (elegido) auto++
      entries.push({ tipo: "single", nombre: name, veces: g.count, donde: [...new Set(g.where)], elegido, candidatos })
    }
  }

  writeFileSync(FILE, JSON.stringify(entries, null, 2))
  ok(`${rows.length} participante(s) sin jugador, ${groups.size} nombre(s) distintos → ${FILE}`)
  log(`   ${auto} elección(es) propuesta(s) automáticamente (apellido + nombre compatible). Revisalas igual.`)
  warn("   Abrí el archivo, revisá/completá los \"elegido\" (id del jugador o null) y corré: npm run link:participantes -- --apply")
}

async function applyLinks(db: ReturnType<typeof createAdminClient>) {
  if (!existsSync(FILE)) throw new Error(`No existe ${FILE}. Primero corré: npm run link:participantes`)
  const entries = JSON.parse(readFileSync(FILE, "utf8")) as Array<{
    tipo: "single" | "dobles"
    nombre: string
    elegido?: string | null
    partes?: Array<{ texto: string; elegido: string | null }>
  }>

  const nameOf = async (id: string) => {
    const { data } = await db.from("players").select("display_name").eq("id", id).maybeSingle()
    if (!data) throw new Error(`No existe el jugador ${id}`)
    return data.display_name as string
  }

  // "elegido" puede ser el id o el nombre exacto del jugador.
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const { data: activeRows } = await db.from("players").select("id, display_name").eq("active", true)
  const resolve = (value: string | null | undefined, context: string): string | null => {
    if (!value) return null
    if (UUID.test(value)) return value
    const wanted = value.trim().toLowerCase()
    const found = (activeRows ?? []).filter((p) => String(p.display_name).trim().toLowerCase() === wanted)
    if (found.length === 1) return found[0].id as string
    throw new Error(`${context}: "${value}" ${found.length === 0 ? "no coincide con ningún jugador activo" : "coincide con más de un jugador; usá el id"}`)
  }

  let linked = 0
  for (const e of entries) {
    let p1: string | null = null
    let p2: string | null = null
    if (e.tipo === "single") p1 = resolve(e.elegido, e.nombre)
    else {
      p1 = resolve(e.partes?.[0]?.elegido, e.nombre)
      p2 = resolve(e.partes?.[1]?.elegido, e.nombre)
      if (!p1 || !p2) { if (p1 || p2) warn(`Dobles incompleto, se omite: ${e.nombre}`); continue }
    }
    if (!p1) continue

    const displayName = p2 ? `${await nameOf(p1)} / ${await nameOf(p2)}` : await nameOf(p1)
    const { data: updated, error } = await db
      .from("circuito_participants")
      .update({ player_id: p1, player_2_id: p2, display_name: displayName })
      .eq("display_name", e.nombre)
      .is("player_id", null)
      .select("id")
    if (error) throw new Error(`Error vinculando "${e.nombre}": ${error.message}`)
    linked += updated?.length ?? 0
    ok(`${e.nombre} → ${displayName}  (${updated?.length ?? 0} participante/s)`)
  }
  log(`\n${linked} participante(s) vinculados. Siguiente: npm run recalc:ranking-faltante`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
