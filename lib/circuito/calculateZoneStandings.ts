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
  setsWon: number
  setsLost: number
  gamesWon: number
  gamesLost: number
}

// Desempate dentro de una zona — reglas-circuito-del-parque.md (respuesta a
// OQ-37): 1) partidos ganados, 2) diferencia de sets, 3) diferencia de games,
// 4) partido entre ellos. Con 3 o más empatados, "partido entre ellos" se
// aplica como mini-tabla de victorias entre los empatados. Si ni así se
// separan (ej. triple empate circular), el seed (más bajo primero) queda como
// último orden estable — no es un criterio deportivo definido por el club.
export function calculateZoneStandings(
  participants: CircuitoParticipant[],
  matches: ZoneMatchResult[],
): CircuitoParticipant[] {
  const records = new Map<string, ZoneRecord>(
    participants.map((p) => [
      p.id,
      { participant: p, wins: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 },
    ]),
  )

  for (const match of matches) {
    const recordA = records.get(match.participantAId)
    const recordB = records.get(match.participantBId)
    if (!recordA || !recordB) {
      // Dato inconsistente (ej. import histórico con una zona mal armada):
      // no se puede sumar el partido a ningún registro. Se ignora para esta
      // tabla en vez de tirar abajo la página — no es una regla deportiva,
      // es una salvaguarda de datos.
      console.error(
        `[calculateZoneStandings] partido de zona con participante fuera de la lista (${match.participantAId} / ${match.participantBId}): se ignora en la tabla`,
      )
      continue
    }

    // Datos importados (Challonge) pueden tener un score con un formato
    // atípico (ver parseCircuitoScore.ts). No se inventa un resultado: se
    // loguea y ese partido puntual no suma sets/games, pero el resto de la
    // tabla se sigue calculando igual.
    try {
      const parsed = parseCircuitoScore(match.score, { isFinal: false, superTiebreakAsSet: true })
      recordA.setsWon += parsed.setsWonA
      recordA.setsLost += parsed.setsWonB
      recordB.setsWon += parsed.setsWonB
      recordB.setsLost += parsed.setsWonA
      recordA.gamesWon += parsed.gamesWonA
      recordA.gamesLost += parsed.gamesWonB
      recordB.gamesWon += parsed.gamesWonB
      recordB.gamesLost += parsed.gamesWonA
    } catch (err) {
      console.error(
        `[calculateZoneStandings] score no interpretable "${match.score}" (partido ${match.participantAId} vs ${match.participantBId}): no se suman sets/games para este partido`,
        err,
      )
    }

    if (match.winnerId === match.participantAId) recordA.wins++
    else if (match.winnerId === match.participantBId) recordB.wins++
    else
      console.error(
        `[calculateZoneStandings] winnerId "${match.winnerId}" no coincide con ninguno de los 2 participantes del partido`,
      )
  }

  const mainKey = (r: ZoneRecord) => [r.wins, r.setsWon - r.setsLost, r.gamesWon - r.gamesLost]
  const compareMain = (a: ZoneRecord, b: ZoneRecord) => {
    const [ka, kb] = [mainKey(a), mainKey(b)]
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i]
    return 0
  }
  const bySeed = (a: ZoneRecord, b: ZoneRecord) =>
    (a.participant.seed ?? Infinity) - (b.participant.seed ?? Infinity)

  const sorted = [...records.values()].sort((a, b) => compareMain(a, b) || bySeed(a, b))

  // Grupos que siguen empatados en los 3 primeros criterios → partido entre ellos.
  const result: ZoneRecord[] = []
  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    while (j < sorted.length && compareMain(sorted[i], sorted[j]) === 0) j++
    const tied = sorted.slice(i, j)
    result.push(...(tied.length > 1 ? sortByHeadToHead(tied, matches, bySeed) : tied))
    i = j
  }

  return result.map((r) => r.participant)
}

function sortByHeadToHead(
  tied: ZoneRecord[],
  matches: ZoneMatchResult[],
  bySeed: (a: ZoneRecord, b: ZoneRecord) => number,
): ZoneRecord[] {
  const ids = new Set(tied.map((r) => r.participant.id))
  const h2hWins = new Map(tied.map((r) => [r.participant.id, 0]))
  for (const m of matches) {
    if (ids.has(m.participantAId) && ids.has(m.participantBId)) {
      h2hWins.set(m.winnerId, (h2hWins.get(m.winnerId) ?? 0) + 1)
    }
  }
  return [...tied].sort(
    (a, b) => h2hWins.get(b.participant.id)! - h2hWins.get(a.participant.id)! || bySeed(a, b),
  )
}
