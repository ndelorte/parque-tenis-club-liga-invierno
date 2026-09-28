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

function pairsWithin(ids: string[]): [string, string][] {
  const pairs: [string, string][] = []
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) pairs.push([ids[i], ids[j]])
  return pairs
}

function combinations3(ids: string[]): string[][] {
  const out: string[][] = []
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) for (let k = j + 1; k < ids.length; k++) out.push([ids[i], ids[j], ids[k]])
  return out
}

function* cartesian<T>(options: T[][]): Generator<T[]> {
  if (options.length === 0) {
    yield []
    return
  }
  const [first, ...rest] = options
  for (const item of first) for (const tail of cartesian(rest)) yield [item, ...tail]
}

/**
 * Reconstruye "2 zonas de 3 + semis cruzadas + final" a partir del grafo de
 * quién jugó contra quién, SIN depender de round_number ni de la columna
 * `zone` (los cuadros importados de Challonge no traen ninguna de las 2 con
 * la semántica que espera este formato, ver comentario de archivo). Solo
 * aplica con exactamente 6 participantes reales — el formato de 7 reparte
 * 4+3, no es simétrico, y acá no se intenta.
 *
 * Puede haber un par que jugó 2 veces: se cruzaron en zona Y de nuevo en la
 * final (pasa cuando el 1° y el 2° de una misma zona ganan los 2 su semi
 * cruzada y se reencuentran). Se prueban las 2 ocurrencias como "el partido
 * de zona" y se valida cuál arma una estructura consistente.
 *
 * Solo devuelve una reconstrucción cuando es la ÚNICA forma de partir los 6
 * jugadores en 2 grupos de 3 que jugaron todos contra todos + 2 semis
 * cruzadas (1° de una zona vs 2° de la otra) + 1 final entre los 2 ganadores
 * de semi. Si hay más de una forma posible, o ninguna, no arriesga: devuelve
 * `null` para que el llamador use el fallback existente (round_number o
 * lista plana) en vez de mostrar una zona/semifinal que podría ser incorrecta.
 */
function reconstructTwoZonesFromGraph(matches: DisplayMatch[]): BracketSection[] | null {
  const ids = [...realParticipantIds(matches)]
  if (ids.length !== 6) return null

  const byPair = new Map<string, DisplayMatch[]>()
  for (const m of matches) {
    if (!m.participant_a_id || !m.participant_b_id) continue
    const key = pairKey(m.participant_a_id, m.participant_b_id)
    if (!byPair.has(key)) byPair.set(key, [])
    byPair.get(key)!.push(m)
  }

  interface Solution {
    zoneA: string[]
    zoneAMatches: DisplayMatch[]
    zoneBMatches: DisplayMatch[]
    semis: DisplayMatch[]
    final: DisplayMatch
  }
  // key: zoneA (ordenada) + "|" + par de la final — agrupa las soluciones
  // que reconstruyen el MISMO resultado (misma zona, mismo campeón) aunque
  // difieran en cuál de 2 ocurrencias idénticas de un par (zona + revancha
  // en la final) quedó etiquetada como cada cosa.
  const solutionsByShape = new Map<string, Solution[]>()

  // Fijar ids[0] en zoneA evita generar cada partición 2 veces (A/B y B/A).
  const zoneACandidates = combinations3(ids).filter((z) => z.includes(ids[0]))

  for (const zoneA of zoneACandidates) {
    const zoneB = ids.filter((id) => !zoneA.includes(id))
    const zoneAPairs = pairsWithin(zoneA)
    const zoneBPairs = pairsWithin(zoneB)
    const zonePairs = [...zoneAPairs, ...zoneBPairs]
    if (!zonePairs.every(([a, b]) => byPair.has(pairKey(a, b)))) continue

    const choiceOptions = zonePairs.map(([a, b]) => byPair.get(pairKey(a, b))!)

    for (const chosenZoneMatches of cartesian(choiceOptions)) {
      const usedIds = new Set(chosenZoneMatches.map((m) => m.id))
      const leftover = matches.filter((m) => m.participant_a_id && m.participant_b_id && !usedIds.has(m.id))
      if (leftover.length !== 3) continue

      const isCrossZone = (m: DisplayMatch) => {
        const a = m.participant_a_id!
        const b = m.participant_b_id!
        return (zoneA.includes(a) && zoneB.includes(b)) || (zoneB.includes(a) && zoneA.includes(b))
      }

      for (let finalIdx = 0; finalIdx < leftover.length; finalIdx++) {
        const finalMatch = leftover[finalIdx]
        const semis = leftover.filter((_, i) => i !== finalIdx)
        if (!semis.every(isCrossZone)) continue
        const semiWinnerIds = new Set(semis.map((s) => s.winner_id))
        const finalParticipantIds = new Set([finalMatch.participant_a_id, finalMatch.participant_b_id])
        if (semiWinnerIds.size !== 2 || finalParticipantIds.size !== 2) continue
        if (![...semiWinnerIds].every((w) => w && finalParticipantIds.has(w))) continue

        const zoneAPairKeys = new Set(zoneAPairs.map(([a, b]) => pairKey(a, b)))
        const shapeKey =
          [...zoneA].sort().join(",") + "|" + pairKey(finalMatch.participant_a_id!, finalMatch.participant_b_id!)
        const solution: Solution = {
          zoneA,
          zoneAMatches: chosenZoneMatches.filter((m) => zoneAPairKeys.has(pairKey(m.participant_a_id!, m.participant_b_id!))),
          zoneBMatches: chosenZoneMatches.filter((m) => !zoneAPairKeys.has(pairKey(m.participant_a_id!, m.participant_b_id!))),
          semis,
          final: finalMatch,
        }
        if (!solutionsByShape.has(shapeKey)) solutionsByShape.set(shapeKey, [])
        solutionsByShape.get(shapeKey)!.push(solution)
      }
    }
  }

  if (solutionsByShape.size !== 1) return null // distintas particiones/campeón posibles: ambiguo de verdad, no arriesgar

  const candidates = [...solutionsByShape.values()][0]
  // Puede haber 2 candidatas cuando el par de la final jugó 2 veces (zona +
  // revancha en la final, con el mismo ganador las 2 veces — no cambia quién
  // gana la zona ni quién es campeón). Desempate determinístico: la que
  // aparece más tarde en el orden de los partidos queda como "Final".
  const solution = candidates.reduce((latest, cur) =>
    matches.indexOf(cur.final) > matches.indexOf(latest.final) ? cur : latest,
  )
  return [
    { label: "Zona A", matches: solution.zoneAMatches },
    { label: "Zona B", matches: solution.zoneBMatches },
    { label: "Semifinales", matches: solution.semis },
    { label: "Final", matches: [solution.final] },
  ]
}

function classifyGroupsThenKnockout(matches: DisplayMatch[]): BracketSection[] {
  const graphReconstruction = reconstructTwoZonesFromGraph(matches)
  if (graphReconstruction) return graphReconstruction

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
  if (!rule) {
    // n por debajo del mínimo de cualquier formato (ej. una categoría recién
    // empezando, con solo 1-2 partidos jugados de una zona más grande —
    // todavía no se ve la cantidad real de inscriptos). Antes esto caía por
    // defecto a "single_elimination", que con pocos partidos etiqueta
    // cualquier cosa como "Final" — mejor no arriesgar ninguna etiqueta.
    return [{ label: "Fase de grupos", matches }]
  }

  switch (rule.format) {
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
