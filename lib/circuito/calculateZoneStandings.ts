import { parseCircuitoScore } from "./parseCircuitoScore"
import type { CircuitoParticipant } from "./types"

// Un partido de zona ya jugado (todos-contra-todos). Nunca es la final de
// una categoría, así que el 3er set siempre es 7-6 fijo (isFinal: false).
export interface ZoneMatchResult {
  participantAId: string
  participantBId: string
  winnerId: string
  score: string
}

interface ZoneRecord {
  participant: CircuitoParticipant
  wins: number
  losses: number
  gamesWon: number
  gamesLost: number
}

// Desempate dentro de una zona: reglas-circuito-del-parque.md no lo
// especifica (ver OQ-37, product/open-questions.md) — default: partidos
// ganados → diferencia de games → games ganados → seed (más bajo primero).
export function calculateZoneStandings(
  participants: CircuitoParticipant[],
  matches: ZoneMatchResult[],
): CircuitoParticipant[] {
  const records = new Map<string, ZoneRecord>(
    participants.map((p) => [p.id, { participant: p, wins: 0, losses: 0, gamesWon: 0, gamesLost: 0 }]),
  )

  for (const match of matches) {
    const parsed = parseCircuitoScore(match.score, { isFinal: false })
    const recordA = records.get(match.participantAId)
    const recordB = records.get(match.participantBId)
    if (!recordA || !recordB) {
      throw new Error(`Partido de zona con participante fuera de la lista: ${match.participantAId} / ${match.participantBId}`)
    }

    recordA.gamesWon += parsed.gamesWonA
    recordA.gamesLost += parsed.gamesWonB
    recordB.gamesWon += parsed.gamesWonB
    recordB.gamesLost += parsed.gamesWonA

    if (match.winnerId === match.participantAId) {
      recordA.wins++
      recordB.losses++
    } else {
      recordB.wins++
      recordA.losses++
    }
  }

  return [...records.values()]
    .sort((a, b) => {
      if (a.wins !== b.wins) return b.wins - a.wins
      const diffA = a.gamesWon - a.gamesLost
      const diffB = b.gamesWon - b.gamesLost
      if (diffA !== diffB) return diffB - diffA
      if (a.gamesWon !== b.gamesWon) return b.gamesWon - a.gamesWon
      const seedA = a.participant.seed ?? Infinity
      const seedB = b.participant.seed ?? Infinity
      return seedA - seedB
    })
    .map((r) => r.participant)
}
