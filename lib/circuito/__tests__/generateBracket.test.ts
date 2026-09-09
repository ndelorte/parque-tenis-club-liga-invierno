import { describe, it, expect } from "vitest"
import { generateBracket, nextPowerOfTwo, selectDrawRule } from "../generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../formatSpec"
import type { CircuitoFormatSpec, CircuitoParticipant } from "../types"

function makeParticipants(n: number): CircuitoParticipant[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, seed: i + 1 }))
}

describe("selectDrawRule", () => {
  it("no elige ninguna regla para menos de 4 inscriptos", () => {
    expect(selectDrawRule(3, CIRCUITO_FORMAT_SPEC)).toBeNull()
    expect(selectDrawRule(0, CIRCUITO_FORMAT_SPEC)).toBeNull()
  })

  it("elige round_robin_with_final para N=4", () => {
    expect(selectDrawRule(4, CIRCUITO_FORMAT_SPEC)?.format).toBe("round_robin_with_final")
  })

  it("elige round_robin_pure para N=5", () => {
    expect(selectDrawRule(5, CIRCUITO_FORMAT_SPEC)?.format).toBe("round_robin_pure")
  })

  it("elige groups_then_knockout para N=6 y N=7", () => {
    expect(selectDrawRule(6, CIRCUITO_FORMAT_SPEC)?.format).toBe("groups_then_knockout")
    expect(selectDrawRule(7, CIRCUITO_FORMAT_SPEC)?.format).toBe("groups_then_knockout")
  })

  it("elige single_elimination para N=8 en adelante, sin techo", () => {
    expect(selectDrawRule(8, CIRCUITO_FORMAT_SPEC)?.format).toBe("single_elimination")
    expect(selectDrawRule(35, CIRCUITO_FORMAT_SPEC)?.format).toBe("single_elimination")
    expect(selectDrawRule(1000, CIRCUITO_FORMAT_SPEC)?.format).toBe("single_elimination")
  })
})

describe("nextPowerOfTwo", () => {
  it("redondea hacia arriba a la potencia de 2 más cercana", () => {
    expect(nextPowerOfTwo(1)).toBe(1)
    expect(nextPowerOfTwo(8)).toBe(8)
    expect(nextPowerOfTwo(9)).toBe(16)
    expect(nextPowerOfTwo(16)).toBe(16)
    expect(nextPowerOfTwo(35)).toBe(64)
  })
})

describe("generateBracket — N=3 (no se juega)", () => {
  it("rechaza con menos de 4 inscriptos", () => {
    expect(() => generateBracket(makeParticipants(3), CIRCUITO_FORMAT_SPEC)).toThrow()
  })
})

describe("generateBracket — N=4 (round robin + final)", () => {
  it("arma 6 partidos de zona (todos contra todos) + 1 final TBD", () => {
    const bracket = generateBracket(makeParticipants(4), CIRCUITO_FORMAT_SPEC)
    expect(bracket.format).toBe("round_robin_with_final")
    expect(bracket.rounds[0]).toHaveLength(6) // C(4,2)
    expect(bracket.rounds[1]).toHaveLength(1)
    expect(bracket.rounds[1][0].participantA).toBeNull()
    expect(bracket.rounds[1][0].participantB).toBeNull()
  })
})

describe("generateBracket — N=5 (round robin puro)", () => {
  it("arma 10 partidos de zona, sin final", () => {
    const bracket = generateBracket(makeParticipants(5), CIRCUITO_FORMAT_SPEC)
    expect(bracket.format).toBe("round_robin_pure")
    expect(bracket.rounds).toHaveLength(1)
    expect(bracket.rounds[0]).toHaveLength(10) // C(5,2)
  })
})

describe("generateBracket — N=6/7 (zonas + llave)", () => {
  it("N=6: reparte 3 y 3, sin partido de 3er puesto", () => {
    const bracket = generateBracket(makeParticipants(6), CIRCUITO_FORMAT_SPEC)
    expect(bracket.format).toBe("groups_then_knockout")
    const zoneMatches = bracket.rounds[0]
    const zoneA = zoneMatches.filter((m) => m.group === "A")
    const zoneB = zoneMatches.filter((m) => m.group === "B")
    expect(zoneA).toHaveLength(3) // C(3,2)
    expect(zoneB).toHaveLength(3)
    expect(bracket.rounds[1]).toHaveLength(2) // semifinales
    expect(bracket.rounds[2]).toHaveLength(1) // final
  })

  it("N=7: reparte 3 y 4", () => {
    const bracket = generateBracket(makeParticipants(7), CIRCUITO_FORMAT_SPEC)
    const zoneMatches = bracket.rounds[0]
    const zoneA = zoneMatches.filter((m) => m.group === "A")
    const zoneB = zoneMatches.filter((m) => m.group === "B")
    expect(zoneA).toHaveLength(3) // 3 jugadores → C(3,2)
    expect(zoneB).toHaveLength(6) // 4 jugadores → C(4,2)
  })
})

