import { describe, it, expect, vi } from "vitest"

type FixtureRow = Record<string, unknown>

function makeQueryBuilder(rows: FixtureRow[]) {
  let filtered = [...rows]
  const builder = {
    eq(field: string, value: unknown) {
      filtered = filtered.filter((row) => row[field] === value)
      return builder
    },
    neq(field: string, value: unknown) {
      filtered = filtered.filter((row) => row[field] !== value)
      return builder
    },
    order() {
      return builder
    },
    async single() {
      if (filtered.length === 1) return { data: filtered[0], error: null }
      return { data: null, error: { message: "not found or multiple rows" } }
    },
    // Hace el builder "thenable" para soportar `await ...eq(...).neq(...).order(...)`
    // sin `.single()` final, como getPlayoffSeries.
    then(resolve: (value: { data: FixtureRow[]; error: null }) => void) {
      resolve({ data: filtered, error: null })
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

const CATEGORY_PLAYED = "cat-final-played"
const CATEGORY_NOT_PLAYED = "cat-final-not-played"
const CATEGORY_NO_FINAL = "cat-no-final"

const ROUNDS_FIXTURE: FixtureRow[] = [
  {
    id: "round-final-played",
    category_id: CATEGORY_PLAYED,
    phase: "final",
    round_number: 3,
    series: [
      {
        id: "series-final-played",
        round_id: "round-final-played",
        home_team_id: "team-a",
        away_team_id: "team-b",
        scheduled_date: null,
        scheduled_time: null,
        status: "completed",
        winner_team_id: "team-a",
      },
    ],
  },
  {
    id: "round-final-not-played",
    category_id: CATEGORY_NOT_PLAYED,
    phase: "final",
    round_number: 3,
    series: [
      {
        id: "series-final-not-played",
        round_id: "round-final-not-played",
        home_team_id: "team-c",
        away_team_id: "team-d",
        scheduled_date: null,
        scheduled_time: null,
        status: "scheduled",
        winner_team_id: null,
      },
    ],
  },
]

const TEAMS_FIXTURE: FixtureRow[] = [
  {
    id: "team-a",
    category_id: CATEGORY_PLAYED,
    name: "Los Halcones",
    slug: "los-halcones",
    captain_name: null,
    active: true,
  },
]

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    makeFakeClient({ rounds: ROUNDS_FIXTURE, teams: TEAMS_FIXTURE }),
}))

describe("getChampionForCategory", () => {
  it("devuelve el equipo ganador cuando la final ya se jugó", async () => {
    const { getChampionForCategory } = await import("../playoffs")

    const champion = await getChampionForCategory(CATEGORY_PLAYED)

    expect(champion?.id).toBe("team-a")
    expect(champion?.name).toBe("Los Halcones")
  })

  it("devuelve null cuando la final todavía no se jugó", async () => {
    const { getChampionForCategory } = await import("../playoffs")

    const champion = await getChampionForCategory(CATEGORY_NOT_PLAYED)

    expect(champion).toBeNull()
  })

  it("devuelve null cuando no hay ronda de final cargada", async () => {
    const { getChampionForCategory } = await import("../playoffs")

    const champion = await getChampionForCategory(CATEGORY_NO_FINAL)

    expect(champion).toBeNull()
  })
})
