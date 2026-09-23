// Clasifica los partidos de un cuadro para mostrarlos con la etiqueta
// correcta según el formato REAL jugado (reglas-circuito-del-parque.md),
// en vez de asumir siempre eliminación directa.
//
// Por qué existe: el motor propio (generateBracket.ts) persiste
// round_number/zone con una semántica limpia para los torneos nuevos
// armados desde el panel admin (round 1 = zona, round 2/3 = semis/final).
// El import histórico de Challonge (scripts/import-challonge.ts) en cambio
// guarda el `round` crudo que reporta la API de Challonge, que no respeta
// esa misma semántica — para categorías chicas (4/5/6-7 inscriptos,
// jugadas como todos-contra-todos) esto hacía que BracketView etiquetara
// fechas de zona como "Cuartos de final"/"Octavos de final" (ver
// product/backlog.md, "Refactor visual del sitio").
//
// Esta función reconstruye la estructura correcta a partir de los datos ya
// importados (cantidad de participantes reales + grafo de quién jugó
// contra quién), sin tocar circuito_matches — es un fix de presentación,
// no de datos. Reconstruir round_number/zone en la base para que coincida
// 1 a 1 con el orden real de Challonge requeriría volver a traer el detalle
// de la API (fuera de alcance de este archivo).

import { selectDrawRule } from "./generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "./formatSpec"
import type { DrawFormatKind } from "./types"

export interface DisplayMatch {
  id: string
  round_number: number
  participant_a_id: string | null
  participant_b_id: string | null
  score: string | null
  winner_id: string | null
  status: string
}

export interface BracketSection {
  label: string
  matches: DisplayMatch[]
}

function realParticipantIds(matches: DisplayMatch[]): Set<string> {
  const ids = new Set<string>()
  for (const m of matches) {
    if (m.participant_a_id) ids.add(m.participant_a_id)
    if (m.participant_b_id) ids.add(m.participant_b_id)
  }
  return ids
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("::")
}

function roundOf(matches: DisplayMatch[], round: number): DisplayMatch[] {
  return matches.filter((m) => m.round_number === round)
}

/** Eliminación directa clásica: última ronda = Final, luego Semifinal, Cuartos, Octavos. */
export function eliminationSections(matches: DisplayMatch[]): BracketSection[] {
  if (matches.length === 0) return []
  const totalRounds = matches.reduce((max, m) => Math.max(max, m.round_number), 0)
  const byRound = new Map<number, DisplayMatch[]>()
  for (const m of matches) {
    if (!byRound.has(m.round_number)) byRound.set(m.round_number, [])
    byRound.get(m.round_number)!.push(m)
  }
  const label = (round: number) => {
    if (round === totalRounds) return "Final"
    if (round === totalRounds - 1) return "Semifinal"
    if (round === totalRounds - 2) return "Cuartos de final"
    if (round === totalRounds - 3) return "Octavos de final"
    return `Ronda ${round}`
  }
  return [...byRound.entries()]
    .sort(([a], [b]) => a - b)
    .map(([round, roundMatches]) => ({ label: label(round), matches: roundMatches }))
}

// Componentes conexos del grafo "quién jugó contra quién" — para
// reconstruir las 2 zonas del formato 6-7 cuando el dato importado no trae
// la columna `zone` (solo la persiste el motor propio para torneos nuevos).
function connectedComponents(matches: DisplayMatch[]): DisplayMatch[][] {
  const parent = new Map<string, string>()
  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x)
    const p = parent.get(x)!
    if (p !== x) parent.set(x, find(p))
    return parent.get(x)!
  }
  function union(a: string, b: string) {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }
  for (const m of matches) {
    if (m.participant_a_id && m.participant_b_id) union(m.participant_a_id, m.participant_b_id)
    else if (m.participant_a_id) find(m.participant_a_id)
    else if (m.participant_b_id) find(m.participant_b_id)
  }
  const groups = new Map<string, DisplayMatch[]>()
  for (const m of matches) {
    const anchor = m.participant_a_id ?? m.participant_b_id
    if (!anchor) continue
    const root = find(anchor)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(m)
  }
  return [...groups.values()]
}

