import { beforeEach, describe, expect, it, vi } from "vitest"

type Row = Record<string, unknown>
const db: Record<string, Row[]> = {}
let nextId = 1

// Supabase en memoria: solo lo que usan participants.ts y bracket.ts.
function table(name: string) {
  const filters: Array<(r: Row) => boolean> = []
  let op: "select" | "delete" | "update" | "insert" = "select"
  let patch: Row | Row[] = {}
  let head = false
  let single = false
  const rows = () => (db[name] ??= [])
  const matching = () => rows().filter((r) => filters.every((f) => f(r)))
  const run = () => {
    if (op === "insert") {
      const items = (Array.isArray(patch) ? patch : [patch]).map((p) => ({ id: `id${nextId++}`, winner_id: null, score: null, ...p }))
      rows().push(...items)
      return { data: single ? items[0] : items, error: null, count: null }
    }
    const hit = matching()
    if (op === "delete") db[name] = rows().filter((r) => !hit.includes(r))
    if (op === "update") hit.forEach((r) => Object.assign(r, patch))
    if (head) return { data: null, error: null, count: hit.length }
    return { data: single ? (hit[0] ?? null) : hit, error: null, count: hit.length }
  }
  const q: Record<string, unknown> = {
    select: (_c?: string, o?: { head?: boolean }) => ((head = !!o?.head), q),
    insert: (p: Row | Row[]) => ((op = "insert"), (patch = p), q),
    update: (p: Row) => ((op = "update"), (patch = p), q),
    delete: () => ((op = "delete"), q),
    eq: (k: string, v: unknown) => (filters.push((r) => r[k] === v), q),
    in: (k: string, v: unknown[]) => (filters.push((r) => v.includes(r[k])), q),
    limit: () => q,
    single: () => ((single = true), q),
    maybeSingle: () => ((single = true), q),
    then: (res: (v: unknown) => unknown) => Promise.resolve(run()).then(res),
  }
  return q
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from: table }) }))
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ from: table }) }))
vi.mock("../ranking", () => ({ getAnnualCircuitRanking: async () => ({ entries: [] }) }))

import { addCircuitoParticipant, removeCircuitoParticipant } from "../participants"
import { generateAndPersistCircuitoBracket } from "../bracket"

const CAT = "cat1"

function seed(n: number) {
  db.circuito_categories = [{ id: CAT, slug: "x", draw_size: null, circuito_editions: { year: 2026, month: 5 } }]
  db.players = Array.from({ length: 20 }, (_, i) => ({ id: `pl${i}`, display_name: `Jugador ${i}` }))
  db.circuito_participants = Array.from({ length: n }, (_, i) => ({
    id: `pa${i}`, category_id: CAT, player_id: `pl${i}`, player_2_id: null, seed: null, display_name: `Jugador ${i}`,
  }))
  db.circuito_matches = []
}

const matches = () => db.circuito_matches.filter((m) => m.category_id === CAT)
const inRound1 = () =>
  new Set(matches().filter((m) => m.bracket === "main" && m.round_number === 1).flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter(Boolean))

beforeEach(() => { nextId = 1 })

describe("cambiar inscriptos con el cuadro armado", () => {
  it("agregar rehace el cuadro e incluye al nuevo", async () => {
    seed(8)
    await generateAndPersistCircuitoBracket(CAT)
    expect(db.circuito_categories[0].draw_size).toBe(8)

    const added = await addCircuitoParticipant({ categoryId: CAT, playerId: "pl10" })
    expect(db.circuito_categories[0].draw_size).toBe(9)
    expect(inRound1().has(added.id)).toBe(true)
    expect(inRound1().size).toBe(9)
  })

  it("quitar rehace el cuadro sin el participante (sin referencias colgadas)", async () => {
    seed(8)
    await generateAndPersistCircuitoBracket(CAT)
    await removeCircuitoParticipant("pa3")
    expect(db.circuito_participants).toHaveLength(7)
    expect(db.circuito_categories[0].draw_size).toBe(7)
    expect(inRound1().has("pa3")).toBe(false)
    expect(inRound1().size).toBe(7)
  })

  it("con menos de 4 queda sin cuadro", async () => {
    seed(4)
    await generateAndPersistCircuitoBracket(CAT)
    await removeCircuitoParticipant("pa0")
    expect(matches()).toHaveLength(0)
    expect(db.circuito_categories[0].draw_size).toBeNull()
  })

  it("con resultados cargados no toca nada", async () => {
    seed(8)
    await generateAndPersistCircuitoBracket(CAT)
    const m = matches().find((x) => x.bracket === "main" && x.round_number === 1 && x.participant_a_id && x.participant_b_id)!
    m.winner_id = m.participant_a_id
    m.score = "6-0 6-0"
    const before = matches().length

    await expect(removeCircuitoParticipant("pa1")).rejects.toThrow(/resultados/)
    await expect(addCircuitoParticipant({ categoryId: CAT, playerId: "pl10" })).rejects.toThrow(/resultados/)
    expect(db.circuito_participants).toHaveLength(8)
    expect(matches()).toHaveLength(before)
  })

  it("sin cuadro sigue funcionando como antes", async () => {
    seed(3)
    await addCircuitoParticipant({ categoryId: CAT, playerId: "pl10" })
    expect(db.circuito_participants).toHaveLength(4)
    expect(matches()).toHaveLength(0)
    await removeCircuitoParticipant("pa0")
    expect(db.circuito_participants).toHaveLength(3)
  })
})
