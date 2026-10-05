import type { CircuitoParticipant, DrawFormatKind } from "./types"
import { calculateZoneStandings, type ZoneMatchResult } from "./calculateZoneStandings"
import { pointsForInstance, type CircuitoInstance } from "./pointsTable"
import { normalizeZoneMatches } from "./normalizeZoneMatches"

export interface CircuitoBracketMatchResult {
  bracket: "main" | "repechaje"
  round: number
  position?: number // orden dentro de la ronda (para reconstruir imports de Challonge)
  zone: "A" | "B" | null
  participantAId: string | null
  participantBId: string | null
  winnerId: string | null
  score: string | null
}

export interface CalculateRankingPointsInput {
  format: DrawFormatKind
  participants: CircuitoParticipant[]
  matches: CircuitoBracketMatchResult[] // todos los partidos de la categoría (main + repechaje)
  isGrandSlam: boolean
}

// Puntos por participante según la instancia alcanzada. El repechaje nunca
// suma (reglas-circuito-del-parque.md) — solo se leen los partidos del
// cuadro principal. Si una parte del cuadro todavía no terminó de jugarse,
// esos participantes quedan sin instancia asignada (0 puntos por ahora):
// las posiciones de instancia son por definición finales, no se puede
// derivar "3° de la zona" sin que la zona haya terminado.
export function calculateRankingPoints(input: CalculateRankingPointsInput): Map<string, number> {
  const { format, participants, isGrandSlam } = input
  // Imports de Challonge en formatos de zona: se reconstruye zona / semis / final.
  const matches = normalizeZoneMatches(format, input.matches)
  const mainMatches = matches.filter((m) => m.bracket === "main")
  const instances = new Map<string, CircuitoInstance>()

  switch (format) {
    case "round_robin_pure":
      resolveRoundRobinPure(participants, mainMatches, instances)
      break
    case "round_robin_with_final":
      resolveRoundRobinWithFinal(participants, mainMatches, instances)
      break
    case "groups_then_knockout":
      resolveGroupsThenKnockout(participants, mainMatches, instances)
      break
    case "single_elimination":
      resolveSingleElimination(mainMatches, instances)
      break
  }

  const points = new Map<string, number>()
  for (const p of participants) {
    const instance = instances.get(p.id)
    points.set(p.id, instance ? pointsForInstance(instance, isGrandSlam) : 0)
  }
  return points
}

function toZoneMatches(matches: CircuitoBracketMatchResult[]): ZoneMatchResult[] {
  return matches
    .filter((m) => m.winnerId && m.score && m.participantAId && m.participantBId)
    .map((m) => ({
      participantAId: m.participantAId!,
      participantBId: m.participantBId!,
      winnerId: m.winnerId!,
      score: m.score!,
    }))
}

function loserOf(match: CircuitoBracketMatchResult): string | null {
  if (!match.winnerId || !match.participantAId || !match.participantBId) return null
  return match.winnerId === match.participantAId ? match.participantBId : match.participantAId
}

// N=5: todo el resultado sale de la tabla de la zona única, sin final.
function resolveRoundRobinPure(
  participants: CircuitoParticipant[],
  mainMatches: CircuitoBracketMatchResult[],
  instances: Map<string, CircuitoInstance>,
) {
  const zoneMatches = mainMatches.filter((m) => m.round === 1)
  const totalPossible = (participants.length * (participants.length - 1)) / 2
  const completed = toZoneMatches(zoneMatches)
  if (completed.length < totalPossible) return

  const standings = calculateZoneStandings(participants, completed)
  instances.set(standings[0].id, "champion")
  instances.set(standings[1].id, "runner_up")
  for (const p of standings.slice(2)) instances.set(p.id, "round_of_32_plus")
}

