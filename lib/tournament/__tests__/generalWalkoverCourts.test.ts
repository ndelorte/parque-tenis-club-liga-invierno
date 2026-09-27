import { describe, it, expect } from "vitest"
import { generalWalkoverCourts } from "../generalWalkoverCourts"
import { parseScore } from "../parseScore"

describe("generalWalkoverCourts (OQ-08)", () => {
  it("gana el local: las 3 canchas 6-0 6-0 a su favor", () => {
    expect(generalWalkoverCourts("home", "home")).toEqual([
      { courtNumber: 1, score: "6-0 6-0", winnerTeamId: "home" },
      { courtNumber: 2, score: "6-0 6-0", winnerTeamId: "home" },
      { courtNumber: 3, score: "6-0 6-0", winnerTeamId: "home" },
    ])
  })

  it("gana el visitante: 0-6 0-6 desde la perspectiva del local", () => {
    expect(generalWalkoverCourts("away", "home").map((c) => c.score)).toEqual(["0-6 0-6", "0-6 0-6", "0-6 0-6"])
  })

  it("coincide con lo que computa la tabla para un WO general: 3 canchas, 6 sets, 36 games", () => {
    const courts = generalWalkoverCourts("home", "home").map((c) => parseScore(c.score))
    const sets = courts.reduce((acc, c) => acc + c.home_sets_won, 0)
    const games = courts.reduce((acc, c) => acc + c.home_games_won, 0)
    expect([courts.length, sets, games]).toEqual([3, 6, 36])
  })
})
