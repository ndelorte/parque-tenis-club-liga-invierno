import { describe, it, expect } from "vitest"
import { calculateRankingPoints, type CircuitoBracketMatchResult } from "../calculateRankingPoints"
import { isLivePointsEdition, LIVE_POINTS_EDITION_SLUGS } from "../livePoints"
import type { CircuitoParticipant } from "../types"

const p = (id: string): CircuitoParticipant => ({ id, seed: null })
const m = (partial: Partial<CircuitoBracketMatchResult> & { round: number }): CircuitoBracketMatchResult => ({
  bracket: "main",
  zone: null,
  participantAId: null,
  participantBId: null,
  winnerId: null,
  score: null,
  ...partial,
})

describe("isLivePointsEdition", () => {
  it("solo China Open y Paris Open 2026 (circuito-2026-10 y circuito-2026-11)", () => {
    expect(LIVE_POINTS_EDITION_SLUGS).toEqual(["circuito-2026-10", "circuito-2026-11"])
    expect(isLivePointsEdition("circuito-2026-10")).toBe(true)
    expect(isLivePointsEdition("circuito-2026-11")).toBe(true)
    expect(isLivePointsEdition("circuito-2026-09")).toBe(false)
    expect(isLivePointsEdition("circuito-2026-12")).toBe(false)
    expect(isLivePointsEdition(null)).toBe(false)
    expect(isLivePointsEdition(undefined)).toBe(false)
    expect(isLivePointsEdition("")).toBe(false)
  })
})

describe("calculateRankingPoints — live, single_elimination (8 jugadores)", () => {
  const participants = ["1", "2", "3", "4", "5", "6", "7", "8"].map(p)
  // Cuartos jugados; semis armadas (1 vs 3, 5 vs 7) sin jugar.
  const matches = [
    m({ round: 1, position: 0, participantAId: "1", participantBId: "2", winnerId: "1", score: "6-0 6-0" }),
    m({ round: 1, position: 1, participantAId: "3", participantBId: "4", winnerId: "3", score: "6-0 6-0" }),
    m({ round: 1, position: 2, participantAId: "5", participantBId: "6", winnerId: "5", score: "6-0 6-0" }),
    m({ round: 1, position: 3, participantAId: "7", participantBId: "8" }),
    m({ round: 2, position: 0, participantAId: "1", participantBId: "3" }),
    m({ round: 2, position: 1, participantAId: "5", participantBId: null }),
    m({ round: 3, position: 0 }),
  ]

  it("sin live: solo suman los que perdieron", () => {
    const pts = calculateRankingPoints({ format: "single_elimination", participants, matches, isGrandSlam: false })
    expect(pts.get("2")).toBe(200)
    expect(pts.get("1")).toBe(0)
    expect(pts.get("7")).toBe(0)
  })

  it("con live: el que ganó cuartos ya suma semifinal; sin jugar no suma", () => {
    const pts = calculateRankingPoints({ format: "single_elimination", participants, matches, isGrandSlam: false, live: true })
    expect(pts.get("1")).toBe(400)
    expect(pts.get("3")).toBe(400)
    expect(pts.get("5")).toBe(400)
    expect(pts.get("2")).toBe(200)
    expect(pts.get("7")).toBe(0)
    expect(pts.get("8")).toBe(0)
  })

  it("con live: los finalistas suman subcampeón y el campeón, campeón", () => {
    const full = [
      ...matches.slice(0, 3),
      m({ round: 1, position: 3, participantAId: "7", participantBId: "8", winnerId: "7", score: "6-0 6-0" }),
      m({ round: 2, position: 0, participantAId: "1", participantBId: "3", winnerId: "1", score: "6-0 6-0" }),
      m({ round: 2, position: 1, participantAId: "5", participantBId: "7", winnerId: "5", score: "6-0 6-0" }),
      m({ round: 3, position: 0, participantAId: "1", participantBId: "5" }),
    ]
    let pts = calculateRankingPoints({ format: "single_elimination", participants, matches: full, isGrandSlam: false, live: true })
    expect(pts.get("1")).toBe(650)
    expect(pts.get("5")).toBe(650)
    expect(pts.get("3")).toBe(400)

    full[full.length - 1] = m({ round: 3, position: 0, participantAId: "1", participantBId: "5", winnerId: "1", score: "6-0 6-0" })
    pts = calculateRankingPoints({ format: "single_elimination", participants, matches: full, isGrandSlam: false, live: true })
    expect(pts.get("1")).toBe(1000)
    expect(pts.get("5")).toBe(650)
  })
})

