import { describe, expect, it } from "vitest"
import { drawFinalMaster, isDrawComplete, isPlayedMatch, orderByRanking, roundRobinPairs, serpentineZone } from "../draw"

const entry = (id: string, loadOrder: number, rankingPoints = 0, rankingPosition: number | null = null) => ({
  id,
  loadOrder,
  rankingPoints,
  rankingPosition,
})

describe("orderByRanking", () => {
  it("ordena por puntos y deja al final los sin ranking en orden de carga", () => {
    const ordered = orderByRanking([
      entry("sin-1", 1),
      entry("p100", 2, 100, 3),
      entry("sin-2", 3),
      entry("p300", 4, 300, 1),
      entry("p200", 5, 200, 2),
    ])
    expect(ordered.map((e) => e.id)).toEqual(["p300", "p200", "p100", "sin-1", "sin-2"])
  })

  it("a igual puntaje respeta el puesto del ranking anual", () => {
    const ordered = orderByRanking([entry("b", 1, 100, 5), entry("a", 2, 100, 4)])
    expect(ordered.map((e) => e.id)).toEqual(["a", "b"])
  })

  it("si nadie tiene ranking, queda el orden de carga", () => {
    const ordered = orderByRanking([entry("c", 3), entry("a", 1), entry("b", 2)])
    expect(ordered.map((e) => e.id)).toEqual(["a", "b", "c"])
  })
})

describe("serpentineZone", () => {
  it("A = 1, 4, 5, 8 · B = 2, 3, 6, 7", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(serpentineZone)).toEqual(["A", "B", "B", "A", "A", "B", "B", "A"])
  })
})

describe("roundRobinPairs", () => {
  const key = ([a, b]: [string, string]) => [a, b].sort().join("-")

  it.each([3, 4])("con %i juegan todos contra todos una vez", (n) => {
    const ids = Array.from({ length: n }, (_, i) => `p${i}`)
    const pairs = roundRobinPairs(ids)
    expect(pairs).toHaveLength((n * (n - 1)) / 2)
    expect(new Set(pairs.map(key)).size).toBe(pairs.length)
  })
})

describe("drawFinalMaster", () => {
  it("con 8 arma dos zonas de 4", () => {
    const entries = Array.from({ length: 8 }, (_, i) => entry(`p${i + 1}`, i + 1, 800 - i * 100, i + 1))
    const draw = drawFinalMaster(entries)
    expect(draw.filter((d) => d.zone === "A").map((d) => d.id)).toEqual(["p1", "p4", "p5", "p8"])
    expect(draw.filter((d) => d.zone === "B").map((d) => d.id)).toEqual(["p2", "p3", "p6", "p7"])
  })

  it("con 7 arma zonas de 3 y 4; con 6, de 3 y 3", () => {
    const make = (n: number) => Array.from({ length: n }, (_, i) => entry(`p${i + 1}`, i + 1))
    const seven = drawFinalMaster(make(7))
    expect(seven.filter((d) => d.zone === "A")).toHaveLength(3)
    expect(seven.filter((d) => d.zone === "B")).toHaveLength(4)
    const six = drawFinalMaster(make(6))
    expect(six.filter((d) => d.zone === "A")).toHaveLength(3)
    expect(six.filter((d) => d.zone === "B")).toHaveLength(3)
  })

  it("rechaza menos de 6 o más de 8", () => {
    const make = (n: number) => Array.from({ length: n }, (_, i) => entry(`p${i + 1}`, i + 1))
    expect(() => drawFinalMaster(make(5))).toThrow()
    expect(() => drawFinalMaster(make(9))).toThrow()
  })
})

describe("isPlayedMatch", () => {
  it("cuenta status, ganador o score", () => {
    expect(isPlayedMatch({ status: "played" })).toBe(true)
    expect(isPlayedMatch({ status: "walkover" })).toBe(true)
    expect(isPlayedMatch({ status: "scheduled", winner_participant_id: "x" })).toBe(true)
    expect(isPlayedMatch({ status: "scheduled", score: "6-4 6-4" })).toBe(true)
    expect(isPlayedMatch({ status: "scheduled", winner_participant_id: null, score: null })).toBe(false)
  })
})

describe("isDrawComplete", () => {
  const base = { participantZones: ["A", "A", "A", "A", "B", "B", "B"], zoneMatchCounts: { A: 6, B: 3 }, semifinals: 2, finals: 1 }
  it("completo con 4 y 3", () => expect(isDrawComplete(base)).toBe(true))
  it("incompleto si falta un partido de zona", () => expect(isDrawComplete({ ...base, zoneMatchCounts: { A: 5, B: 3 } })).toBe(false))
  it("incompleto sin final o con inscripto sin zona", () => {
    expect(isDrawComplete({ ...base, finals: 0 })).toBe(false)
    expect(isDrawComplete({ ...base, participantZones: [...base.participantZones, null] })).toBe(false)
  })
})
