import { describe, it, expect } from "vitest"
import {
  generateSixTeamQuarterfinals,
  generateProvisionalBracket,
  mergeProvisionalBracketWithScheduledMatches,
} from "../generateProvisionalBracket"
import type { StandingsRow, Team } from "@/lib/tournament/types"

function makeTeam(id: string, name: string): Team {
  return { id, name, slug: id, category_id: "cat1", active: true }
}

function makeRow(position: number, team: Team, points = 10): StandingsRow {
  return {
    team_id: team.id,
    team,
    played: 5,
    won: 3,
    lost: 2,
    points,
    courts_won: 10,
    courts_lost: 5,
    courts_diff: 5,
    sets_won: 20,
    sets_lost: 10,
    sets_diff: 10,
    games_won: 100,
    games_lost: 50,
    games_diff: 50,
    position,
  }
}

const teams = {
  t1: makeTeam("t1", "Equipo 1"),
  t2: makeTeam("t2", "Equipo 2"),
  t3: makeTeam("t3", "Equipo 3"),
  t4: makeTeam("t4", "Equipo 4"),
  t5: makeTeam("t5", "Equipo 5"),
  t6: makeTeam("t6", "Equipo 6"),
}

const standings6: StandingsRow[] = [
  makeRow(1, teams.t1, 20),
  makeRow(2, teams.t2, 18),
  makeRow(3, teams.t3, 14),
  makeRow(4, teams.t4, 12),
  makeRow(5, teams.t5, 10),
  makeRow(6, teams.t6, 6),
]

describe("generateSixTeamQuarterfinals", () => {
  it("genera byes para 1° y 2°", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    expect(bracket.byes[0].seed).toBe(1)
    expect(bracket.byes[0].team.id).toBe("t1")
    expect(bracket.byes[1].seed).toBe(2)
    expect(bracket.byes[1].team.id).toBe("t2")
  })

  it("genera cruce 3° vs 6°", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    const qf1 = bracket.quarterfinals[0]
    expect(qf1.home.seed).toBe(3)
    expect(qf1.home.team.id).toBe("t3")
    expect(qf1.away.seed).toBe(6)
    expect(qf1.away.team.id).toBe("t6")
  })

  it("genera cruce 4° vs 5°", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    const qf2 = bracket.quarterfinals[1]
    expect(qf2.home.seed).toBe(4)
    expect(qf2.home.team.id).toBe("t4")
    expect(qf2.away.seed).toBe(5)
    expect(qf2.away.team.id).toBe("t5")
  })

  it("si cambia la tabla, cambian los cruces provisorios", () => {
    const altStandings: StandingsRow[] = [
      makeRow(1, teams.t6, 20),
      makeRow(2, teams.t5, 18),
      makeRow(3, teams.t4, 14),
      makeRow(4, teams.t3, 12),
      makeRow(5, teams.t2, 10),
      makeRow(6, teams.t1, 6),
    ]
    const bracket = generateSixTeamQuarterfinals(altStandings)
    expect(bracket.byes[0].team.id).toBe("t6")
    expect(bracket.byes[1].team.id).toBe("t5")
    expect(bracket.quarterfinals[0].home.team.id).toBe("t4") // 3°
    expect(bracket.quarterfinals[0].away.team.id).toBe("t1") // 6°
  })

  it("los byes colocan a 1° y 2° directamente en semifinal", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    expect(bracket.byes[0].seed).toBe(1)
    expect(bracket.byes[1].seed).toBe(2)
    // QF1 feeds semifinal with seed 1 (bye)
    expect(bracket.quarterfinals[0].matchNumber).toBe(1)
    // QF2 feeds semifinal with seed 2 (bye)
    expect(bracket.quarterfinals[1].matchNumber).toBe(2)
  })

  it("ganador de cuartos puede avanzar a semifinal", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    // 1° (bye) espera al ganador de QF1 (3° vs 6°)
    expect(bracket.byes[0].team.id).toBe("t1")
    expect(bracket.quarterfinals[0].home.team.id).toBe("t3")
    expect(bracket.quarterfinals[0].away.team.id).toBe("t6")
    // 2° (bye) espera al ganador de QF2 (4° vs 5°)
    expect(bracket.byes[1].team.id).toBe("t2")
    expect(bracket.quarterfinals[1].home.team.id).toBe("t4")
    expect(bracket.quarterfinals[1].away.team.id).toBe("t5")
  })

  it("lanza error si hay menos de 6 equipos", () => {
    const short = standings6.slice(0, 4)
    expect(() => generateSixTeamQuarterfinals(short)).toThrow()
  })
})