function classifyRoundRobinWithFinal(matches: DisplayMatch[]): BracketSection[] {
  // La final es un revancha entre los 2 primeros de la zona: el mismo par
  // aparece 2 veces en los datos. A diferencia de una suposición inicial,
  // el `round_number` que trae el import de Challonge NO garantiza que esa
  // revancha sea el partido de mayor round_number — Challonge numera las
  // rondas de este formato ("Groups then SE") sin relación directa con el
  // significado del partido (verificado contra la propia UI de Challonge:
  // la revancha puede aparecer en cualquier posición de la secuencia). Por
  // eso se busca el par repetido en TODOS los partidos, no solo el último.
  const seenPairs = new Map<string, string>() // pairKey -> id del primer partido con ese par
  let finalMatch: DisplayMatch | null = null
  for (const match of matches) {
    if (!match.participant_a_id || !match.participant_b_id) continue
    const key = pairKey(match.participant_a_id, match.participant_b_id)
    if (seenPairs.has(key)) {
      // segunda vez que se enfrenta este par → es la final (solo puede haber 1)
      finalMatch = match
      break
    }
    seenPairs.set(key, match.id)
  }

  if (finalMatch) {
    const group = matches.filter((m) => m.id !== finalMatch!.id)
    return [
      { label: "Fase de grupos (todos contra todos)", matches: group },
      { label: "Final", matches: [finalMatch] },
    ]
  }
  // No se pudo identificar la final de forma confiable (ningún par se repite)
  // — mejor mostrar todo como fase de grupos que arriesgar una etiqueta de
  // eliminación incorrecta.
  return [{ label: "Fase de grupos (todos contra todos)", matches }]
}

function classifyGroupsThenKnockout(matches: DisplayMatch[]): BracketSection[] {
  const roundsDesc = [...new Set(matches.map((m) => m.round_number))].sort((a, b) => b - a)
  const finalRound = roundsDesc.find((r) => roundOf(matches, r).length === 1)
  const semisRound = roundsDesc.find((r) => r !== finalRound && roundOf(matches, r).length === 2)

  if (finalRound === undefined || semisRound === undefined) {
    return [{ label: "Fase de grupos + definiciones", matches }]
  }

  const finalMatches = roundOf(matches, finalRound)
  const semiMatches = roundOf(matches, semisRound)
  const groupMatches = matches.filter((m) => m.round_number !== finalRound && m.round_number !== semisRound)
  const components = connectedComponents(groupMatches).filter((c) => c.length > 0)

  if (components.length !== 2) {
    // No se pudo separar en 2 zonas limpias — mostrar la fase de grupos sin
    // dividir en vez de inventar una división que puede ser incorrecta.
    return [
      { label: "Fase de grupos (todos contra todos)", matches: groupMatches },
      { label: "Semifinales", matches: semiMatches },
      { label: "Final", matches: finalMatches },
    ]
  }

  const sections: BracketSection[] = components
    .sort((a, b) => b.length - a.length)
    .map((c, i) => ({ label: `Zona ${String.fromCharCode(65 + i)}`, matches: c }))
  sections.push({ label: "Semifinales", matches: semiMatches })
  sections.push({ label: "Final", matches: finalMatches })
  return sections
}

/**
 * Clasifica los partidos del cuadro PRINCIPAL según el formato real que le
 * corresponde a la cantidad de inscriptos (reglas-circuito-del-parque.md),
 * usando la misma CircuitoFormatSpec que el motor propio.
 */
export function classifyMainBracketSections(matches: DisplayMatch[]): BracketSection[] {
  if (matches.length === 0) return []
  const n = realParticipantIds(matches).size
  const rule = selectDrawRule(n, CIRCUITO_FORMAT_SPEC)
  const format: DrawFormatKind = rule?.format ?? "single_elimination"

  switch (format) {
    case "single_elimination":
      return eliminationSections(matches)
    case "round_robin_pure":
      return [{ label: "Fase de grupos (todos contra todos)", matches }]
    case "round_robin_with_final":
      return classifyRoundRobinWithFinal(matches)
    case "groups_then_knockout":
      return classifyGroupsThenKnockout(matches)
  }
}