// N=4: la zona define quiénes juegan la final; la final real decide campeón/subcampeón.
function resolveRoundRobinWithFinal(
  participants: CircuitoParticipant[],
  mainMatches: CircuitoBracketMatchResult[],
  instances: Map<string, CircuitoInstance>,
) {
  const zoneMatches = mainMatches.filter((m) => m.round === 1)
  const totalPossible = (participants.length * (participants.length - 1)) / 2
  const completed = toZoneMatches(zoneMatches)
  const final = mainMatches.find((m) => m.round === 2)
  if (completed.length === totalPossible) {
    // Los que no juegan la final suman "16vos o más". Se toma a quienes
    // efectivamente la juegan (en datos importados pueden no ser los 2
    // primeros de la tabla por el desempate); sin final definida, los 3° y 4°.
    if (final?.participantAId && final.participantBId) {
      for (const p of participants) {
        if (p.id !== final.participantAId && p.id !== final.participantBId) instances.set(p.id, "round_of_32_plus")
      }
    } else {
      const standings = calculateZoneStandings(participants, completed)
      for (const p of standings.slice(2)) instances.set(p.id, "round_of_32_plus")
    }
  }

  if (!final) return
  const loserId = loserOf(final)
  if (final.winnerId && loserId) {
    instances.set(final.winnerId, "champion")
    instances.set(loserId, "runner_up")
  }
}

// N=6-7: dos zonas → semis cruzadas → final. Sin partido de 3er puesto.
function resolveGroupsThenKnockout(
  participants: CircuitoParticipant[],
  mainMatches: CircuitoBracketMatchResult[],
  instances: Map<string, CircuitoInstance>,
) {
  for (const zone of ["A", "B"] as const) {
    const zoneMatchesRaw = mainMatches.filter((m) => m.round === 1 && m.zone === zone)
    if (zoneMatchesRaw.length === 0) continue

    const zoneParticipantIds = new Set(zoneMatchesRaw.flatMap((m) => [m.participantAId, m.participantBId]))
    const zoneParticipants = participants.filter((p) => zoneParticipantIds.has(p.id))
    const totalPossible = (zoneParticipants.length * (zoneParticipants.length - 1)) / 2
    const completed = toZoneMatches(zoneMatchesRaw)
    if (completed.length < totalPossible) continue

    // Con las semis ya definidas, no suman "16vos o más" los que no las juegan
    // (en datos importados pueden no ser los 2 primeros de la tabla por el
    // desempate); si todavía no se definieron, los 3° en adelante de la zona.
    const semiIds = new Set(
      mainMatches.filter((m) => m.round === 2).flatMap((m) => [m.participantAId, m.participantBId]).filter(Boolean),
    )
    if (semiIds.size > 0) {
      for (const p of zoneParticipants) if (!semiIds.has(p.id)) instances.set(p.id, "round_of_32_plus")
    } else {
      const standings = calculateZoneStandings(zoneParticipants, completed)
      for (const p of standings.slice(2)) instances.set(p.id, "round_of_32_plus")
    }
  }

  for (const semi of mainMatches.filter((m) => m.round === 2)) {
    const loserId = loserOf(semi)
    if (loserId) instances.set(loserId, "semifinalist")
  }

  const final = mainMatches.find((m) => m.round === 3)
  if (final) {
    const loserId = loserOf(final)
    if (final.winnerId && loserId) {
      instances.set(final.winnerId, "champion")
      instances.set(loserId, "runner_up")
    }
  }
}

// N=8+: la instancia depende solo de la profundidad del cuadro — sin
// standings, cada partido real (no-bye) tiene un ganador y un perdedor.
function resolveSingleElimination(
  mainMatches: CircuitoBracketMatchResult[],
  instances: Map<string, CircuitoInstance>,
) {
  const totalRounds = mainMatches.reduce((max, m) => Math.max(max, m.round), 0)
  if (totalRounds === 0) return

  for (const match of mainMatches) {
    const loserId = loserOf(match) // null en byes o partidos sin jugar todavía
    if (!loserId || !match.winnerId) continue

    if (match.round === totalRounds) {
      instances.set(match.winnerId, "champion")
      instances.set(loserId, "runner_up")
    } else {
      instances.set(loserId, instanceFromRoundsBeforeFinal(totalRounds - match.round))
    }
  }
}

function instanceFromRoundsBeforeFinal(roundsBeforeFinal: number): CircuitoInstance {
  if (roundsBeforeFinal === 1) return "semifinalist"
  if (roundsBeforeFinal === 2) return "quarterfinalist"
  if (roundsBeforeFinal === 3) return "round_of_16"
  return "round_of_32_plus"
}
