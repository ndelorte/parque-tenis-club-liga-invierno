import { describe, it, expect } from "vitest"
import { assignSeedsFromRanking } from "../assignSeedsFromRanking"

const single = (id: string, playerId: string) => ({ id, playerId, player2Id: null })
const pair = (id: string, playerId: string, player2Id: string) => ({ id, playerId, player2Id })

describe("assignSeedsFromRanking", () => {
  it("single: el seed es la posición entre los inscriptos según el ranking", () => {
    // Ranking: j1, j2, j3, j4. Se inscriben j4, j2 y j3 → seeds 3°, 1°, 2°.
    const seeds = assignSeedsFromRanking(
      [single("a", "j4"), single("b", "j2"), single("c", "j3")],
      ["j1", "j2", "j3", "j4"],
    )
    expect(Object.fromEntries(seeds)).toEqual({ b: 1, c: 2, a: 3 })
  })

  it("quien no tiene ranking queda sin seed", () => {
    const seeds = assignSeedsFromRanking([single("a", "j1"), single("b", "nuevo")], ["j1"])
    expect(Object.fromEntries(seeds)).toEqual({ a: 1, b: null })
  })

  it("dobles: la pareja toma la posición de su mejor jugador", () => {
    // Ranking: j1..j6. Pareja X = j5 + j2 (mejor: 2°). Pareja Y = j3 + j4 (mejor: 3°). Pareja Z = j6 + sin ranking.
    const seeds = assignSeedsFromRanking(
      [pair("Y", "j3", "j4"), pair("X", "j5", "j2"), pair("Z", "j6", "nuevo")],
      ["j1", "j2", "j3", "j4", "j5", "j6"],
    )
    expect(Object.fromEntries(seeds)).toEqual({ X: 1, Y: 2, Z: 3 })
  })

  it("dobles: una pareja sin ningún jugador rankeado queda sin seed", () => {
    const seeds = assignSeedsFromRanking([pair("X", "n1", "n2"), pair("Y", "j1", "n3")], ["j1"])
    expect(Object.fromEntries(seeds)).toEqual({ Y: 1, X: null })
  })

  it("sin ranking, nadie tiene seed", () => {
    const seeds = assignSeedsFromRanking([single("a", "j1"), single("b", "j2")], [])
    expect([...seeds.values()]).toEqual([null, null])
  })
})
