import { describe, it, expect } from "vitest"
import { generateBracket } from "../generateBracket"
import { advanceWinner } from "../advanceWinner"
import { CIRCUITO_FORMAT_SPEC } from "../formatSpec"
import type { CircuitoParticipant } from "../types"

function makeParticipants(n: number): CircuitoParticipant[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, seed: i + 1 }))
}

describe("advanceWinner", () => {
  it("coloca al ganador en el slot correcto de la ronda siguiente", () => {
    const bracket = generateBracket(makeParticipants(8), CIRCUITO_FORMAT_SPEC)
    const match0 = bracket.rounds[0][0] // seed1 vs seed8
    const winner = match0.participantA! // seed1

    const updated = advanceWinner(bracket, 1, 0, winner)

    expect(updated.rounds[1][0].participantA).toEqual(winner)
    expect(updated.rounds[1][0].participantB).toBeNull()
    // no muta el original (actualización inmutable)
    expect(bracket.rounds[1][0].participantA).toBeNull()
  })

  it("el partido de índice impar ocupa el slot B de la ronda siguiente", () => {
    const bracket = generateBracket(makeParticipants(8), CIRCUITO_FORMAT_SPEC)
    const match1 = bracket.rounds[0][1]
    const winner = match1.participantA!

    const updated = advanceWinner(bracket, 1, 1, winner)

    expect(updated.rounds[1][0].participantB).toEqual(winner)
  })

  it("no hace nada si el partido es la final (no hay ronda siguiente)", () => {
    const bracket = generateBracket(makeParticipants(4), { ...CIRCUITO_FORMAT_SPEC, drawRules: [{ minN: 1, maxN: null, format: "single_elimination" }] })
    const lastRoundIndex = bracket.rounds.length
    const finalMatch = bracket.rounds[bracket.rounds.length - 1][0]
    const winner: CircuitoParticipant = { id: "ganador-final", seed: 1 }
    // fuerza un participante real en la final para poder "ganarla"
    bracket.rounds[bracket.rounds.length - 1][0] = { ...finalMatch, participantA: winner }

    const updated = advanceWinner(bracket, lastRoundIndex, 0, winner)
    expect(updated).toEqual(bracket)
  })

  it("rechaza avanzar un ganador que no jugó ese partido", () => {
    const bracket = generateBracket(makeParticipants(8), CIRCUITO_FORMAT_SPEC)
    const impostor: CircuitoParticipant = { id: "no-jugo", seed: 99 }
    expect(() => advanceWinner(bracket, 1, 0, impostor)).toThrow()
  })

  it("rechaza operar sobre formatos que no son eliminación simple", () => {
    const bracket = generateBracket(makeParticipants(5), CIRCUITO_FORMAT_SPEC) // round_robin_pure
    const someone = bracket.rounds[0][0].participantA!
    expect(() => advanceWinner(bracket, 1, 0, someone)).toThrow()
  })
})
