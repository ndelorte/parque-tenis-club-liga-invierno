import { describe, it, expect } from "vitest"
import { parseCircuitoScore } from "../parseCircuitoScore"

describe("parseCircuitoScore", () => {
  it("parsea un 2-0 sin tercer set", () => {
    const parsed = parseCircuitoScore("6-4 6-3", { isFinal: false })
    expect(parsed).toEqual({
      sets: [{ a: 6, b: 4 }, { a: 6, b: 3 }],
      setsWonA: 2,
      setsWonB: 0,
      gamesWonA: 12,
      gamesWonB: 7,
    })
  })

  it("exige 7-6 fijo en el 3er set fuera de la final", () => {
    expect(() => parseCircuitoScore("6-4 3-6 7-6", { isFinal: false })).not.toThrow()
    expect(() => parseCircuitoScore("6-4 3-6 6-3", { isFinal: false })).toThrow(/Tercer set inválido/)
  })

  it("acepta un 3er set con score real en la final", () => {
    const parsed = parseCircuitoScore("6-4 3-6 6-3", { isFinal: true })
    expect(parsed.setsWonA).toBe(2)
    expect(parsed.gamesWonA).toBe(15)
    expect(parsed.gamesWonB).toBe(13)
  })

  it("acepta también 7-6 en la final (llegó a tiebreak)", () => {
    expect(() => parseCircuitoScore("6-4 3-6 7-6", { isFinal: true })).not.toThrow()
  })

  it("acepta un WO registrado como 6-0 6-0", () => {
    const parsed = parseCircuitoScore("6-0 6-0", { isFinal: false })
    expect(parsed.setsWonA).toBe(2)
    expect(parsed.setsWonB).toBe(0)
  })

  it("rechaza score vacío, sets empatados o formato inválido", () => {
    expect(() => parseCircuitoScore("", { isFinal: false })).toThrow()
    expect(() => parseCircuitoScore("6-6", { isFinal: false })).toThrow()
    expect(() => parseCircuitoScore("6-4", { isFinal: false })).toThrow()
    expect(() => parseCircuitoScore("6-4 6-3 6-3 6-3", { isFinal: false })).toThrow()
  })
})
