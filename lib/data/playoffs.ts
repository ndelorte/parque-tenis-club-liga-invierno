import { createClient } from "@/lib/supabase/server"

export type PlayoffSeriesSimple = {
  id: string
  round_id: string
  phase: "quarterfinal" | "semifinal" | "final"
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
  phase: "quarterfinal" | "semifinal" | "final"
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
