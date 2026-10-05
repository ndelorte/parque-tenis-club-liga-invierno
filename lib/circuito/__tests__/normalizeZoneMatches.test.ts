import { describe, it, expect } from "vitest"
import { calculateRankingPoints, type CircuitoBracketMatchResult } from "../calculateRankingPoints"

const m = (round: number, position: number, a: string, b: string, winner: string): CircuitoBracketMatchResult => ({
  bracket: "main", round, position, zone: null, participantAId: a, participantBId: b, winnerId: winner, score: "6-0 6-0",
})
const ps = (ids: string[]) => ids.map((id) => ({ id, seed: null }))

describe("puntos de formatos de zona importados de Challonge", () => {
  // Halle Open — Caballeros +50 (junio, torneo normal): las rondas son fechas de la zona y
  // la final es la revancha Marzari-Del Corral (R3#0), no la "ronda 2".
  const halle = [
    m(1, 0, "D", "C", "D"),
    m(1, 1, "M", "G", "M"),
    m(1, 2, "M", "D", "M"),
    m(2, 0, "G", "D", "D"),
    m(2, 1, "C", "M", "M"),
    m(3, 0, "M", "D", "M"), // revancha = final
    m(3, 1, "C", "G", "G"),
  ]

  it("N=4: el campeón es el ganador de la revancha, no el de la 'ronda 2'", () => {
    const points = calculateRankingPoints({ format: "round_robin_with_final", participants: ps(["D", "C", "M", "G"]), matches: halle, isGrandSlam: false })
    expect(points.get("M")).toBe(1000) // campeón
    expect(points.get("D")).toBe(650) // subcampeón
    expect(points.get("G")).toBe(50) // los dos que no llegan a la final → 16vos o más
    expect(points.get("C")).toBe(50)
  })

  it("no depende del orden en que vengan los partidos", () => {
    const shuffled = [...halle].reverse()
    const points = calculateRankingPoints({ format: "round_robin_with_final", participants: ps(["D", "C", "M", "G"]), matches: shuffled, isGrandSlam: false })
    expect(points.get("M")).toBe(1000)
    expect(points.get("D")).toBe(650)
  })

  it("Monte Carlo Mixto (abril): gana la final Cisneros, no la pareja de la 'ronda 2'", () => {
    const monteCarlo = [
      m(1, 0, "MT", "CI", "MT"),
      m(1, 1, "BR", "ML", "ML"),
      m(1, 2, "MT", "CI", "CI"), // revancha = final: gana Cisneros
      m(2, 0, "ML", "MT", "MT"),
      m(2, 1, "CI", "BR", "CI"),
    ]
    // (4 inscriptos, no hay más partidos cargados que estos)
    const points = calculateRankingPoints({ format: "round_robin_with_final", participants: ps(["MT", "CI", "BR", "ML"]), matches: monteCarlo, isGrandSlam: false })
    expect(points.get("CI")).toBe(1000)
    expect(points.get("MT")).toBe(650)
  })

  it("un cuadro numerado como el motor propio no se toca", () => {
    const zone = [
      m(1, 0, "1", "2", "1"), m(1, 1, "1", "3", "1"), m(1, 2, "1", "4", "1"),
      m(1, 3, "2", "3", "2"), m(1, 4, "2", "4", "2"), m(1, 5, "3", "4", "4"),
      m(2, 0, "1", "2", "2"),
    ]
    const points = calculateRankingPoints({ format: "round_robin_with_final", participants: ps(["1", "2", "3", "4"]), matches: zone, isGrandSlam: true })
    expect(points.get("2")).toBe(2000)
    expect(points.get("1")).toBe(1300)
    expect(points.get("3")).toBe(100)
    expect(points.get("4")).toBe(100)
  })

  it("N=5: con las fechas numeradas por Challonge igual se arma una sola zona", () => {
    const ids = ["a", "b", "c", "d", "e"]
    const matches: CircuitoBracketMatchResult[] = []
    let pos = 0
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) matches.push(m((pos % 5) + 1, pos++, ids[i], ids[j], ids[i]))
    const points = calculateRankingPoints({ format: "round_robin_pure", participants: ps(ids), matches, isGrandSlam: false })
    expect(points.get("a")).toBe(1000) // gana todo
    expect(points.get("b")).toBe(650)
    expect(points.get("c")).toBe(50)
  })

  it("N=4: si los finalistas no son los 2 primeros de la tabla, los otros dos igual suman 16vos (Roland Garros +50)", () => {
    // Zona de 6 partidos (M-R aparece 2 veces: la 2ª es la final, ganó Rende).
    const rg = [
      m(1, 0, "M", "R", "R"),
      m(1, 1, "T", "C", "T"),
      m(1, 2, "M", "R", "R"), // revancha = final
      m(2, 0, "C", "M", "M"),
      m(2, 1, "R", "T", "T"),
      m(3, 0, "T", "M", "M"),
      m(3, 1, "R", "C", "R"),
    ]
    const points = calculateRankingPoints({ format: "round_robin_with_final", participants: ps(["M", "R", "T", "C"]), matches: rg, isGrandSlam: true })
    expect(points.get("R")).toBe(2000)
    expect(points.get("M")).toBe(1300)
    expect(points.get("T")).toBe(100) // antes quedaba en 0
    expect(points.get("C")).toBe(100)
  })
})
