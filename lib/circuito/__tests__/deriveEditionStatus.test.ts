import { describe, expect, it } from "vitest"
import { deriveEditionStatus } from "../editionStatus"
import type { CategoryStatusMatch } from "../categoryStatus"

// Categoría de 5 (todos contra todos): 10 partidos, sin final.
function roundRobin5(played: number): { drawSize: number; matches: CategoryStatusMatch[] } {
  const ids = ["a", "b", "c", "d", "e"]
  const pairs = ids.flatMap((x, i) => ids.slice(i + 1).map((y) => [x, y] as const))
  return {
    drawSize: 5,
    matches: pairs.map(([a, b], i) => ({
      bracket: "main" as const,
      round_number: 1,
      zone: null,
      participant_a_id: a,
      participant_b_id: b,
      winner_id: i < played ? a : null,
      score: i < played ? "6-0 6-0" : null,
    })),
  }
}

describe("deriveEditionStatus", () => {
  it("sin resultados en ninguna categoría: próximo", () => {
    expect(deriveEditionStatus([roundRobin5(0), roundRobin5(0)])).toBe("upcoming")
  })

  it("un resultado en cualquier categoría: en juego", () => {
    expect(deriveEditionStatus([roundRobin5(0), roundRobin5(1)])).toBe("active")
  })

  it("sigue en juego mientras falte algún resultado", () => {
    expect(deriveEditionStatus([roundRobin5(10), roundRobin5(9)])).toBe("active")
  })

  it("finalizado cuando todas las categorías con cuadro terminaron", () => {
    expect(deriveEditionStatus([roundRobin5(10), roundRobin5(10)])).toBe("finished")
  })

  it("las categorías sin cuadro no cuentan", () => {
    expect(deriveEditionStatus([roundRobin5(10), { drawSize: null, matches: [] }])).toBe("finished")
  })

  it("sin ningún cuadro no decide (se conserva el estado guardado)", () => {
    expect(deriveEditionStatus([{ drawSize: null, matches: [] }])).toBeNull()
    expect(deriveEditionStatus([])).toBeNull()
  })
})
