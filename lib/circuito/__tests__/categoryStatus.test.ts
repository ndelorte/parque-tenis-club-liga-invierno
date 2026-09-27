import { describe, expect, it } from "vitest"
import { categoryStatus, formatLabel, type CategoryStatusMatch, type CategoryStatusParticipant } from "../categoryStatus"

function m(overrides: Partial<CategoryStatusMatch> & Pick<CategoryStatusMatch, "round_number">): CategoryStatusMatch {
  return {
    bracket: "main",
    zone: null,
    participant_a_id: null,
    participant_b_id: null,
    winner_id: null,
    score: null,
    ...overrides,
  }
}

describe("formatLabel", () => {
  it("N=4: todos contra todos y final", () => {
    expect(formatLabel(4)).toBe("Todos contra todos y final")
  })
  it("N=5: todos contra todos, sin final", () => {
    expect(formatLabel(5)).toBe("Todos contra todos")
  })
  it("N=6 y N=7: dos zonas y final", () => {
    expect(formatLabel(6)).toBe("Dos zonas y final")
    expect(formatLabel(7)).toBe("Dos zonas y final")
  })
  it("N=8+: cuadro de la potencia de 2 más cercana", () => {
    expect(formatLabel(8)).toBe("Cuadro de 8")
    expect(formatLabel(13)).toBe("Cuadro de 16")
    expect(formatLabel(32)).toBe("Cuadro de 32")
  })
})