describe.each([8, 9, 16, 35])("generateBracket — N=%i (eliminación simple)", (n) => {
  it("da byes solo a los mejores sembrados y arma un cuadro sin cruces inválidos", () => {
    const bracket = generateBracket(makeParticipants(n), CIRCUITO_FORMAT_SPEC)
    expect(bracket.format).toBe("single_elimination")

    const bracketSize = nextPowerOfTwo(n)
    const byeCount = bracketSize - n
    const round1 = bracket.rounds[0]

    expect(round1).toHaveLength(bracketSize / 2)

    const byeMatches = round1.filter((m) => m.isBye)
    expect(byeMatches).toHaveLength(byeCount)
    // los byes son los `byeCount` mejores sembrados (seed 1..byeCount)
    const byeSeeds = byeMatches.map((m) => m.participantA?.seed).sort((a, b) => (a ?? 0) - (b ?? 0))
    expect(byeSeeds).toEqual(Array.from({ length: byeCount }, (_, i) => i + 1))

    // sin cruces inválidos: nadie juega contra sí mismo, nadie aparece 2 veces en ronda 1
    const idsInRound1 = round1.flatMap((m) => [m.participantA?.id, m.participantB?.id]).filter(Boolean)
    expect(new Set(idsInRound1).size).toBe(idsInRound1.length)
    for (const m of round1) {
      if (!m.isBye) expect(m.participantA?.id).not.toBe(m.participantB?.id)
    }

    // rondas siguientes: TBD, halving hasta la final (1 partido)
    let expectedMatches = bracketSize / 2
    for (let i = 1; i < bracket.rounds.length; i++) {
      expectedMatches = expectedMatches / 2
      expect(bracket.rounds[i]).toHaveLength(expectedMatches)
      for (const m of bracket.rounds[i]) {
        expect(m.participantA).toBeNull()
        expect(m.participantB).toBeNull()
      }
    }
    expect(expectedMatches).toBe(1) // la última ronda es la final
  })
})

describe("generateBracket — determinismo y validaciones", () => {
  it("es determinista: llamarlo 2 veces con el mismo input da el mismo resultado", () => {
    const participants = makeParticipants(16)
    const b1 = generateBracket(participants, CIRCUITO_FORMAT_SPEC)
    const b2 = generateBracket(participants, CIRCUITO_FORMAT_SPEC)
    expect(b1).toEqual(b2)
  })

  it("el resultado no depende de seedingSource si los seeds ya vienen asignados (el motor no busca datos externos)", () => {
    const participants = makeParticipants(16)
    const manualSpec: CircuitoFormatSpec = { ...CIRCUITO_FORMAT_SPEC, seedingSource: "manual" }
    const rankingBracket = generateBracket(participants, CIRCUITO_FORMAT_SPEC)
    const manualBracket = generateBracket(participants, manualSpec)
    expect(rankingBracket).toEqual(manualBracket)
  })

  it("cambiar la spec (no el código) cambia el armado", () => {
    const participants = makeParticipants(6)
    const defaultBracket = generateBracket(participants, CIRCUITO_FORMAT_SPEC)
    expect(defaultBracket.format).toBe("groups_then_knockout")

    const forcedSingleElim: CircuitoFormatSpec = {
      ...CIRCUITO_FORMAT_SPEC,
      drawRules: [{ minN: 1, maxN: null, format: "single_elimination" }],
    }
    const altBracket = generateBracket(participants, forcedSingleElim)
    expect(altBracket.format).toBe("single_elimination")
  })

  it("rechaza participantes duplicados", () => {
    const dup = [...makeParticipants(4), { id: "p1", seed: 5 }]
    expect(() => generateBracket(dup, CIRCUITO_FORMAT_SPEC)).toThrow()
  })
})
