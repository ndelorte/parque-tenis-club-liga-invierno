import { createClient } from "@/lib/supabase/server"
import { getTeamById } from "@/lib/data/teams"
import { getCategoryById } from "@/lib/data/categories"
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

export type PodiumNames = {
  championName: string | null
  runnerUpName: string | null
  thirdPlaceName: string | null
}

// Podio derivado de las series "final"/"third_place" digitalizadas.
async function getDerivedPodiumForCategory(categoryId: string): Promise<PodiumNames> {
  const series = await getPlayoffSeries(categoryId)

  const final = series.find((s) => s.phase === "final")
  const champion = final?.winner_team_id ? await getTeamById(final.winner_team_id) : null
  const runnerUpId = final?.winner_team_id
    ? final.winner_team_id === final.home_team_id
      ? final.away_team_id
      : final.home_team_id
    : null
  const runnerUp = runnerUpId ? await getTeamById(runnerUpId) : null

  const thirdPlaceSeries = series.find((s) => s.phase === "third_place")
  const thirdPlace = thirdPlaceSeries?.winner_team_id
    ? await getTeamById(thirdPlaceSeries.winner_team_id)
    : null

  return {
    championName: champion?.name ?? null,
    runnerUpName: runnerUp?.name ?? null,
    thirdPlaceName: thirdPlace?.name ?? null,
  }
}

// Podio de una categoría para la vista de edición cerrada. Prioriza el dato
// derivado de series digitalizadas; si no hay (ediciones históricas sin
// fixture completo — Sprint L7), cae al podio cargado a mano en `categories`.
export async function getPodiumForCategory(categoryId: string): Promise<PodiumNames> {
  const derived = await getDerivedPodiumForCategory(categoryId)
  if (derived.championName) return derived

  const category = await getCategoryById(categoryId)
  return {
    championName: category?.manual_champion_name ?? null,
    runnerUpName: category?.manual_runner_up_name ?? null,
    thirdPlaceName: category?.manual_third_place_name ?? null,
  }
}
