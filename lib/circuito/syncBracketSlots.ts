import { calculateZoneStandings, type ZoneMatchResult } from "./calculateZoneStandings"
import { generateBracket, selectDrawRule } from "./generateBracket"
import type { CircuitoFormatSpec, CircuitoParticipant, DrawFormatKind } from "./types"

// Un partido del cuadro tal como está persistido (circuito_matches), con
// `position` para saber de qué partidos de la ronda anterior se alimenta.
export interface BracketSlotMatch {
  id: string
  bracket: "main" | "repechaje"
  round: number
  position: number
  zone: "A" | "B" | null
  participantAId: string | null
  participantBId: string | null
  winnerId: string | null
  score: string | null
}

export interface SlotUpdate {
  matchId: string
  participantAId: string | null
  participantBId: string | null
  // true = el partido tenía un resultado cargado que ya no corresponde a
  // estos participantes (se corrigió un resultado anterior) → se borra.
  clearResult: boolean
}

// Recalcula TODOS los lugares derivados del cuadro (ganadores que avanzan,
// clasificados de zona, finalistas) desde los resultados cargados, en vez de
// avanzar un solo ganador por evento. Así corregir un resultado ya cargado
// propaga el cambio en cascada, y correrlo dos veces no cambia nada (si una
// escritura falla a mitad, el próximo submit lo deja consistente).
//
// Solo toca partidos cuyos participantes salen de otros partidos: la 1ª
// ronda de eliminación y los partidos de zona los fija el armado del cuadro.
export function computeSlotUpdates(
  format: DrawFormatKind,
  participants: CircuitoParticipant[],
  matches: BracketSlotMatch[],
): SlotUpdate[] {
  const working = matches.map((m) => ({ ...m }))
  const updates: SlotUpdate[] = []

  const setSlots = (match: BracketSlotMatch | undefined, a: string | null, b: string | null) => {
    if (!match) return
    if (match.participantAId === a && match.participantBId === b) return
    const clearResult = match.winnerId !== null || match.score !== null
    match.participantAId = a
    match.participantBId = b
    if (clearResult) {
      match.winnerId = null
      match.score = null
    }
    updates.push({ matchId: match.id, participantAId: a, participantBId: b, clearResult })
  }

  const round = (bracket: "main" | "repechaje", roundNumber: number) =>
    working
      .filter((m) => m.bracket === bracket && m.round === roundNumber)
      .sort((x, y) => x.position - y.position)

  switch (format) {
    case "single_elimination":
      syncSingleElimination(working, "main", round, setSlots)
      break
    case "round_robin_with_final":
      syncRoundRobinWithFinal(participants, round, setSlots)
      break
    case "groups_then_knockout":
      syncGroupsThenKnockout(participants, round, setSlots)
      break
    case "round_robin_pure":
      break
  }

  // El repechaje es siempre eliminación directa (generateRepechaje.ts).
  syncSingleElimination(working, "repechaje", round, setSlots)

  return updates
}

type RoundFn = (bracket: "main" | "repechaje", roundNumber: number) => BracketSlotMatch[]
type SetSlotsFn = (match: BracketSlotMatch | undefined, a: string | null, b: string | null) => void

// Ganador conocido de un partido. En la 1ª ronda, un partido con un solo
// participante es un bye: avanza sin jugarse. En rondas posteriores, un lugar
// vacío significa "todavía no definido", no bye.
function winnerOf(match: BracketSlotMatch | undefined): string | null {
  if (!match) return null
  if (match.winnerId) return match.winnerId
  if (match.round === 1 && match.participantAId && !match.participantBId) return match.participantAId
  return null
}

function syncSingleElimination(
  working: BracketSlotMatch[],
  bracket: "main" | "repechaje",
  round: RoundFn,
  setSlots: SetSlotsFn,
) {
  const maxRound = Math.max(0, ...working.filter((m) => m.bracket === bracket).map((m) => m.round))
  for (let r = 2; r <= maxRound; r++) {
    const previous = round(bracket, r - 1)
    const byPosition = new Map(previous.map((m) => [m.position, m]))
    for (const match of round(bracket, r)) {
      setSlots(
        match,
        winnerOf(byPosition.get(match.position * 2)),
        winnerOf(byPosition.get(match.position * 2 + 1)),
      )
    }
  }
}

function toZoneMatchResults(matches: BracketSlotMatch[]): ZoneMatchResult[] {
  return matches
    .filter((m) => m.winnerId && m.score && m.participantAId && m.participantBId)
    .map((m) => ({
      participantAId: m.participantAId!,
      participantBId: m.participantBId!,
      winnerId: m.winnerId!,
      score: m.score!,
    }))
}

