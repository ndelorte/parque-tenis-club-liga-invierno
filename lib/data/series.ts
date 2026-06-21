import { createClient } from "@/lib/supabase/server"
import type { Round, Series, CourtMatch } from "@/lib/tournament/types"
import type { Database } from "@/lib/supabase/types"

type RoundRow = Database["public"]["Tables"]["rounds"]["Row"]
type SeriesRow = Database["public"]["Tables"]["series"]["Row"]
type CourtMatchRow = Database["public"]["Tables"]["court_matches"]["Row"]

export type RoundWithSeries = Round & {
  series: (Series & { court_matches: CourtMatch[] })[]
}

type RoundWithSeriesRow = RoundRow & {
  series: (SeriesRow & { court_matches: CourtMatchRow[] })[]
}

function mapCourtMatch(cm: CourtMatchRow): CourtMatch {
  return {
    id: cm.id,
    series_id: cm.series_id,
    court_number: cm.court_number as 1 | 2 | 3,
    score: cm.score ?? undefined,
    winner_team_id: cm.winner_team_id ?? undefined,
    is_court_walkover: cm.is_court_walkover,
    home_sets_won: cm.home_sets_won ?? undefined,
    away_sets_won: cm.away_sets_won ?? undefined,
    home_games_won: cm.home_games_won ?? undefined,
    away_games_won: cm.away_games_won ?? undefined,
    home_player_1_id: cm.home_player_1_id ?? undefined,
    home_player_2_id: cm.home_player_2_id ?? undefined,
    away_player_1_id: cm.away_player_1_id ?? undefined,
    away_player_2_id: cm.away_player_2_id ?? undefined,
  }
}

function mapSeries(s: SeriesRow & { court_matches?: CourtMatchRow[] }): Series & { court_matches: CourtMatch[] } {
  return {
    id: s.id,
    round_id: s.round_id,
    category_id: s.category_id,
    home_team_id: s.home_team_id,
    away_team_id: s.away_team_id,
    scheduled_date: s.scheduled_date ?? undefined,
    scheduled_time: s.scheduled_time ?? undefined,
    original_scheduled_date: s.original_scheduled_date ?? undefined,
    original_scheduled_time: s.original_scheduled_time ?? undefined,
    rescheduled_reason: s.rescheduled_reason ?? undefined,
    status: s.status as Series["status"],
    is_general_walkover: s.is_general_walkover,
    walkover_winner_team_id: s.walkover_winner_team_id ?? undefined,
    winner_team_id: s.winner_team_id ?? undefined,
    home_courts_won: s.home_courts_won ?? undefined,
    away_courts_won: s.away_courts_won ?? undefined,
    notes: s.notes ?? undefined,
    court_matches: (s.court_matches ?? []).map(mapCourtMatch),
  }
}

export async function getRoundsWithSeries(categoryId: string): Promise<RoundWithSeries[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rounds")
    .select("*, series(*, court_matches(*))")
    .eq("category_id", categoryId)
    .order("round_number")

  if (error || !data) return []

  return (data as unknown as RoundWithSeriesRow[]).map((round) => ({
    id: round.id,
    category_id: round.category_id,
    phase: round.phase as Round["phase"],
    round_number: round.round_number,
    name: round.name,
    scheduled_date: round.scheduled_date ?? undefined,
    status: round.status as Round["status"],
    series: (round.series ?? []).map(mapSeries),
  }))
}

export async function getSeriesForTeam(
  teamId: string,
): Promise<(Series & { court_matches: CourtMatch[] })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("series")
    .select("*, court_matches(*)")
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("scheduled_date", { ascending: true })

  if (error || !data) return []

  return (data as unknown as (SeriesRow & { court_matches: CourtMatchRow[] })[]).map(mapSeries)
}
