import { describe, it, expect } from "vitest"
import { calculateCircuitoMatchResult } from "../calculateCircuitoMatchResult"

describe("calculateCircuitoMatchResult", () => {
  it("determina el ganador por sets ganados", () => {
    const result = calculateCircuitoMatchResult("6-4 3-6 7-6", false)
    expect(result.winnerSide).toBe("A")
    expect(result.setsWonA).toBe(2)
    expect(result.setsWonB).toBe(1)
  })

  it("side B gana si se lleva 2 sets", () => {
    const result = calculateCircuitoMatchResult("4-6 3-6", false)
    expect(result.winnerSide).toBe("B")
  })

  it("un WO (6-0 6-0) determina ganador sin rama especial", () => {
    const result = calculateCircuitoMatchResult("6-0 6-0", false)
    expect(result.winnerSide).toBe("A")
    expect(result.setsWonA).toBe(2)
  })

  it("un WO marcado como tal acepta 6-0 6-0 (gana A) y 0-6 0-6 (gana B)", () => {
    expect(calculateCircuitoMatchResult("6-0 6-0", false, true).winnerSide).toBe("A")
    expect(calculateCircuitoMatchResult("0-6 0-6", false, true).winnerSide).toBe("B")
  })

  it("un WO marcado como tal rechaza cualquier otro score", () => {
    expect(() => calculateCircuitoMatchResult("6-4 6-2", false, true)).toThrow(/walkover/)
    expect(() => calculateCircuitoMatchResult("6-0 0-6 7-6", false, true)).toThrow(/walkover/)
  })

  it("propaga el error de parseo si el score es inválido", () => {
    expect(() => calculateCircuitoMatchResult("6-4 3-6 6-3", false)).toThrow(/Tercer set inválido/)
  })
})