// Posiciones finales de una zona, o null si la zona todavía no terminó.
function zoneStandingsIfComplete(
  zoneParticipants: CircuitoParticipant[],
  zoneMatches: BracketSlotMatch[],
): CircuitoParticipant[] | null {
  const completed = toZoneMatchResults(zoneMatches)
  const totalPossible = (zoneParticipants.length * (zoneParticipants.length - 1)) / 2
  if (zoneParticipants.length < 2 || completed.length < totalPossible) return null
  return calculateZoneStandings(zoneParticipants, completed)
}

// N=4: los 2 primeros de la zona juegan la final.
function syncRoundRobinWithFinal(participants: CircuitoParticipant[], round: RoundFn, setSlots: SetSlotsFn) {
  const standings = zoneStandingsIfComplete(participants, round("main", 1))
  const [finalMatch] = round("main", 2)
  setSlots(finalMatch, standings?.[0].id ?? null, standings?.[1].id ?? null)
}

// N=6-7: semis cruzadas (1°A vs 2°B, 1°B vs 2°A) cuando terminan las 2
// zonas; la final con los 2 ganadores de semi cuando terminan las 2 semis.
function syncGroupsThenKnockout(participants: CircuitoParticipant[], round: RoundFn, setSlots: SetSlotsFn) {
  const zoneMatches = round("main", 1)
  const standingsByZone = (["A", "B"] as const).map((zone) => {
    const matches = zoneMatches.filter((m) => m.zone === zone)
    const ids = new Set(matches.flatMap((m) => [m.participantAId, m.participantBId]).filter((id): id is string => !!id))
    // Con seed real: es el último criterio de desempate (OQ-37).
    const zoneParticipants = participants.filter((p) => ids.has(p.id))
    return zoneStandingsIfComplete(zoneParticipants, matches)
  })
  const [zoneA, zoneB] = standingsByZone
  const bothZonesDone = zoneA && zoneB

  const semis = round("main", 2)
  setSlots(semis[0], bothZonesDone ? zoneA[0].id : null, bothZonesDone ? zoneB[1].id : null)
  setSlots(semis[1], bothZonesDone ? zoneB[0].id : null, bothZonesDone ? zoneA[1].id : null)

  const semiWinners = semis.map(winnerOf)
  const bothSemisDone = semis.length === 2 && semiWinners.every(Boolean)
  const [finalMatch] = round("main", 3)
  setSlots(finalMatch, bothSemisDone ? semiWinners[0] : null, bothSemisDone ? semiWinners[1] : null)
}

// Perdedores de la 1ª ronda del cuadro principal (quienes entran al
// repechaje), o null si todavía falta cargar algún partido real de esa
// ronda. Un bye no genera perdedor.
export function round1LosersIfComplete(matches: BracketSlotMatch[]): string[] | null {
  const realMatches = matches.filter(
    (m) => m.bracket === "main" && m.round === 1 && m.participantAId && m.participantBId,
  )
  if (realMatches.length === 0 || realMatches.some((m) => !m.winnerId)) return null
  return realMatches.map((m) => (m.winnerId === m.participantAId ? m.participantBId! : m.participantAId!))
}

// ¿Este cuadro lo armó el motor del panel (generateBracket) para estos
// participantes? Los cuadros históricos importados de Challonge
// (scripts/import-challonge.ts) tienen otro orden/estructura y sus puntos
// vienen de la planilla del club: recalcular sus lugares o su ranking
// desde el panel rompería el historial. generateBracket es determinista,
// así que alcanza con regenerarlo y comparar la 1ª ronda (fijada al armar
// el cuadro) y la cantidad de partidos por ronda.
export function isPanelGeneratedBracket(
  participants: CircuitoParticipant[],
  matches: BracketSlotMatch[],
  spec: CircuitoFormatSpec,
): boolean {
  if (!selectDrawRule(participants.length, spec)) return false
  const expected = generateBracket(participants, spec)
  const main = matches.filter((m) => m.bracket === "main")

  const maxRound = Math.max(0, ...main.map((m) => m.round))
  if (maxRound !== expected.rounds.length) return false

  return expected.rounds.every((expectedRound, roundIdx) => {
    const actual = main.filter((m) => m.round === roundIdx + 1).sort((x, y) => x.position - y.position)
    if (actual.length !== expectedRound.length) return false
    if (roundIdx > 0) return true
    return expectedRound.every((e, position) => {
      const a = actual[position]
      return (
        a.position === position &&
        a.zone === e.group &&
        a.participantAId === (e.participantA?.id ?? null) &&
        a.participantBId === (e.participantB?.id ?? null)
      )
    })
  })
}
