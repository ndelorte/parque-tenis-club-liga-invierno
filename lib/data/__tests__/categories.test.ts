import { describe, it, expect, vi } from "vitest"

type FixtureRow = Record<string, unknown>

function makeQueryBuilder(rows: FixtureRow[]) {
  let filtered = rows
  const builder = {
    eq(field: string, value: unknown) {
      filtered = filtered.filter((row) => row[field] === value)
      return builder
    },
    async single() {
      if (filtered.length === 1) return { data: filtered[0], error: null }
      return { data: null, error: { message: "not found or multiple rows" } }
    },
  }
  return builder
}

function makeFakeClient(tables: Record<string, FixtureRow[]>) {
  return {
    from(table: string) {
      return {
        select: () => makeQueryBuilder(tables[table] ?? []),
      }
    },
  }
}

const TOURNAMENT_2025 = "tournament-2025"
const TOURNAMENT_2026 = "tournament-2026"

const CATEGORIES_FIXTURE: FixtureRow[] = [
  {
    id: "cat-2025-caballeros-a",
    tournament_id: TOURNAMENT_2025,
    name: "Caballeros A",
    slug: "caballeros-a",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    sort_order: 1,
    direct_semifinalists_count: null,
    quarterfinals_enabled: false,
  },
  {
    id: "cat-2026-caballeros-a",
    tournament_id: TOURNAMENT_2026,
    name: "Caballeros A",
    slug: "caballeros-a",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    sort_order: 1,
    direct_semifinalists_count: null,
    quarterfinals_enabled: false,
  },
]

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => makeFakeClient({ categories: CATEGORIES_FIXTURE }),
}))

describe("getCategoryBySlugForTournament", () => {
  it("devuelve la categoría del torneo correcto cuando el mismo slug existe en 2 torneos", async () => {
    const { getCategoryBySlugForTournament } = await import("../categories")

    const result2025 = await getCategoryBySlugForTournament(TOURNAMENT_2025, "caballeros-a")
    const result2026 = await getCategoryBySlugForTournament(TOURNAMENT_2026, "caballeros-a")

    expect(result2025?.id).toBe("cat-2025-caballeros-a")
    expect(result2026?.id).toBe("cat-2026-caballeros-a")
  })

  it("devuelve null si el slug no existe en ese torneo", async () => {
    const { getCategoryBySlugForTournament } = await import("../categories")

    const result = await getCategoryBySlugForTournament(TOURNAMENT_2025, "categoria-inexistente")

    expect(result).toBeNull()
  })
})
