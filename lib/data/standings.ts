import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { StandingsRow, Team, Series, CourtMatch } from "@/lib/tournament/types"
import type { Database } from "@/lib/supabase/types"
import { calculateStandings } from "@/lib/tournament/calculateStandings"
import { sortStandings } from "@/lib/tournament/sortStandings"

type SnapshotRow = Database["public"]["Tables"]["standings_snapshot"]["Row"]
type TeamRow = Database["public"]["Tables"]["teams"]["Row"]

type SnapshotWithTeam = SnapshotRow & { teams: TeamRow }

export async function getStandingsSnapshot(categoryId: string): Promise<StandingsRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("standings_snapshot")
    .select("*, teams(*)")
    .eq("category_id", categoryId)
    .order("position")

  if (error || !data) return []

  return (data as unknown as SnapshotWithTeam[]).map((row) => ({
    team_id: row.team_id,
    team: {
      id: row.teams.id,
      category_id: row.teams.category_id,
      name: row.teams.name,
      slug: row.teams.slug,
      captain_name: row.teams.captain_name ?? undefined,
      active: row.teams.active,
    },
    played: row.played,
    won: row.won,
    lost: row.lost,
    points: row.points,
    courts_won: row.courts_won,
    courts_lost: row.courts_lost,
    courts_diff: row.courts_diff,
    sets_won: row.sets_won,
    sets_lost: row.sets_lost,
    sets_diff: row.sets_diff,
    games_won: row.games_won,
    games_lost: row.games_lost,
    games_diff: row.games_diff,
    position: row.position,
  }))
}

// Recalcula y persiste la tabla de posiciones para una categoría.
// Usa admin client para bypassear RLS (operación de sistema, no de usuario).
export async function upsertStandingsSnapshot(
  categoryId: string,
  rows: StandingsRow[],
): Promise<void> {
  const supabase = createAdminClient()

  const payload = rows.map((row) => ({
    category_id: categoryId,
    team_id: row.team_id,
    played: row.played,
    won: row.won,
    lost: row.lost,
    points: row.points,
    courts_won: row.courts_won,
    courts_lost: row.courts_lost,
    courts_diff: row.courts_diff,
    sets_won: row.sets_won,
    sets_lost: row.sets_lost,
    sets_diff: row.sets_diff,
    games_won: row.games_won,
    games_lost: row.games_lost,
    games_diff: row.games_diff,
    position: row.position,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("standings_snapshot")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(payload as any, { onConflict: "category_id,team_id" })

  if (error) throw new Error(`Error al actualizar standings: ${error.message}`)
}

export async function recalculateAndPersistStandings(categoryId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: teamsData } = await supabase
    .from("teams")
    .select("id, name, slug, category_id, captain_name, active")
    .eq("category_id", categoryId)
    .eq("active", true)

  if (!teamsData?.length) return

  const { data: regularRounds } = await supabase
    .from("rounds")
    .select("id")
    .eq("category_id", categoryId)
    .eq("phase", "regular")

  const regularRoundIds = (regularRounds ?? []).map((r: any) => r.id)
  if (!regularRoundIds.length) return

  const { data: seriesData } = await supabase
    .from("series")
    .select("id, round_id, category_id, home_team_id, away_team_id, status, is_general_walkover, walkover_winner_team_id, winner_team_id")
    .in("round_id", regularRoundIds)
    .in("status", ["completed", "walkover"])

  const seriesIds = (seriesData ?? []).map((s: any) => s.id)

  const { data: courtsData } = seriesIds.length
    ? await supabase
        .from("court_matches")
        .select("id, series_id, court_number, score, is_court_walkover, winner_team_id")
        .in("series_id", seriesIds)
    : { data: [] as any[] }

  const teams: Team[] = (teamsData as any[]).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    category_id: t.category_id,
    captain_name: t.captain_name ?? undefined,
    active: t.active,
  }))

  const series: Series[] = (seriesData ?? []).map((s: any) => ({
    id: s.id,
    round_id: s.round_id,
    category_id: s.category_id,
    home_team_id: s.home_team_id,
    away_team_id: s.away_team_id,
    status: s.status,
    is_general_walkover: s.is_general_walkover,
    walkover_winner_team_id: s.walkover_winner_team_id ?? undefined,
    winner_team_id: s.winner_team_id ?? undefined,
  }))

  const courtMatches: CourtMatch[] = (courtsData ?? []).map((cm: any) => ({
    id: cm.id,
    series_id: cm.series_id,
    court_number: cm.court_number as 1 | 2 | 3,
    score: cm.score ?? undefined,
    is_court_walkover: cm.is_court_walkover,
    winner_team_id: cm.winner_team_id ?? undefined,
  }))

  const rawStandings = calculateStandings(teams, series, courtMatches)
  const sorted = sortStandings(rawStandings, series, courtMatches)

  await upsertStandingsSnapshot(categoryId, sorted)
}
