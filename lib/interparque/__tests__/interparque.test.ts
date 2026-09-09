import { describe, it, expect } from "vitest"
import { parseInterparqueScore } from "../parseInterparqueScore"
import { calculateInterparqueMatchResult } from "../calculateInterparqueMatchResult"
import {
  calculateInterparqueStandings,
  type InterparqueMatchRow,
  type InterparquePlayer,
} from "../calculateInterparqueStandings"

describe("parseInterparqueScore", () => {
  it("parsea un partido en 2 sets rectos, sin super tie-break", () => {
    const parsed = parseInterparqueScore("6-0 6-0")
    expect(parsed).toEqual({ set1: { a: 6, b: 0 }, set2: { a: 6, b: 0 }, superTiebreak: null })
  })

  it("parsea un partido con super tie-break cuando los sets quedan 1-1", () => {
    const parsed = parseInterparqueScore("6-2 6-7 10-8")
    expect(parsed).toEqual({
      set1: { a: 6, b: 2 },
      set2: { a: 6, b: 7 },
      superTiebreak: { a: 10, b: 8 },
    })
  })

  it("rechaza un tercer set si los sets no quedaron 1-1", () => {
    expect(() => parseInterparqueScore("6-2 6-3 10-8")).toThrow()
  })

  it("rechaza sets 1-1 sin tercer set", () => {
    expect(() => parseInterparqueScore("6-2 3-6")).toThrow()
  })

  it("rechaza un super tie-break que no llega a 10 o no tiene 2 de diferencia", () => {
    expect(() => parseInterparqueScore("6-2 3-6 9-7")).toThrow()
    expect(() => parseInterparqueScore("6-2 3-6 10-9")).toThrow()
  })

  it("acepta super tie-breaks largos (11-9, 12-10)", () => {
    expect(() => parseInterparqueScore("6-2 3-6 11-9")).not.toThrow()
    expect(() => parseInterparqueScore("6-2 3-6 12-10")).not.toThrow()
  })
})

describe("calculateInterparqueMatchResult", () => {
  it("partido en 2 sets rectos: games + 3 de bonus al ganador, sin bonus de super TB", () => {
    const parsed = parseInterparqueScore("6-0 6-0")
    const result = calculateInterparqueMatchResult(parsed)
    expect(result).toEqual({
      winnerSide: "a",
      gamesA: 12,
      gamesB: 0,
      pointsA: 15, // 12 games + 3 bonus
      pointsB: 0,
    })
  })

  it("partido con super tie-break: games (sets 1-2) + 3 bonus + 1 bonus de super TB al ganador", () => {
    // Ejemplo del flyer/Sheet de Interparque: 6-2 / 6-7 / 10-8
    const parsed = parseInterparqueScore("6-2 6-7 10-8")
    const result = calculateInterparqueMatchResult(parsed)
    expect(result).toEqual({
      winnerSide: "a", // gana el super TB 10-8
      gamesA: 12, // 6 + 6 (games de sets 1 y 2, sin contar el super TB)
      gamesB: 9, // 2 + 7
      pointsA: 16, // 12 games + 3 (ganó el partido) + 1 (ganó el super TB)
      pointsB: 9, // 9 games, sin bonus
    })
  })

  it("calcula correctamente cuando gana el jugador B en sets rectos", () => {
    const parsed = parseInterparqueScore("2-6 5-7")
    const result = calculateInterparqueMatchResult(parsed)
    expect(result.winnerSide).toBe("b")
    expect(result.gamesA).toBe(7) // 2 + 5
    expect(result.gamesB).toBe(13) // 6 + 7
    expect(result.pointsB).toBe(13 + 3) // games + bonus de partido
    expect(result.pointsA).toBe(7) // solo games
  })
})

describe("calculateInterparqueStandings", () => {
  const players: InterparquePlayer[] = [
    { id: "p1", first_name: "Ana", last_name: "Perez" },
    { id: "p2", first_name: "Beto", last_name: "Gomez" },
    { id: "p3", first_name: "Caro", last_name: "Diaz" },
  ]

  it("suma puntos y partidos jugados solo de partidos completed, ordenado por puntos desc", () => {
    const matches: InterparqueMatchRow[] = [
      { status: "completed", player_a_id: "p1", player_b_id: "p2", points_a: 15, points_b: 0 },
      { status: "completed", player_a_id: "p1", player_b_id: "p3", points_a: 9, points_b: 8 },
      { status: "scheduled", player_a_id: "p2", player_b_id: "p3", points_a: 0, points_b: 0 },
    ]

    const standings = calculateInterparqueStandings(players, matches)

    expect(standings.map((r) => r.playerId)).toEqual(["p1", "p3", "p2"])
    expect(standings[0]).toMatchObject({ playerId: "p1", played: 2, points: 24 })
    expect(standings[1]).toMatchObject({ playerId: "p3", played: 1, points: 8 })
    expect(standings[2]).toMatchObject({ playerId: "p2", played: 1, points: 0 })
  })

  it("a igualdad de puntos, ordena por nombre para que el orden sea estable", () => {
    const matches: InterparqueMatchRow[] = [
      { status: "completed", player_a_id: "p1", player_b_id: "p2", points_a: 10, points_b: 10 },
    ]
    const standings = calculateInterparqueStandings(players.slice(0, 2), matches)
    expect(standings.map((r) => r.playerId)).toEqual(["p1", "p2"]) // "Ana Perez" < "Beto Gomez"
  })
})
