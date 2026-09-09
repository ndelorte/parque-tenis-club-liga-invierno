import { parseCircuitoScore } from "./parseCircuitoScore"

export interface CircuitoMatchResult {
  setsWonA: number
  setsWonB: number
  gamesWonA: number
  gamesWonB: number
  winnerSide: "A" | "B"
}

// El walkover se registra como "6-0 6-0" (mismo criterio que Liga/Mid
// Master, ver reglas-circuito-del-parque.md) — no necesita una rama de
// cálculo separada, el score ya identifica sin ambigüedad al ganador.
export function calculateCircuitoMatchResult(
  score: string,
  isFinal: boolean,
): CircuitoMatchResult {
  const parsed = parseCircuitoScore(score, { isFinal })
  const winnerSide: "A" | "B" = parsed.setsWonA > parsed.setsWonB ? "A" : "B"
  return {
    setsWonA: parsed.setsWonA,
    setsWonB: parsed.setsWonB,
    gamesWonA: parsed.gamesWonA,
    gamesWonB: parsed.gamesWonB,
    winnerSide,
  }
}
