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
// cálculo separada, el score ya identifica sin ambigüedad al ganador. Lo
// que sí se valida es que un WO tenga exactamente ese score ("0-6 0-6" si
// el que gana por WO es el participante B).
export function calculateCircuitoMatchResult(
  score: string,
  isFinal: boolean,
  isWalkover = false,
): CircuitoMatchResult {
  const parsed = parseCircuitoScore(score, { isFinal })
  if (isWalkover && !isWalkoverScore(parsed.sets)) {
    throw new Error(`Un walkover se registra como "6-0 6-0" (o "0-6 0-6"), recibido "${score}"`)
  }
  const winnerSide: "A" | "B" = parsed.setsWonA > parsed.setsWonB ? "A" : "B"
  return {
    setsWonA: parsed.setsWonA,
    setsWonB: parsed.setsWonB,
    gamesWonA: parsed.gamesWonA,
    gamesWonB: parsed.gamesWonB,
    winnerSide,
  }
}

function isWalkoverScore(sets: Array<{ a: number; b: number }>): boolean {
  if (sets.length !== 2) return false
  const winsA = sets.every((set) => set.a === 6 && set.b === 0)
  const winsB = sets.every((set) => set.a === 0 && set.b === 6)
  return winsA || winsB
}
