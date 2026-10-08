import { beforeEach, describe, expect, it, vi } from "vitest"

type Row = Record<string, unknown>
const db: Record<string, Row[]> = {}

// Supabase en memoria mínimo (select / eq / or).
function table(name: string) {
  const filters: Array<(r: Row) => boolean> = []
  let single = false
  const q: Record<string, unknown> = {
    select: () => q,
    eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), q),
    or: (expr: string) => {
      const conds = expr.split(",").map((c) => c.split(".eq."))
      filters.push((r) => conds.some(([k, v]) => r[k] === v))
      return q
    },
    maybeSingle: () => ((single = true), q),
    then: (res: (v: unknown) => unknown) => {
      const hit = (db[name] ?? []).filter((r) => filters.every((f) => f(r)))
      return Promise.resolve({ data: single ? (hit[0] ?? null) : hit, error: null }).then(res)
    },
  }
  return q
}

const merge = vi.fn<(...args: unknown[]) => Promise<object>>(async () => ({}))
const recalc = vi.fn<(categoryId: string) => Promise<void>>(async () => {})
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: table }) }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: table }) }))
vi.mock("@/lib/players/mergePlayers", () => ({ mergePlayers: (...a: unknown[]) => merge(...a) }))
vi.mock("../ranking", () => ({ recalculateAndPersistCircuitRanking: (id: string) => recalc(id) }))

import { mergeParticipantIntoExistingPlayer } from "../participants"

beforeEach(() => {
  merge.mockClear()
  recalc.mockClear()
  db.players = [{ id: "typo" }, { id: "real" }, { id: "p3" }]
  db.circuito_participants = [
    { id: "x", category_id: "c1", player_id: "typo", player_2_id: null },
    { id: "y", category_id: "c1", player_id: "p3", player_2_id: null },
    { id: "z", category_id: "c0", player_id: "typo", player_2_id: null }, // mes anterior
  ]
})

describe("mergeParticipantIntoExistingPlayer", () => {
  it("unifica la ficha mal escrita con la existente y recalcula el ranking de sus categorías", async () => {
    await mergeParticipantIntoExistingPlayer("x", 0, "real")
    expect(merge).toHaveBeenCalledWith(expect.anything(), "real", "typo")
    expect(recalc.mock.calls.map((c) => c[0]).sort()).toEqual(["c0", "c1"])
  })

  it("dobles: usa el jugador del lugar indicado", async () => {
    db.circuito_participants = [{ id: "d", category_id: "c1", player_id: "p3", player_2_id: "typo" }]
    await mergeParticipantIntoExistingPlayer("d", 1, "real")
    expect(merge).toHaveBeenCalledWith(expect.anything(), "real", "typo")
  })

  it("si la jugadora existente ya está en la categoría, no hace nada", async () => {
    db.circuito_participants.push({ id: "w", category_id: "c1", player_id: "real", player_2_id: null })
    await expect(mergeParticipantIntoExistingPlayer("x", 0, "real")).rejects.toThrow(/ya está inscripta/)
    expect(merge).not.toHaveBeenCalled()
  })

  it("rechaza jugadora inexistente o la misma ficha", async () => {
    await expect(mergeParticipantIntoExistingPlayer("x", 0, "nadie")).rejects.toThrow(/No se encontró/)
    await expect(mergeParticipantIntoExistingPlayer("x", 0, "typo")).rejects.toThrow(/Ya es esa/)
    expect(merge).not.toHaveBeenCalled()
  })
})
