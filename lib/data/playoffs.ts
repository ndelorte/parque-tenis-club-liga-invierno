import { createClient } from "@/lib/supabase/server"
import { getTeamById } from "@/lib/data/teams"
import type { Team } from "@/lib/tournament/types"

export type PlayoffSeriesSimple = {
  id: string
  round_id: string
  phase: "quarterfinal" | "semifinal" | "final" | "third_place"
  home_team_id: string
  away_team_id: string
  scheduled_date?: string
  scheduled_time?: string
  status: string
  winner_team_id?: string | null
}

type SeriesRow = {
  id: string
  round_id: string
  home_team_id: string
  away_team_id: string
  scheduled_date: string | null
  scheduled_time: string | null
  status: string
  winner_team_id: string | null
}

type RoundWithSeriesRow = {
  id: string
  phase: "quarterfinal" | "semifinal" | "final" | "third_place"
  series: SeriesRow[]
}

export async function getPlayoffSeries(
  categoryId: string
): Promise<PlayoffSeriesSimple[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("rounds")
    .select(
      `id, phase,
      series(id, round_id, home_team_id, away_team_id, scheduled_date, scheduled_time, status, winner_team_id)`
    )
    .eq("category_id", categoryId)
    .neq("phase", "regular")
    .order("round_number")

  if (error || !data) return []

  const result: PlayoffSeriesSimple[] = []
  for (const round of data as unknown as RoundWithSeriesRow[]) {
    for (const s of round.series ?? []) {
      result.push({
        id: s.id,
        round_id: s.round_id,
        phase: round.phase,
        home_team_id: s.home_team_id,
        away_team_id: s.away_team_id,
        scheduled_date: s.scheduled_date ?? undefined,
        scheduled_time: s.scheduled_time ?? undefined,
        status: s.status,
        winner_team_id: s.winner_team_id,
      })
    }
  }

  return result
}

// Campeón derivado: gana la serie de fase "final" (no se guarda como campo
// aparte — CLAUDE.md: no duplicar datos calculados).
export async function getChampionForCategory(categoryId: string): Promise<Team | null> {
  const series = await getPlayoffSeries(categoryId)
  const final = series.find((s) => s.phase === "final")
  if (!final?.winner_team_id) return null
  return getTeamById(final.winner_team_id)
}
