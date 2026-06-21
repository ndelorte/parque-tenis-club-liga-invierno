import { createClient } from "@/lib/supabase/server"
import type { Round, Series, CourtMatch, Team, Player } from "@/lib/tournament/types"
import type { Database } from "@/lib/supabase/types"

type RoundRow = Database["public"]["Tables"]["rounds"]["Row"]
type SeriesRow = Database["public"]["Tables"]["series"]["Row"]
type CourtMatchRow = Database["public"]["Tables"]["court_matches"]["Row"]

export type RoundWithSeries = Round & {
  series: (Series & { court_matches: CourtMatch[]; home_team?: Team; away_team?: Team })[]
}

type TeamSimple = Pick<Team, "id" | "name" | "slug" | "category_id" | "captain_name" | "active">
type PlayerSimple = Pick<Player, "id" | "display_name">

type CourtMatchWithPlayers = CourtMatchRow & {
  home_player_1: PlayerSimple | null
  home_player_2: PlayerSimple | null
  away_player_1: PlayerSimple | null
  away_player_2: PlayerSimple | null
}

type SeriesWithTeams = SeriesRow & {
  home_team: TeamSimple | null
  away_team: TeamSimple | null
  court_matches: CourtMatchWithPlayers[]
}

type RoundWithSeriesRow = RoundRow & {
  series: SeriesWithTeams[]
}

function mapTeam(t: TeamSimple | null): Team | undefined {
  if (!t) return undefined
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    category_id: t.category_id,
    captain_name: t.captain_name ?? undefined,
    active: t.active,
  }
}

function mapCourtMatch(cm: CourtMatchWithPlayers): CourtMatch {
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
    home_player_1: cm.home_player_1
      ? { id: cm.home_player_1.id, display_name: cm.home_player_1.display_name, first_name: "", last_name: "", active: true }
      : undefined,
    home_player_2: cm.home_player_2
      ? { id: cm.home_player_2.id, display_name: cm.home_player_2.display_name, first_name: "", last_name: "", active: true }
      : undefined,
    away_player_1: cm.away_player_1
      ? { id: cm.away_player_1.id, display_name: cm.away_player_1.display_name, first_name: "", last_name: "", active: true }
      : undefined,
    away_player_2: cm.away_player_2
      ? { id: cm.away_player_2.id, display_name: cm.away_player_2.display_name, first_name: "", last_name: "", active: true }
      : undefined,
  }
}

function mapSeries(
  s: SeriesWithTeams,
): Series & { court_matches: CourtMatch[]; home_team?: Team; away_team?: Team } {
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
    home_team: mapTeam(s.home_team),
    away_team: mapTeam(s.away_team),
    court_matches: (s.court_matches ?? []).map(mapCourtMatch),
  }
}

export async function getRoundsWithSeries(categoryId: string): Promise<RoundWithSeries[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rounds")
    .select(`
      *,
      series(
        *,
        home_team:teams!home_team_id(id, name, slug, category_id, captain_name, active),
        away_team:teams!away_team_id(id, name, slug, category_id, captain_name, active),
        court_matches(
          *,
          home_player_1:players!home_player_1_id(id, display_name),
          home_player_2:players!home_player_2_id(id, display_name),
          away_player_1:players!away_player_1_id(id, display_name),
          away_player_2:players!away_player_2_id(id, display_name)
        )
      )
    `)
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
): Promise<(Series & { court_matches: CourtMatch[]; home_team?: Team; away_team?: Team; round?: Round })[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("series")
    .select(`
      *,
      home_team:teams!home_team_id(id, name, slug, category_id, captain_name, active),
      away_team:teams!away_team_id(id, name, slug, category_id, captain_name, active),
      round:rounds!round_id(id, category_id, phase, round_number, name, scheduled_date, status),
      court_matches(
        *,
        home_player_1:players!home_player_1_id(id, display_name),
        home_player_2:players!home_player_2_id(id, display_name),
        away_player_1:players!away_player_1_id(id, display_name),
        away_player_2:players!away_player_2_id(id, display_name)
      )
    `)
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .order("scheduled_date", { ascending: true })

  if (error || !data) return []

  type SeriesWithRound = SeriesWithTeams & { round: RoundRow | null }

  return (data as unknown as SeriesWithRound[]).map((s) => ({
    ...mapSeries(s),
    round: s.round
      ? {
          id: s.round.id,
          category_id: s.round.category_id,
          phase: s.round.phase as Round["phase"],
          round_number: s.round.round_number,
          name: s.round.name,
          scheduled_date: s.round.scheduled_date ?? undefined,
          status: s.round.status as Round["status"],
        }
      : undefined,
  }))
}
