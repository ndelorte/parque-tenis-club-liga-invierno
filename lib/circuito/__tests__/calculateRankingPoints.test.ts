import { describe, it, expect } from "vitest"
import { calculateRankingPoints, type CircuitoBracketMatchResult } from "../calculateRankingPoints"
import type { CircuitoParticipant } from "../types"

const p = (id: string): CircuitoParticipant => ({ id, seed: null })

function match(
  partial: Partial<CircuitoBracketMatchResult> & { round: number },
): CircuitoBracketMatchResult {
  return {
    bracket: "main",
    zone: null,
    participantAId: null,
    participantBId: null,
    winnerId: null,
    score: null,
    ...partial,
  }
}

describe("calculateRankingPoints — round_robin_pure (N=5)", () => {
  const participants = [p("1"), p("2"), p("3"), p("4"), p("5")]

  it("sin zona completa, nadie tiene puntos todavía", () => {
    const matches = [match({ round: 1, participantAId: "1", participantBId: "2", winnerId: "1", score: "6-0 6-0" })]
    const points = calculateRankingPoints({ format: "round_robin_pure", participants, matches, isGrandSlam: false })
    expect([...points.values()].every((v) => v === 0)).toBe(true)
  })

  it("campeón = 1° de la zona, subcampeón = 2°, resto = round_of_32_plus", () => {
    // "1" gana todo, "2" pierde solo contra "1"
    const pairs = [
      ["1", "2"], ["1", "3"], ["1", "4"], ["1", "5"],
      ["2", "3"], ["2", "4"], ["2", "5"],
      ["3", "4"], ["3", "5"],
      ["4", "5"],
    ]
    const matches = pairs.map(([a, b]) =>
      match({ round: 1, participantAId: a, participantBId: b, winnerId: a, score: "6-0 6-0" }),
    )
    const points = calculateRankingPoints({ format: "round_robin_pure", participants, matches, isGrandSlam: false })
    expect(points.get("1")).toBe(1000) // campeón normal
    expect(points.get("2")).toBe(650) // subcampeón normal
    expect(points.get("3")).toBe(50) // round_of_32_plus normal
    expect(points.get("4")).toBe(50)
    expect(points.get("5")).toBe(50)
  })
})

describe("calculateRankingPoints — round_robin_with_final (N=4)", () => {
  const participants = [p("1"), p("2"), p("3"), p("4")]
  // "1" gana sus 3 partidos, "2" le gana a "3" y "4" (pierde solo con "1"),
  // "4" le gana a "3" → standings: 1° "1" (3), 2° "2" (2), 3° "4" (1), 4° "3" (0)
  const zoneWinners: Record<string, string> = {
    "1-2": "1", "1-3": "1", "1-4": "1",
    "2-3": "2", "2-4": "2",
    "3-4": "4",
  }
  const zoneMatches = Object.entries(zoneWinners).map(([pair, winnerId]) => {
    const [a, b] = pair.split("-")
    return match({ round: 1, participantAId: a, participantBId: b, winnerId, score: "6-0 6-0" })
  })

  it("sin la final jugada, los no-finalistas ya tienen su instancia pero los finalistas no", () => {
    const points = calculateRankingPoints({
      format: "round_robin_with_final",
      participants,
      matches: zoneMatches,
      isGrandSlam: false,
    })
    expect(points.get("3")).toBe(50)
    expect(points.get("4")).toBe(50)
    expect(points.get("1")).toBe(0)
    expect(points.get("2")).toBe(0)
  })

  it("la final define campeón/subcampeón (Grand Slam)", () => {
    const matches = [
      ...zoneMatches,
      match({ round: 2, participantAId: "1", participantBId: "2", winnerId: "2", score: "6-4 6-4" }),
    ]
    const points = calculateRankingPoints({ format: "round_robin_with_final", participants, matches, isGrandSlam: true })
    expect(points.get("2")).toBe(2000) // ganó la final → campeón
    expect(points.get("1")).toBe(1300) // subcampeón
    expect(points.get("3")).toBe(100)
    expect(points.get("4")).toBe(100)
  })
})

