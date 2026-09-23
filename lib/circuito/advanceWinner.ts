import type { CircuitoBracket, CircuitoParticipant } from "./types"

// Propaga el ganador de un partido a su lugar en la ronda siguiente. Solo
// tiene sentido en cuadros de eliminación simple (cuadro principal 8+ o
// repechaje): en round-robin/zonas, quién avanza depende de la tabla de
// posiciones, no del índice de un partido puntual (eso se resuelve en
// Sprint C5 con una función de standings, no acá).
export function advanceWinner(
  bracket: CircuitoBracket,
  round: number,
  matchIndex: number,
  winner: CircuitoParticipant,
): CircuitoBracket {
  if (bracket.format !== "single_elimination") {
    throw new Error(
      `advanceWinner no aplica a brackets de formato "${bracket.format}" — ` +
        `quién avanza depende de la tabla de posiciones (round-robin/zonas), no del índice del partido.`,
    )
  }

  const currentRound = bracket.rounds[round - 1]
  const match = currentRound?.[matchIndex]
  if (!match) {
    throw new Error(`Partido inexistente: ronda ${round}, índice ${matchIndex}`)
  }
  if (winner.id !== match.participantA?.id && winner.id !== match.participantB?.id) {
    throw new Error(`El ganador no es ninguno de los dos participantes de ese partido`)
  }

  const nextRoundIndex = round // rounds[] es 0-based: la ronda N+1 vive en el índice N
  const nextRound = bracket.rounds[nextRoundIndex]
  if (!nextRound) {
    // Era la final: no hay ronda siguiente a la cual avanzar.
    return bracket
  }

  const nextMatchIndex = Math.floor(matchIndex / 2)
  const slot: "participantA" | "participantB" = matchIndex % 2 === 0 ? "participantA" : "participantB"

  const rounds = bracket.rounds.map((r, ri) => {
    if (ri !== nextRoundIndex) return r
    return r.map((m, mi) => (mi === nextMatchIndex ? { ...m, [slot]: winner } : m))
  })

  return { ...bracket, rounds }
}
