// Estado de una categoría del Circuito para mostrarlo en la landing del
// torneo mensual ("En juego, Cuartos de final" / "Terminado, Campeón: X").
// Excepción aprobada de product/plan-refactor-visual.md §4.3/§8: lógica de
// PRESENTACIÓN nueva en lib/circuito/, sin duplicar reglas deportivas — usa
// la misma CircuitoFormatSpec/selectDrawRule y calculateZoneStandings que ya
// existen para decidir cuándo termina cada formato.

import { calculateZoneStandings } from "./calculateZoneStandings"
import { classifyMainBracketSections, type DisplayMatch } from "./bracketDisplay"
import { CIRCUITO_FORMAT_SPEC } from "./formatSpec"
import { selectDrawRule, nextPowerOfTwo } from "./generateBracket"
import { bracketRoundLabel } from "./bracketTree"
import type { CircuitoParticipant } from "./types"

export type CategoryStatus =
  | { kind: "finished"; champion: string }
  | { kind: "live"; label: string }
  | { kind: "pending" }

export interface CategoryStatusMatch {
  bracket: "main" | "repechaje"
  round_number: number
  zone: "A" | "B" | null
  participant_a_id: string | null
  participant_b_id: string | null
  winner_id: string | null
  score: string | null
}

export interface CategoryStatusParticipant {
  name: string
  seed: number | null
}

// "Todos contra todos y final" (4), "Todos contra todos" (5), "Dos zonas y
// final" (6-7), "Cuadro de N" (8+) — reglas-circuito-del-parque.md, "Formato
// del torneo según cantidad de inscriptos".
export function formatLabel(drawSize: number): string {
  if (drawSize === 4) return "Todos contra todos y final"
  if (drawSize === 5) return "Todos contra todos"
  if (drawSize >= 6 && drawSize <= 7) return "Dos zonas y final"
  return `Cuadro de ${nextPowerOfTwo(drawSize)}`
}

function championName(id: string, participants: Record<string, CategoryStatusParticipant>): string {
  return participants[id]?.name ?? "?"
}

function toZoneParticipants(
  ids: Iterable<string>,
  participants: Record<string, CategoryStatusParticipant>,
): CircuitoParticipant[] {
  return [...ids].map((id) => ({ id, seed: participants[id]?.seed ?? null }))
}

function completedZoneMatches(matches: CategoryStatusMatch[]) {
  return matches.filter((m) => m.winner_id && m.score && m.participant_a_id && m.participant_b_id)
}

// classifyMainBracketSections (bracketDisplay.ts) pide `id`/`status`, que
// CategoryStatusMatch no tiene (el llamador real siempre pasa filas
// completas de circuito_matches, pero el tipo público de esta función se
// mantiene mínimo por los tests). Se sintetizan acá — ninguna de las
// funciones de clasificación lee `status`, y el `id` solo necesita ser
// único dentro de este llamado, no coincidir con el id real en la base.
function toDisplayMatches(matches: CategoryStatusMatch[]): DisplayMatch[] {
  return matches.map((m, i) => ({ ...m, id: String(i), status: m.winner_id ? "played" : "pending" }))
}

// Busca la Final por el partido que se repite (round_robin_with_final) o
// por reconstrucción del grafo de zonas (groups_then_knockout) — ver
// bracketDisplay.ts. A diferencia de filtrar por round_number, funciona
// igual con datos importados de Challonge, donde el round numérico crudo no
// separa zona/semis/final con la semántica que espera el motor propio.
function championFromGraph(
  mainMatches: CategoryStatusMatch[],
  participants: Record<string, CategoryStatusParticipant>,
): CategoryStatus | null {
  const sections = classifyMainBracketSections(toDisplayMatches(mainMatches))
  const finalMatch = sections.find((s) => s.label === "Final")?.matches[0]
  if (finalMatch?.winner_id) return { kind: "finished", champion: championName(finalMatch.winner_id, participants) }
  return null
}

function toZoneMatchResults(matches: CategoryStatusMatch[]) {
  return completedZoneMatches(matches).map((m) => ({
    participantAId: m.participant_a_id!,
    participantBId: m.participant_b_id!,
    winnerId: m.winner_id!,
    score: m.score!,
  }))
}

// N=5: sin final — campeón = 1° de la tabla cuando termina el todos contra todos.
function pureStatus(
  drawSize: number,
  mainMatches: CategoryStatusMatch[],
  participants: Record<string, CategoryStatusParticipant>,
): CategoryStatus {
  const totalPossible = (drawSize * (drawSize - 1)) / 2
  const completed = completedZoneMatches(mainMatches)
  if (completed.length < totalPossible) {
    return { kind: "live", label: `${completed.length} de ${totalPossible} partidos` }
  }
  const ids = new Set(mainMatches.flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter((id): id is string => !!id))
  const standings = calculateZoneStandings(toZoneParticipants(ids, participants), toZoneMatchResults(mainMatches))
  return { kind: "finished", champion: championName(standings[0].id, participants) }
}

