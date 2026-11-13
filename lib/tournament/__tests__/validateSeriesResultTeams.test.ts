import { describe, it, expect } from "vitest"
import { validateSeriesResultTeams, type SeriesTeamsInput } from "../validateSeriesResultTeams"

const DB = { homeTeamId: "home", awayTeamId: "away" }

function input(overrides: Partial<SeriesTeamsInput> = {}): SeriesTeamsInput {
  return {
    homeTeamId: "home",
    awayTeamId: "away",
    isGeneralWalkover: false,
    walkoverWinnerId: null,
    courts: [
      { courtNumber: 1, winnerTeamId: "home" },
      { courtNumber: 2, winnerTeamId: "away" },
      { courtNumber: 3, winnerTeamId: null },
    ],
    ...overrides,
  }
}

describe("validateSeriesResultTeams", () => {
  it("acepta una serie con ganadores de la serie o canchas sin definir", () => {
    expect(validateSeriesResultTeams(input(), DB)).toBeNull()
  })

  it("rechaza si el local o el visitante no coinciden con la base", () => {
    expect(validateSeriesResultTeams(input({ homeTeamId: "otro" }), DB)).toMatch(/no coinciden/)
    expect(validateSeriesResultTeams(input({ awayTeamId: "otro" }), DB)).toMatch(/no coinciden/)
  })

  it("rechaza local y visitante invertidos", () => {
    expect(
      validateSeriesResultTeams(input({ homeTeamId: "away", awayTeamId: "home" }), DB),
    ).toMatch(/no coinciden/)
  })

  it("rechaza un ganador de cancha ajeno a la serie", () => {
    const courts = [
      { courtNumber: 1, winnerTeamId: "home" },
      { courtNumber: 2, winnerTeamId: "intruso" },
      { courtNumber: 3, winnerTeamId: "home" },
    ]
    expect(validateSeriesResultTeams(input({ courts }), DB)).toMatch(/cancha 2/)
  })

  it("rechaza canchas repetidas o fuera de 1-3", () => {
    expect(
      validateSeriesResultTeams(
        input({ courts: [{ courtNumber: 1, winnerTeamId: "home" }, { courtNumber: 1, winnerTeamId: "away" }] }),
        DB,
      ),
    ).toMatch(/canchas/)
    expect(
      validateSeriesResultTeams(input({ courts: [{ courtNumber: 4, winnerTeamId: "home" }] }), DB),
    ).toMatch(/canchas/)
  })

  it("WO general: acepta cualquiera de los dos equipos", () => {
    expect(validateSeriesResultTeams(input({ isGeneralWalkover: true, walkoverWinnerId: "home" }), DB)).toBeNull()
    expect(validateSeriesResultTeams(input({ isGeneralWalkover: true, walkoverWinnerId: "away" }), DB)).toBeNull()
  })

  it("WO general: rechaza ganador ajeno o vacío", () => {
    expect(
      validateSeriesResultTeams(input({ isGeneralWalkover: true, walkoverWinnerId: "intruso" }), DB),
    ).toMatch(/W\.O\. general/)
    expect(
      validateSeriesResultTeams(input({ isGeneralWalkover: true, walkoverWinnerId: null }), DB),
    ).toMatch(/Elegí/)
  })

  it("WO general: no mira los ganadores de cancha que mande el cliente", () => {
    const courts = [{ courtNumber: 1, winnerTeamId: "intruso" }]
    expect(
      validateSeriesResultTeams(input({ isGeneralWalkover: true, walkoverWinnerId: "home", courts }), DB),
    ).toBeNull()
  })
})
