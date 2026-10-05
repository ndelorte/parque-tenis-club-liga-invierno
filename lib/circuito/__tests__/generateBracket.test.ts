import { sortBySeed } from "../generateBracket"
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

// Ubicación de los cabezas de serie (reglas-circuito-del-parque.md,
// "Ubicación en el cuadro"): como en el tenis profesional.
describe("generateBracket — ubicación de los seeds (eliminación simple)", () => {
  // Línea (0-based, de arriba abajo) de cada participante en la 1ª ronda.
  function lineOf(n: number): Map<string, number> {
    const round1 = generateBracket(makeParticipants(n), CIRCUITO_FORMAT_SPEC).rounds[0]
    const lines = new Map<string, number>()
    round1.forEach((m, i) => {
      if (m.participantA) lines.set(m.participantA.id, i * 2)
      if (m.participantB) lines.set(m.participantB.id, i * 2 + 1)
    })
    return lines
  }

  // Ronda en la que se pueden cruzar dos líneas (1 = 1ª ronda).
  function meetingRound(a: number, b: number): number {
    let round = 1
    while (a >> round !== b >> round) round++
    return round
  }

  it("N=8: cruces 1-8, 4-5, 3-6, 2-7 de arriba abajo", () => {
    const round1 = generateBracket(makeParticipants(8), CIRCUITO_FORMAT_SPEC).rounds[0]
    expect(round1.map((m) => [m.participantA?.seed, m.participantB?.seed])).toEqual([
      [1, 8],
      [4, 5],
      [3, 6],
      [2, 7],
    ])
  })

  it.each([8, 12, 16, 20, 32])("N=%i: el 1 arriba de todo y el 2 abajo de todo", (n) => {
    const lines = lineOf(n)
    const bracketSize = nextPowerOfTwo(n)
    expect(lines.get("p1")).toBe(0)
    // el 2 ocupa la última línea con rival, o la anteúltima si tiene bye
    expect(lines.get("p2")).toBeGreaterThanOrEqual(bracketSize - 2)
  })

  it.each([8, 12, 16, 20, 32])("N=%i: 1 y 2 solo se cruzan en la final; 3 y 4 en mitades distintas", (n) => {
    const lines = lineOf(n)
    const totalRounds = Math.log2(nextPowerOfTwo(n))
    const round = (a: string, b: string) => meetingRound(lines.get(a)!, lines.get(b)!)
    expect(round("p1", "p2")).toBe(totalRounds)
    expect(round("p3", "p4")).toBe(totalRounds)
    // cada uno de 3 y 4 cae en la mitad de uno de los 2 primeros: se cruzan en semis
    expect([round("p1", "p3"), round("p1", "p4")].sort()).toEqual([totalRounds - 1, totalRounds].sort())
    expect([round("p2", "p3"), round("p2", "p4")].sort()).toEqual([totalRounds - 1, totalRounds].sort())
  })

  it.each([16, 20, 32])("N=%i: del 1 al 8 cada uno en un cuarto distinto de a pares (recién se cruzan en cuartos)", (n) => {
    const lines = lineOf(n)
    const totalRounds = Math.log2(nextPowerOfTwo(n))
    for (let i = 1; i <= 8; i++) {
      for (let j = i + 1; j <= 8; j++) {
        expect(meetingRound(lines.get(`p${i}`)!, lines.get(`p${j}`)!)).toBeGreaterThanOrEqual(totalRounds - 2)
      }
    }
  })

  it("N=12: los 4 byes son para los seeds 1-4, uno en cada cuarto", () => {
    const round1 = generateBracket(makeParticipants(12), CIRCUITO_FORMAT_SPEC).rounds[0]
    const byes = round1.map((m, i) => (m.isBye ? { seed: m.participantA!.seed, quarter: Math.floor(i / 2) } : null))
    const realByes = byes.filter((b) => b !== null)
    expect(realByes.map((b) => b.seed).sort()).toEqual([1, 2, 3, 4])
    expect(new Set(realByes.map((b) => b.quarter)).size).toBe(4)
  })
})

describe("sorteo de los participantes sin seed", () => {
  const withSeeds = (n: number, seeded: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `p${String(i + 1).padStart(2, "0")}`, seed: i < seeded ? i + 1 : null }))

  it("los sembrados quedan primero y en orden; el resto se mezcla pero no se pierde nadie", () => {
    const ps = withSeeds(12, 8)
    // random determinista que invierte el orden
    const sorted = sortBySeed(ps, () => 0)
    expect(sorted.slice(0, 8).map((p) => p.seed)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(sorted.map((p) => p.id).sort()).toEqual(ps.map((p) => p.id).sort())
  })

  it("sin random el orden de los no sembrados es estable (por id)", () => {
    const sorted = sortBySeed(withSeeds(12, 8))
    expect(sorted.slice(8).map((p) => p.id)).toEqual(["p09", "p10", "p11", "p12"])
  })

  it("con random distinto de un orden estable puede cambiar el de los no sembrados", () => {
    const orders = new Set<string>()
    for (let k = 0; k < 20; k++) {
      orders.add(sortBySeed(withSeeds(12, 8), Math.random).slice(8).map((p) => p.id).join())
    }
    expect(orders.size).toBeGreaterThan(1)
  })
})
