import type { ParsedInterparqueScore } from "./parseInterparqueScore"

export interface InterparqueMatchResult {
  winnerSide: "a" | "b"
  gamesA: number
  gamesB: number
  pointsA: number
  pointsB: number
}

const MATCH_WIN_BONUS = 3
const SUPER_TIEBREAK_BONUS = 1

/**
 * Puntaje de Interparque (confirmado con el club):
 * - Cada jugador suma 1 punto por cada game ganado en el set 1 y el set 2
 *   (el super tie-break del set 3 NO cuenta como games).
 * - El ganador del partido suma 3 puntos bonus.
 * - Si hubo super tie-break, el ganador de ese super tie-break suma
 *   1 punto bonus extra.
 */
export function calculateInterparqueMatchResult(
  parsed: ParsedInterparqueScore,
): InterparqueMatchResult {
  const gamesA = parsed.set1.a + parsed.set2.a
  const gamesB = parsed.set1.b + parsed.set2.b

  // Sin super tie-break, set1 y set2 los ganó el mismo jugador (2-0 en sets)
  // — parseInterparqueScore ya garantiza esto. Con super tie-break, los
  // sets quedaron 1-1 y el super tie-break define al ganador del partido.
  let winnerSide: "a" | "b"
  if (parsed.superTiebreak) {
    winnerSide = parsed.superTiebreak.a > parsed.superTiebreak.b ? "a" : "b"
  } else {
    winnerSide = parsed.set1.a > parsed.set1.b ? "a" : "b"
  }

  let pointsA = gamesA
  let pointsB = gamesB

  if (winnerSide === "a") pointsA += MATCH_WIN_BONUS
  else pointsB += MATCH_WIN_BONUS

  if (parsed.superTiebreak) {
    if (winnerSide === "a") pointsA += SUPER_TIEBREAK_BONUS
    else pointsB += SUPER_TIEBREAK_BONUS
  }

  return { winnerSide, gamesA, gamesB, pointsA, pointsB }
}