describe("categoryStatus", () => {
  const names: Record<string, CategoryStatusParticipant> = {
    p1: { name: "Jugador 1", seed: 1 },
    p2: { name: "Jugador 2", seed: 2 },
    p3: { name: "Jugador 3", seed: 3 },
    p4: { name: "Jugador 4", seed: 4 },
    p5: { name: "Jugador 5", seed: 5 },
  }

  it("sin partidos: pending", () => {
    expect(categoryStatus(8, [], names)).toEqual({ kind: "pending" })
  })

  it("drawSize sin drawRule (menos de 4): pending", () => {
    expect(categoryStatus(2, [m({ round_number: 1 })], names)).toEqual({ kind: "pending" })
  })

  describe("N=5 (round_robin_pure)", () => {
    const allPairs = [
      ["p1", "p2"], ["p1", "p3"], ["p1", "p4"], ["p1", "p5"],
      ["p2", "p3"], ["p2", "p4"], ["p2", "p5"],
      ["p3", "p4"], ["p3", "p5"],
      ["p4", "p5"],
    ]

    it("en juego mientras no terminaron los 10 partidos", () => {
      const matches = allPairs
        .slice(0, 6)
        .map(([a, b]) => m({ round_number: 1, participant_a_id: a, participant_b_id: b, winner_id: a, score: "6-0 6-0" }))
      expect(categoryStatus(5, matches, names)).toEqual({ kind: "live", label: "6 de 10 partidos" })
    })

    it("terminado: campeón = 1° de la tabla", () => {
      const matches = allPairs.map(([a, b]) => m({ round_number: 1, participant_a_id: a, participant_b_id: b, winner_id: a, score: "6-0 6-0" }))
      // p1 gana todos sus partidos (vs p2,p3,p4,p5) → 1° de la tabla.
      const status = categoryStatus(5, matches, names)
      expect(status).toEqual({ kind: "finished", champion: "Jugador 1" })
    })
  })

  describe("N=4 (round_robin_with_final)", () => {
    const zonePairs = [["p1", "p2"], ["p1", "p3"], ["p1", "p4"], ["p2", "p3"], ["p2", "p4"], ["p3", "p4"]]

    it("en juego durante la zona", () => {
      const matches = zonePairs.slice(0, 3).map(([a, b]) => m({ round_number: 1, participant_a_id: a, participant_b_id: b, winner_id: a, score: "6-0 6-0" }))
      expect(categoryStatus(4, matches, names)).toEqual({ kind: "live", label: "3 de 6 partidos" })
    })

    it("en juego, zona terminada, jugando la final", () => {
      const matches = zonePairs.map(([a, b]) => m({ round_number: 1, participant_a_id: a, participant_b_id: b, winner_id: a, score: "6-0 6-0" }))
      matches.push(m({ round_number: 2, participant_a_id: "p1", participant_b_id: "p2" }))
      expect(categoryStatus(4, matches, names)).toEqual({ kind: "live", label: "Final" })
    })

    it("terminado: campeón de la final", () => {
      const matches = zonePairs.map(([a, b]) => m({ round_number: 1, participant_a_id: a, participant_b_id: b, winner_id: a, score: "6-0 6-0" }))
      matches.push(m({ round_number: 2, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0" }))
      expect(categoryStatus(4, matches, names)).toEqual({ kind: "finished", champion: "Jugador 1" })
    })
  })

  describe("N=6-7 (groups_then_knockout)", () => {
    const zoneA = [["p1", "p2"], ["p1", "p3"], ["p2", "p3"]]
    const zoneB = [["p4", "p5"]]

    function zoneMatches() {
      return [
        ...zoneA.map(([a, b]) => m({ round_number: 1, zone: "A" as const, participant_a_id: a, participant_b_id: b, winner_id: a, score: "6-0 6-0" })),
        ...zoneB.map(([a, b]) => m({ round_number: 1, zone: "B" as const, participant_a_id: a, participant_b_id: b, winner_id: a, score: "6-0 6-0" })),
      ]
    }

    it("en juego: zonas sin terminar", () => {
      const matches = [zoneMatches()[0]]
      expect(categoryStatus(6, matches, names)).toEqual({ kind: "live", label: "Zonas" })
    })

    it("en juego: zonas listas, semifinales sin jugar", () => {
      const matches = [...zoneMatches(), m({ round_number: 2, participant_a_id: "p1", participant_b_id: "p4" }), m({ round_number: 2, participant_a_id: "p4", participant_b_id: "p1" })]
      expect(categoryStatus(6, matches, names)).toEqual({ kind: "live", label: "Semifinales" })
    })

    it("en juego: semifinales listas, final sin jugar", () => {
      const matches = [
        ...zoneMatches(),
        m({ round_number: 2, participant_a_id: "p1", participant_b_id: "p4", winner_id: "p1", score: "6-0 6-0" }),
        m({ round_number: 2, participant_a_id: "p4", participant_b_id: "p1", winner_id: "p1", score: "6-0 6-0" }),
        m({ round_number: 3, participant_a_id: "p1", participant_b_id: "p1" }),
      ]
      expect(categoryStatus(6, matches, names)).toEqual({ kind: "live", label: "Final" })
    })

    it("terminado: campeón de la final", () => {
      const matches = [
        ...zoneMatches(),
        m({ round_number: 2, participant_a_id: "p1", participant_b_id: "p4", winner_id: "p1", score: "6-0 6-0" }),
        m({ round_number: 2, participant_a_id: "p4", participant_b_id: "p1", winner_id: "p1", score: "6-0 6-0" }),
        m({ round_number: 3, participant_a_id: "p1", participant_b_id: "p1", winner_id: "p1", score: "6-0 6-0" }),
      ]
      expect(categoryStatus(6, matches, names)).toEqual({ kind: "finished", champion: "Jugador 1" })
    })
  })

  describe("N=8+ (single_elimination)", () => {
    it("en juego: 1ª ronda con un partido real sin ganador (cuadro de 8 = 3 rondas)", () => {
      const matches = [
        m({ round_number: 1, participant_a_id: "p1", participant_b_id: "p2" }),
        m({ round_number: 1, participant_a_id: "p3", participant_b_id: null }), // bye
        m({ round_number: 2 }), // TBD, todavía sin participantes
        m({ round_number: 3 }), // TBD
      ]
      expect(categoryStatus(8, matches, names)).toEqual({ kind: "live", label: "Cuartos de final" })
    })

    it("en juego: cuartos listos, jugando semifinal", () => {
      const matches = [
        m({ round_number: 1, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0" }),
        m({ round_number: 1, participant_a_id: "p3", participant_b_id: null }), // bye
        m({ round_number: 2, participant_a_id: "p1", participant_b_id: "p3" }),
        m({ round_number: 3 }), // TBD
      ]
      expect(categoryStatus(8, matches, names)).toEqual({ kind: "live", label: "Semifinales" })
    })

    it("terminado: campeón de la última ronda", () => {
      const matches = [
        m({ round_number: 1, participant_a_id: "p1", participant_b_id: "p2", winner_id: "p1", score: "6-0 6-0" }),
        m({ round_number: 1, participant_a_id: "p3", participant_b_id: null }), // bye
        m({ round_number: 2, participant_a_id: "p1", participant_b_id: "p3", winner_id: "p1", score: "6-0 6-0" }),
      ]
      expect(categoryStatus(8, matches, names)).toEqual({ kind: "finished", champion: "Jugador 1" })
    })
  })
})