describe("calculateRankingPoints — live, zonas", () => {
  it("groups_then_knockout: jugar en zona asegura 16vos; estar en semis, semifinal", () => {
    const participants = ["a1", "a2", "a3", "b1", "b2", "b3"].map(p)
    const matches = [
      m({ round: 1, zone: "A", participantAId: "a1", participantBId: "a2", winnerId: "a1", score: "6-0 6-0" }),
      m({ round: 1, zone: "A", participantAId: "a1", participantBId: "a3" }),
      m({ round: 1, zone: "A", participantAId: "a2", participantBId: "a3" }),
      m({ round: 2, participantAId: "b1", participantBId: null }),
    ]
    const pts = calculateRankingPoints({ format: "groups_then_knockout", participants, matches, isGrandSlam: true, live: true })
    expect(pts.get("a1")).toBe(100)
    expect(pts.get("a2")).toBe(100)
    expect(pts.get("a3")).toBe(0)
    expect(pts.get("b1")).toBe(800)
  })
})

describe("calculateRankingPoints — torneo completo: live === sin live", () => {
  it("single_elimination (8 jugadores, todo jugado)", () => {
    const participants = ["1", "2", "3", "4", "5", "6", "7", "8"].map(p)
    const win = (round: number, position: number, a: string, b: string, w: string) =>
      m({ round, position, participantAId: a, participantBId: b, winnerId: w, score: "6-0 6-0" })
    const matches = [
      win(1, 0, "1", "2", "1"),
      win(1, 1, "3", "4", "3"),
      win(1, 2, "5", "6", "5"),
      win(1, 3, "7", "8", "7"),
      win(2, 0, "1", "3", "1"),
      win(2, 1, "5", "7", "5"),
      win(3, 0, "1", "5", "1"),
    ]
    for (const isGrandSlam of [false, true]) {
      const normal = calculateRankingPoints({ format: "single_elimination", participants, matches, isGrandSlam })
      const live = calculateRankingPoints({ format: "single_elimination", participants, matches, isGrandSlam, live: true })
      for (const part of participants) expect(live.get(part.id)).toBe(normal.get(part.id))
    }
  })

  it("groups_then_knockout (2 zonas de 3, semis y final jugadas)", () => {
    const participants = ["a1", "a2", "a3", "b1", "b2", "b3"].map(p)
    const z = (zone: "A" | "B", a: string, b: string, w: string) =>
      m({ round: 1, zone, participantAId: a, participantBId: b, winnerId: w, score: "6-0 6-0" })
    const matches = [
      z("A", "a1", "a2", "a1"),
      z("A", "a1", "a3", "a1"),
      z("A", "a2", "a3", "a2"),
      z("B", "b1", "b2", "b1"),
      z("B", "b1", "b3", "b1"),
      z("B", "b2", "b3", "b2"),
      m({ round: 2, position: 0, participantAId: "a1", participantBId: "b2", winnerId: "a1", score: "6-0 6-0" }),
      m({ round: 2, position: 1, participantAId: "b1", participantBId: "a2", winnerId: "b1", score: "6-0 6-0" }),
      m({ round: 3, position: 0, participantAId: "a1", participantBId: "b1", winnerId: "a1", score: "6-0 6-0" }),
    ]
    for (const isGrandSlam of [false, true]) {
      const normal = calculateRankingPoints({ format: "groups_then_knockout", participants, matches, isGrandSlam })
      const live = calculateRankingPoints({ format: "groups_then_knockout", participants, matches, isGrandSlam, live: true })
      for (const part of participants) expect(live.get(part.id)).toBe(normal.get(part.id))
    }
  })
})
