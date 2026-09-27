import { describe, it, expect } from "vitest"
import { calculateZoneStandings, type ZoneMatchResult } from "../calculateZoneStandings"
import type { CircuitoParticipant } from "../types"

const p = (id: string, seed: number | null = null): CircuitoParticipant => ({ id, seed })

describe("calculateZoneStandings", () => {
  it("ordena por partidos ganados", () => {
    const participants = [p("A"), p("B"), p("C")]
    const matches: ZoneMatchResult[] = [
      { participantAId: "A", participantBId: "B", winnerId: "A", score: "6-2 6-2" },
      { participantAId: "A", participantBId: "C", winnerId: "A", score: "6-2 6-2" },
      { participantAId: "B", participantBId: "C", winnerId: "B", score: "6-2 6-2" },
    ]
    const standings = calculateZoneStandings(participants, matches)
    expect(standings.map((s) => s.id)).toEqual(["A", "B", "C"])
  })

  it("desempata por diferencia de games cuando hay igual cantidad de victorias", () => {
    // A y B ganan 1 partido cada uno (perdieron entre sí no juegan, en zona de 3
    // solo 2 partidos jugados para simplificar el empate en victorias frente a C)
    const participants = [p("A"), p("B"), p("C")]
    const matches: ZoneMatchResult[] = [
      { participantAId: "A", participantBId: "C", winnerId: "A", score: "6-0 6-0" }, // A +12/-0
      { participantAId: "B", participantBId: "C", winnerId: "B", score: "6-4 6-4" }, // B +12/-8
    ]
    const standings = calculateZoneStandings(participants, matches)
    // A y B con 1 victoria cada uno; A tiene mejor diferencia de games → 1°
    expect(standings[0].id).toBe("A")
    expect(standings[1].id).toBe("B")
    expect(standings[2].id).toBe("C")
  })

  it("desempata por seed si todo lo demás es igual", () => {
    const participants = [p("A", 3), p("B", 1)]
    const matches: ZoneMatchResult[] = []
    const standings = calculateZoneStandings(participants, matches)
    expect(standings.map((s) => s.id)).toEqual(["B", "A"]) // seed 1 < seed 3
  })

  // Orden de criterios de OQ-37: ganados → dif. de sets → dif. de games → partido entre ellos.
  it("la diferencia de sets pesa antes que la diferencia de games", () => {
    // A y B ganan 1 cada uno. A: sets +1, games +1. B: sets 0, games +10.
    const participants = [p("A"), p("B"), p("C"), p("D")]
    const matches: ZoneMatchResult[] = [
      { participantAId: "A", participantBId: "C", winnerId: "A", score: "7-6 7-6" },
      { participantAId: "A", participantBId: "D", winnerId: "D", score: "0-6 6-0 6-7" },
      { participantAId: "B", participantBId: "C", winnerId: "B", score: "6-0 6-0" },
      { participantAId: "B", participantBId: "D", winnerId: "D", score: "6-7 6-7" },
    ]
    expect(calculateZoneStandings(participants, matches).map((s) => s.id)).toEqual(["D", "A", "B", "C"])
  })

  it("con victorias, sets y games iguales, decide el partido entre ellos (antes que el seed)", () => {
    // A y B: 1 ganado, sets 0, games 0. A le ganó a B, aunque B tiene mejor seed.
    const participants = [p("A", 2), p("B", 1), p("C", 3), p("D", 4)]
    const matches: ZoneMatchResult[] = [
      { participantAId: "A", participantBId: "B", winnerId: "A", score: "6-4 6-4" },
      { participantAId: "A", participantBId: "C", winnerId: "C", score: "4-6 4-6" },
      { participantAId: "B", participantBId: "D", winnerId: "B", score: "6-4 6-4" },
    ]
    expect(calculateZoneStandings(participants, matches).map((s) => s.id)).toEqual(["C", "A", "B", "D"])
  })

  it("un triple empate circular (cada uno le ganó a otro) queda por seed", () => {
    const participants = [p("A", 3), p("B", 1), p("C", 2)]
    const matches: ZoneMatchResult[] = [
      { participantAId: "A", participantBId: "B", winnerId: "A", score: "6-4 6-4" },
      { participantAId: "B", participantBId: "C", winnerId: "B", score: "6-4 6-4" },
      { participantAId: "C", participantBId: "A", winnerId: "C", score: "6-4 6-4" },
    ]
    expect(calculateZoneStandings(participants, matches).map((s) => s.id)).toEqual(["B", "C", "A"])
  })

  it("rechaza un partido con un participante que no está en la lista", () => {
    const participants = [p("A"), p("B")]
    const matches: ZoneMatchResult[] = [
      { participantAId: "A", participantBId: "X", winnerId: "A", score: "6-0 6-0" },
    ]
    expect(() => calculateZoneStandings(participants, matches)).toThrow()
  })
})
