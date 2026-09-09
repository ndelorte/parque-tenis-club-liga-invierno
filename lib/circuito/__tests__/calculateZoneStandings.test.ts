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

  it("rechaza un partido con un participante que no está en la lista", () => {
    const participants = [p("A"), p("B")]
    const matches: ZoneMatchResult[] = [
      { participantAId: "A", participantBId: "X", winnerId: "A", score: "6-0 6-0" },
    ]
    expect(() => calculateZoneStandings(participants, matches)).toThrow()
  })
})