describe("generateProvisionalBracket", () => {
  it("genera bracket para 6 equipos", () => {
    const bracket = generateProvisionalBracket(standings6, 6)
    expect(bracket.quarterfinals).toHaveLength(2)
    expect(bracket.byes).toHaveLength(2)
  })

  it("lanza error para cantidad no soportada", () => {
    const short = standings6.slice(0, 4)
    expect(() => generateProvisionalBracket(short, 4)).toThrow()
  })
})

describe("mergeProvisionalBracketWithScheduledMatches", () => {
  it("sin series programadas, cuartos quedan pending sin fecha", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    const merged = mergeProvisionalBracketWithScheduledMatches(bracket, [])
    expect(merged.quarterfinals[0].scheduledDate).toBeUndefined()
    expect(merged.quarterfinals[0].seriesId).toBeUndefined()
    expect(merged.quarterfinals[0].status).toBe("pending")
  })

  it("fecha de cuartos se muestra si fue cargada desde admin", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    const merged = mergeProvisionalBracketWithScheduledMatches(bracket, [
      {
        id: "series-qf1",
        home_team_id: "t3",
        away_team_id: "t6",
        scheduled_date: "2026-07-20",
        scheduled_time: "19:30",
        status: "scheduled",
        winner_team_id: null,
      },
    ])
    expect(merged.quarterfinals[0].seriesId).toBe("series-qf1")
    expect(merged.quarterfinals[0].scheduledDate).toBe("2026-07-20")
    expect(merged.quarterfinals[0].scheduledTime).toBe("19:30")
    expect(merged.quarterfinals[0].status).toBe("scheduled")
  })

  it("si no hay fecha cargada, status queda pending", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    const merged = mergeProvisionalBracketWithScheduledMatches(bracket, [])
    expect(merged.quarterfinals[0].status).toBe("pending")
  })

  it("marca como completado cuando hay resultado cargado", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    const merged = mergeProvisionalBracketWithScheduledMatches(bracket, [
      {
        id: "series-qf2",
        home_team_id: "t4",
        away_team_id: "t5",
        scheduled_date: "2026-07-20",
        status: "completed",
        winner_team_id: "t4",
      },
    ])
    expect(merged.quarterfinals[1].status).toBe("completed")
    expect(merged.quarterfinals[1].winnerTeamId).toBe("t4")
  })

  it("puede matchear aunque los equipos estén invertidos (away vs home)", () => {
    const bracket = generateSixTeamQuarterfinals(standings6)
    const merged = mergeProvisionalBracketWithScheduledMatches(bracket, [
      {
        id: "series-qf1-inv",
        home_team_id: "t6", // invertido respecto al bracket
        away_team_id: "t3",
        scheduled_date: "2026-07-21",
        status: "scheduled",
        winner_team_id: null,
      },
    ])
    expect(merged.quarterfinals[0].seriesId).toBe("series-qf1-inv")
    expect(merged.quarterfinals[0].scheduledDate).toBe("2026-07-21")
  })
})

describe("playoffs no modifican puntos de fase regular", () => {
  it("generar el bracket no altera los standings", () => {
    const originalPoints = standings6.map((r) => r.points)
    generateSixTeamQuarterfinals(standings6)
    standings6.forEach((r, i) => {
      expect(r.points).toBe(originalPoints[i])
    })
  })

  it("los playoff no tienen puntos: solo se determina ganador de serie", () => {
    // El cálculo de ganador de playoffs es 2 de 3 canchas (misma lógica que fase regular)
    // La función generateSixTeamQuarterfinals no calcula puntos
    const bracket = generateSixTeamQuarterfinals(standings6)
    expect(bracket).not.toHaveProperty("points")
    expect(bracket.byes[0]).not.toHaveProperty("points")
  })
})
