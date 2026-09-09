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
const CATEGORY_MANUAL_ONLY = "cat-manual-only"

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
    id: "round-third-place-played",
    category_id: CATEGORY_PLAYED,
    phase: "third_place",
    round_number: 103,
    series: [
      {
        id: "series-third-place-played",
        round_id: "round-third-place-played",
        home_team_id: "team-c",
        away_team_id: "team-d",
        scheduled_date: null,
        scheduled_time: null,
        status: "completed",
        winner_team_id: "team-c",
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
  {
    id: "team-b",
    category_id: CATEGORY_PLAYED,
    name: "Las Águilas",
    slug: "las-aguilas",
    captain_name: null,
    active: true,
  },
  {
    id: "team-c",
    category_id: CATEGORY_PLAYED,
    name: "Los Cóndores",
    slug: "los-condores",
    captain_name: null,
    active: true,
  },
]

const CATEGORIES_FIXTURE: FixtureRow[] = [
  {
    id: CATEGORY_MANUAL_ONLY,
    tournament_id: "t-historic",
    name: "Damas A",
    slug: "damas-a",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    direct_semifinalists_count: null,
    quarterfinals_enabled: false,
    sort_order: 0,
    manual_champion_name: "Equipo Histórico A",
    manual_runner_up_name: "Equipo Histórico B",
    manual_third_place_name: "Equipo Histórico C",
  },
]

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () =>
    makeFakeClient({ rounds: ROUNDS_FIXTURE, teams: TEAMS_FIXTURE, categories: CATEGORIES_FIXTURE }),
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

describe("getPodiumForCategory", () => {
  it("devuelve campeón, subcampeón y tercer puesto cuando final y third_place ya se jugaron", async () => {
    const { getPodiumForCategory } = await import("../playoffs")

    const podium = await getPodiumForCategory(CATEGORY_PLAYED)

    expect(podium.championName).toBe("Los Halcones")
    expect(podium.runnerUpName).toBe("Las Águilas")
    expect(podium.thirdPlaceName).toBe("Los Cóndores")
  })

  it("devuelve todo null cuando la final todavía no se jugó y no hay podio cargado a mano", async () => {
    const { getPodiumForCategory } = await import("../playoffs")

    const podium = await getPodiumForCategory(CATEGORY_NOT_PLAYED)

    expect(podium.championName).toBeNull()
    expect(podium.runnerUpName).toBeNull()
    expect(podium.thirdPlaceName).toBeNull()
  })

  it("devuelve tercer puesto null cuando no se jugó ese partido", async () => {
    const { getPodiumForCategory } = await import("../playoffs")

    const podium = await getPodiumForCategory(CATEGORY_NO_FINAL)

    expect(podium.thirdPlaceName).toBeNull()
  })

  it("cae al podio cargado a mano cuando no hay series de playoffs digitalizadas (ediciones históricas)", async () => {
    const { getPodiumForCategory } = await import("../playoffs")

    const podium = await getPodiumForCategory(CATEGORY_MANUAL_ONLY)

    expect(podium.championName).toBe("Equipo Histórico A")
    expect(podium.runnerUpName).toBe("Equipo Histórico B")
    expect(podium.thirdPlaceName).toBe("Equipo Histórico C")
  })
})
