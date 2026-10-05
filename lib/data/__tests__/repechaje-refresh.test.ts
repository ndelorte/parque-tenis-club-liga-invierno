/* eslint-disable @typescript-eslint/no-explicit-any -- base de datos simulada mínima, solo para este test */
import { describe, it, expect, vi } from "vitest"

type Row = Record<string, any>
const state = vi.hoisted(() => ({ tables: {} as Record<string, Row[]> }))

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    let id = 0
    const builder = (table: string) => {
      let op: "select" | "update" | "delete" | "insert" = "select"
      let payload: any
      let single = false
      const filters: Array<(r: Row) => boolean> = []
      const run = () => {
        const rows = state.tables[table]
        if (op === "insert") {
          for (const r of payload) rows.push({ id: `${table}-${++id}`, score: null, winner_id: null, is_walkover: false, scheduled_date: null, ...r })
          return { data: null, error: null }
        }
        const matched = rows.filter((r) => filters.every((f) => f(r)))
        if (op === "update") matched.forEach((r) => Object.assign(r, payload))
        if (op === "delete") state.tables[table] = rows.filter((r) => !matched.includes(r))
        return { data: single ? (matched[0] ?? null) : matched, error: null }
      }
      const api: any = {
        select: () => api,
        insert: (p: Row[]) => ((op = "insert"), (payload = p), api),
        update: (p: Row) => ((op = "update"), (payload = p), api),
        delete: () => ((op = "delete"), api),
        eq: (c: string, v: any) => (filters.push((r) => r[c] === v), api),
        maybeSingle: () => ((single = true), api),
        then: (res: any, rej: any) => Promise.resolve(run()).then(res, rej),
      }
      return api
    }
    return { from: builder }
  },
}))

import { generateBracket } from "@/lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { ensureRepechajeStructure, insertCircuitoBracket, syncCircuitoBracketSlots } from "../circuito/bracket"
import { refreshRepechajeStructure } from "../circuito/matches"
import { createAdminClient } from "@/lib/supabase/admin"

describe("refreshRepechajeStructure", () => {
  it("20 inscriptos, primeros partidos decididos con un repechaje armado con huecos: lo deja como cuadro entre los perdedores", async () => {
    const n = 20
    const participants = Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, category_id: "c1", seed: i + 1 }))
    state.tables = {
      circuito_categories: [{ id: "c1", draw_size: n }],
      circuito_participants: participants,
      circuito_matches: [],
    }
    const db = createAdminClient() as any
    await insertCircuitoBracket(db, "c1", "main", generateBracket(participants.map((p) => ({ id: p.id, seed: p.seed })), CIRCUITO_FORMAT_SPEC))
    await ensureRepechajeStructure(db, "c1")
    await syncCircuitoBracketSlots(db, "c1", "single_elimination")

    // Se juegan 1ª y 2ª ronda SIN sincronizar el repechaje (como quedó en producción
    // con la versión anterior): solo se avanzan los ganadores del principal.
    for (const round of [1, 2]) {
      for (const m of state.tables.circuito_matches.filter((x) => x.bracket === "main" && x.round_number === round)) {
        if (m.participant_a_id && m.participant_b_id && !m.winner_id) {
          Object.assign(m, { winner_id: m.participant_a_id, score: "6-0 6-0", status: "played" })
        }
      }
      // avanza lugares del principal (sin tocar el repechaje)
      const rep = state.tables.circuito_matches.filter((x) => x.bracket === "repechaje").map((x) => ({ ...x }))
      await syncCircuitoBracketSlots(db, "c1", "single_elimination")
      // restablece el repechaje como estaba (huecos viejos)
      state.tables.circuito_matches.filter((x) => x.bracket === "repechaje").forEach((x, i) => Object.assign(x, rep[i]))
    }

    await refreshRepechajeStructure("c1")

    const r1 = state.tables.circuito_matches.filter((m) => m.bracket === "repechaje" && m.round_number === 1)
    const withBoth = r1.filter((m) => m.participant_a_id && m.participant_b_id)
    const empty = r1.filter((m) => !m.participant_a_id && !m.participant_b_id)
    expect(empty).toHaveLength(0) // ningún "por definir vs por definir" en la 1ª ronda
    const placed = r1.flatMap((m) => [m.participant_a_id, m.participant_b_id]).filter(Boolean)
    expect(placed.length).toBeGreaterThan(1)
    // cada partido con un solo jugador es un pase libre ya resuelto: el jugador está en la 2ª ronda
    const r2 = state.tables.circuito_matches.filter((m) => m.bracket === "repechaje" && m.round_number === 2).flatMap((m) => [m.participant_a_id, m.participant_b_id])
    for (const m of r1) {
      if (!(m.participant_a_id && m.participant_b_id)) expect(r2).toContain(m.participant_a_id ?? m.participant_b_id)
    }
    expect(withBoth.length).toBeLessThanOrEqual(r1.length)
  })
})