// N=4: zona única + final entre los 2 primeros.
function withFinalStatus(
  drawSize: number,
  mainMatches: CategoryStatusMatch[],
  participants: Record<string, CategoryStatusParticipant>,
): CategoryStatus {
  const totalPossible = (drawSize * (drawSize - 1)) / 2
  const zoneMatches = mainMatches.filter((m) => m.round_number === 1)
  const completedZone = completedZoneMatches(zoneMatches)
  if (completedZone.length >= totalPossible) {
    const final = mainMatches.find((m) => m.round_number === 2)
    if (final?.winner_id) return { kind: "finished", champion: championName(final.winner_id, participants) }
  }

  const fromGraph = championFromGraph(mainMatches, participants)
  if (fromGraph) return fromGraph

  if (completedZone.length < totalPossible) {
    return { kind: "live", label: `${completedZone.length} de ${totalPossible} partidos` }
  }
  return { kind: "live", label: "Final" }
}

// N=6-7: dos zonas → semifinales cruzadas → final. Sin partido de 3er puesto.
function groupsStatus(
  mainMatches: CategoryStatusMatch[],
  participants: Record<string, CategoryStatusParticipant>,
): CategoryStatus {
  const zoneMatches = mainMatches.filter((m) => m.round_number === 1)
  const zonesDone = (["A", "B"] as const).every((zone) => {
    const inZone = zoneMatches.filter((m) => m.zone === zone)
    if (inZone.length === 0) return false
    const ids = new Set(inZone.flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter((id): id is string => !!id))
    const totalPossible = (ids.size * (ids.size - 1)) / 2
    return completedZoneMatches(inZone).length >= totalPossible
  })

  if (zonesDone) {
    const semis = mainMatches.filter((m) => m.round_number === 2)
    const semisDone = semis.length === 2 && semis.every((m) => m.winner_id)
    if (semisDone) {
      const final = mainMatches.find((m) => m.round_number === 3)
      if (final?.winner_id) return { kind: "finished", champion: championName(final.winner_id, participants) }
    }
  }

  // round_number/zone no separan zona/semis/final de forma confiable en
  // datos importados de Challonge (no traen la columna `zone`, ver
  // bracketDisplay.ts) — se intenta la reconstrucción por grafo antes de
  // asumir que sigue en juego.
  const fromGraph = championFromGraph(mainMatches, participants)
  if (fromGraph) return fromGraph

  if (!zonesDone) return { kind: "live", label: "Zonas" }
  const semis = mainMatches.filter((m) => m.round_number === 2)
  if (!(semis.length === 2 && semis.every((m) => m.winner_id))) return { kind: "live", label: "Semifinales" }
  return { kind: "live", label: "Final" }
}

// N=8+: la primera ronda con un partido real (2 participantes) sin ganador
// todavía es la ronda "en juego". Si todas las rondas están completas, el
// ganador de la última es el campeón.
function singleEliminationStatus(
  mainMatches: CategoryStatusMatch[],
  participants: Record<string, CategoryStatusParticipant>,
): CategoryStatus {
  const totalRounds = mainMatches.reduce((max, m) => Math.max(max, m.round_number), 0)
  if (totalRounds === 0) return { kind: "pending" }

  for (let r = 1; r <= totalRounds; r++) {
    const roundMatches = mainMatches.filter((m) => m.round_number === r)
    const hasPending = roundMatches.some((m) => m.participant_a_id && m.participant_b_id && !m.winner_id)
    if (hasPending) return { kind: "live", label: bracketRoundLabel(r, totalRounds) }
  }

  const final = mainMatches.find((m) => m.round_number === totalRounds)
  if (final?.winner_id) return { kind: "finished", champion: championName(final.winner_id, participants) }
  return { kind: "live", label: bracketRoundLabel(totalRounds, totalRounds) }
}

export function categoryStatus(
  drawSize: number,
  matches: CategoryStatusMatch[],
  participants: Record<string, CategoryStatusParticipant>,
): CategoryStatus {
  const rule = selectDrawRule(drawSize, CIRCUITO_FORMAT_SPEC)
  if (!rule) return { kind: "pending" }

  const mainMatches = matches.filter((m) => m.bracket === "main")
  if (mainMatches.length === 0) return { kind: "pending" }

  switch (rule.format) {
    case "round_robin_pure":
      return pureStatus(drawSize, mainMatches, participants)
    case "round_robin_with_final":
      return withFinalStatus(drawSize, mainMatches, participants)
    case "groups_then_knockout":
      return groupsStatus(mainMatches, participants)
    case "single_elimination":
      return singleEliminationStatus(mainMatches, participants)
  }
}
