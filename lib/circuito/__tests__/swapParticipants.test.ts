import { describe, it, expect } from "vitest"
import { generateBracket } from "../generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "../formatSpec"
import { isPanelGeneratedBracket, type BracketSlotMatch } from "../syncBracketSlots"
import { canReorderBracket, computeSwapUpdates } from "../swapParticipants"
import { get, participants, slots, toRows } from "./bracketTestUtils"

function applySwap(rows: BracketSlotMatch[], a: string, b: string): BracketSlotMatch[] {
  const updates = computeSwapUpdates(rows, a, b)
  return rows.map((m) => {
    const u = updates.find((x) => x.matchId === m.id)
    return u ? { ...m, participantAId: u.participantAId, participantBId: u.participantBId } : m
  })
}

describe("computeSwapUpdates", () => {
  it("eliminación: intercambia dos lugares de la 1ª ronda", () => {
    const ps = participants(8)
    const rows = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")
    const before = [slots(get(rows, "main-1-0")), slots(get(rows, "main-1-1"))]
    const [a] = before[0]
    const [c] = before[1]
    const m = applySwap(rows, a!, c!)
    expect(slots(get(m, "main-1-0"))[0]).toBe(c)
    expect(slots(get(m, "main-1-1"))[0]).toBe(a)
  })

  it("zonas: pasar un participante de zona cambia todos sus partidos", () => {
    const ps = participants(6)
    const rows = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")
    const zoneA = new Set(rows.filter((m) => m.zone === "A").flatMap((m) => [m.participantAId, m.participantBId]))
    const zoneB = new Set(rows.filter((m) => m.zone === "B").flatMap((m) => [m.participantAId, m.participantBId]))
    const a = [...zoneA][0]!
    const b = [...zoneB][0]!
    const m = applySwap(rows, a, b)
    const newA = new Set(m.filter((x) => x.zone === "A").flatMap((x) => [x.participantAId, x.participantBId]))
    expect(newA.has(b)).toBe(true)
    expect(newA.has(a)).toBe(false)
    expect(m.filter((x) => x.zone === "A")).toHaveLength(3)
  })

  it("rechaza el mismo participante y los que no están en el cuadro", () => {
    const rows = toRows(generateBracket(participants(8), CIRCUITO_FORMAT_SPEC), "main")
    expect(() => computeSwapUpdates(rows, "p1", "p1")).toThrow()
    expect(() => computeSwapUpdates(rows, "p1", "nadie")).toThrow()
  })

  it("el cuadro sigue siendo del panel después de intercambiar", () => {
    for (const n of [4, 5, 6, 7, 8, 10]) {
      const ps = participants(n)
      const rows = toRows(generateBracket(ps, CIRCUITO_FORMAT_SPEC), "main")
      expect(isPanelGeneratedBracket(ps, applySwap(rows, "p1", "p3"), CIRCUITO_FORMAT_SPEC)).toBe(true)
    }
  })
})

describe("canReorderBracket", () => {
  it("solo mientras no haya resultados", () => {
    const rows = toRows(generateBracket(participants(8), CIRCUITO_FORMAT_SPEC), "main")
    expect(canReorderBracket(rows)).toBe(true)
    expect(canReorderBracket([{ ...rows[0], winnerId: "p1", score: "6-0 6-0" }, ...rows.slice(1)])).toBe(false)
  })
})
