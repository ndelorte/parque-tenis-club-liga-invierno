import { describe, it, expect } from "vitest"
import { generateRepechaje } from "../generateRepechaje"
import { CIRCUITO_FORMAT_SPEC } from "../formatSpec"
import type { CircuitoFormatSpec, CircuitoParticipant } from "../types"

function makeLosers(n: number): CircuitoParticipant[] {
  return Array.from({ length: n }, (_, i) => ({ id: `loser${i + 1}`, seed: i + 1 }))
}

describe("generateRepechaje", () => {
  it("no arma repechaje si el cuadro principal no fue eliminación simple", () => {
    const bracket = generateRepechaje("round_robin_pure", makeLosers(4), CIRCUITO_FORMAT_SPEC)
    expect(bracket).toBeNull()
  })

  it("no arma repechaje si no hay perdedores (todos byes)", () => {
    const bracket = generateRepechaje("single_elimination", [], CIRCUITO_FORMAT_SPEC)
    expect(bracket).toBeNull()
  })

  it("arma un cuadro de eliminación simple con exactamente los perdedores de 1ª ronda", () => {
    const losers = makeLosers(5)
    const bracket = generateRepechaje("single_elimination", losers, CIRCUITO_FORMAT_SPEC)
    expect(bracket).not.toBeNull()
    expect(bracket!.format).toBe("single_elimination")

    const idsInBracket = bracket!.rounds
      .flat()
      .flatMap((m) => [m.participantA?.id, m.participantB?.id])
      .filter(Boolean)
    expect(new Set(idsInBracket)).toEqual(new Set(losers.map((l) => l.id)))

    // 5 perdedores → potencia de 2 más cercana es 8 → 3 byes
    const byes = bracket!.rounds[0].filter((m) => m.isBye)
    expect(byes).toHaveLength(3)
  })

  it("el ganador del repechaje no reingresa al cuadro principal (spec.repechaje.winnerReentersMain)", () => {
    expect(CIRCUITO_FORMAT_SPEC.repechaje.winnerReentersMain).toBe(false)
  })

  it("cambiar spec.repechaje.eligibility a 'none' desactiva el repechaje (data-driven, no hardcodeado)", () => {
    const noRepechajeSpec: CircuitoFormatSpec = {
      ...CIRCUITO_FORMAT_SPEC,
      repechaje: { ...CIRCUITO_FORMAT_SPEC.repechaje, eligibility: "none" },
    }
    const bracket = generateRepechaje("single_elimination", makeLosers(5), noRepechajeSpec)
    expect(bracket).toBeNull()
  })
})