describe("calculateRankingPoints — groups_then_knockout (N=6-7)", () => {
  it("asigna semifinalista, campeón y subcampeón según los cruces reales", () => {
    const participants = ["a1", "a2", "a3", "b1", "b2", "b3"].map(p)
    const zoneAMatches = [
      match({ round: 1, zone: "A", participantAId: "a1", participantBId: "a2", winnerId: "a1", score: "6-0 6-0" }),
      match({ round: 1, zone: "A", participantAId: "a1", participantBId: "a3", winnerId: "a1", score: "6-0 6-0" }),
      match({ round: 1, zone: "A", participantAId: "a2", participantBId: "a3", winnerId: "a2", score: "6-0 6-0" }),
    ]
    const zoneBMatches = [
      match({ round: 1, zone: "B", participantAId: "b1", participantBId: "b2", winnerId: "b1", score: "6-0 6-0" }),
      match({ round: 1, zone: "B", participantAId: "b1", participantBId: "b3", winnerId: "b1", score: "6-0 6-0" }),
      match({ round: 1, zone: "B", participantAId: "b2", participantBId: "b3", winnerId: "b2", score: "6-0 6-0" }),
    ]
    const semis = [
      match({ round: 2, participantAId: "a1", participantBId: "b2", winnerId: "a1", score: "6-0 6-0" }),
      match({ round: 2, participantAId: "b1", participantBId: "a2", winnerId: "b1", score: "6-0 6-0" }),
    ]
    const final = match({ round: 3, participantAId: "a1", participantBId: "b1", winnerId: "b1", score: "6-0 6-0" })

    const points = calculateRankingPoints({
      format: "groups_then_knockout",
      participants,
      matches: [...zoneAMatches, ...zoneBMatches, ...semis, final],
      isGrandSlam: false,
    })

    expect(points.get("b1")).toBe(1000) // campeón
    expect(points.get("a1")).toBe(650) // subcampeón (perdió la final)
    expect(points.get("b2")).toBe(400) // perdió semifinal
    expect(points.get("a2")).toBe(400) // perdió semifinal
    expect(points.get("a3")).toBe(50) // no clasificó de zona
    expect(points.get("b3")).toBe(50)
  })
})

describe("calculateRankingPoints — single_elimination (N=8+)", () => {
  it("asigna instancia según la ronda en la que se pierde, ignorando byes", () => {
    const participants = ["1", "2", "3", "4", "5", "6", "7", "8"].map(p)
    const matches = [
      match({ round: 1, participantAId: "1", participantBId: "8", winnerId: "1", score: "6-0 6-0" }),
      match({ round: 1, participantAId: "2", participantBId: "7", winnerId: "2", score: "6-0 6-0" }),
      match({ round: 1, participantAId: "3", participantBId: "6", winnerId: "3", score: "6-0 6-0" }),
      match({ round: 1, participantAId: "4", participantBId: "5", winnerId: "4", score: "6-0 6-0" }),
      match({ round: 2, participantAId: "1", participantBId: "2", winnerId: "1", score: "6-0 6-0" }),
      match({ round: 2, participantAId: "3", participantBId: "4", winnerId: "3", score: "6-0 6-0" }),
      match({ round: 3, participantAId: "1", participantBId: "3", winnerId: "3", score: "6-0 6-0" }),
    ]
    const points = calculateRankingPoints({ format: "single_elimination", participants, matches, isGrandSlam: false })

    // Con 8 inscriptos el cuadro tiene 3 rondas: ronda 1 = cuartos, ronda 2 =
    // semifinal, ronda 3 = final (la instancia depende del tamaño del cuadro,
    // no del número de ronda en sí).
    expect(points.get("3")).toBe(1000) // campeón
    expect(points.get("1")).toBe(650) // subcampeón
    expect(points.get("2")).toBe(400) // semifinalista
    expect(points.get("4")).toBe(400) // semifinalista
    expect(points.get("5")).toBe(200) // perdió cuartos (ronda 1 de un cuadro de 8)
    expect(points.get("6")).toBe(200)
    expect(points.get("7")).toBe(200)
    expect(points.get("8")).toBe(200)
  })

  it("un bye (sin ganador real) no cuenta como eliminación de nadie", () => {
    const participants = ["1", "2", "3"].map(p)
    const matches = [
      match({ round: 1, participantAId: "1", participantBId: null, winnerId: null, score: null }), // bye
      match({ round: 1, participantAId: "2", participantBId: "3", winnerId: "2", score: "6-0 6-0" }),
      match({ round: 2, participantAId: "1", participantBId: "2", winnerId: "1", score: "6-0 6-0" }),
    ]
    const points = calculateRankingPoints({ format: "single_elimination", participants, matches, isGrandSlam: false })
    // Cuadro de 3 → potencia de 2 más cercana es 4 → 2 rondas: ronda 1 = semifinal, ronda 2 = final.
    expect(points.get("1")).toBe(1000) // campeón (venía de bye)
    expect(points.get("2")).toBe(650) // subcampeón
    expect(points.get("3")).toBe(400) // perdió semifinal (ronda 1 de un cuadro de 4)
  })

  it("el repechaje nunca otorga puntos aunque tenga resultados", () => {
    const participants = [p("1"), p("2")]
    const matches = [
      match({ round: 1, participantAId: "1", participantBId: "2", winnerId: "1", score: "6-0 6-0" }),
      match({ bracket: "repechaje", round: 1, participantAId: "2", participantBId: null, winnerId: "2", score: null }),
    ]
    const points = calculateRankingPoints({ format: "single_elimination", participants, matches, isGrandSlam: false })
    // con solo 2 participantes, round 1 YA es la final del cuadro principal
    expect(points.get("1")).toBe(1000)
    expect(points.get("2")).toBe(650) // por perder la final del main, no por el repechaje
  })
})
