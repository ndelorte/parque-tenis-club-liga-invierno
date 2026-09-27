import { describe, it, expect } from "vitest"
import { buildAnnualRanking, type AnnualRankingRow } from "../buildAnnualRanking"

// Octubre (10) es torneo normal: campeón 1000. Mayo (5) es Grand Slam: campeón 2000.
const row = (playerId: string, editionId: string, month: number, points: number): AnnualRankingRow => ({
  playerId,
  playerName: `Jugador ${playerId}`,
  editionId,
  month,
  points,
})
const order = (rows: AnnualRankingRow[]) => buildAnnualRanking(rows).map((e) => e.playerId)

describe("buildAnnualRanking", () => {
  it("suma los puntos de todos los torneos del año y ordena de mayor a menor", () => {
    const ranking = buildAnnualRanking([row("A", "oct", 10, 400), row("A", "nov", 11, 200), row("B", "oct", 10, 650)])
    expect(ranking.map((e) => [e.playerId, e.points])).toEqual([
      ["B", 650],
      ["A", 600],
    ])
  })

  it("a igualdad de puntos, queda arriba quien jugó menos torneos", () => {
    // A: 400 en 1 torneo (semis). B: 400 en 2 torneos (cuartos + cuartos).
    const rows = [row("B", "oct", 10, 200), row("B", "nov", 11, 200), row("A", "oct", 10, 400)]
    expect(order(rows)).toEqual(["A", "B"])
  })

  it("con mismos puntos y torneos, queda arriba quien ganó más torneos", () => {
    // A: 1 campeón (1000) + 200 = 1200 en 2 torneos. B: 650 + 550 = 1200 en 2 torneos, 0 ganados.
    const rows = [row("B", "oct", 10, 650), row("B", "nov", 11, 550), row("A", "oct", 10, 200), row("A", "nov", 11, 1000)]
    const ranking = buildAnnualRanking(rows)
    expect(ranking.map((e) => e.playerId)).toEqual(["A", "B"])
    expect(ranking[0].tournamentsWon).toBe(1)
    expect(ranking[1].tournamentsWon).toBe(0)
  })

  it("reconoce al campeón según la escala del mes (Grand Slam = 2000)", () => {
    const ranking = buildAnnualRanking([row("A", "may", 5, 2000), row("B", "may", 5, 1000)])
    expect(ranking.find((e) => e.playerId === "A")?.tournamentsWon).toBe(1)
    // 1000 en un Grand Slam no es campeón (es entre subcampeón y semis de esa escala)
    expect(ranking.find((e) => e.playerId === "B")?.tournamentsWon).toBe(0)
  })

  it("una fila con 0 puntos no cuenta como torneo jugado", () => {
    const [entry] = buildAnnualRanking([row("A", "oct", 10, 400), row("A", "nov", 11, 0)])
    expect(entry.tournamentsPlayed).toBe(1)
  })
})
