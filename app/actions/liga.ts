"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRoundsWithSeries } from "@/lib/data/series"
import { getTeamsByCategory } from "@/lib/data/teams"
import { calculateStandings } from "@/lib/tournament/calculateStandings"
import { sortStandings } from "@/lib/tournament/sortStandings"
import { upsertStandingsSnapshot } from "@/lib/data/standings"

export type CourtInput = {
  courtNumber: 1 | 2 | 3
  homePlayers: [string, string]
  awayPlayers: [string, string]
  score: string
  winnerId: string
  isWalkover: boolean
}

export async function saveSeriesResult(
  seriesId: string,
  categoryId: string,
  courts: CourtInput[],
  isGeneralWalkover: boolean,
  walkoverWinnerId?: string,
) {
  const supabase = createAdminClient()

  if (isGeneralWalkover && walkoverWinnerId) {
    const { error } = await supabase
      .from("series")
      .update({
        status: "walkover",
        is_general_walkover: true,
        walkover_winner_team_id: walkoverWinnerId,
        winner_team_id: walkoverWinnerId,
        home_courts_won: 0,
        away_courts_won: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", seriesId)
    if (error) throw new Error(error.message)
  } else {
    for (const court of courts) {
      const { error } = await supabase
        .from("court_matches")
        .upsert(
          {
            series_id: seriesId,
            court_number: court.courtNumber,
            home_player_1_id: court.homePlayers[0] || null,
            home_player_2_id: court.homePlayers[1] || null,
            away_player_1_id: court.awayPlayers[0] || null,
            away_player_2_id: court.awayPlayers[1] || null,
            score: court.score || null,
            winner_team_id: court.winnerId || null,
            is_court_walkover: court.isWalkover,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "series_id,court_number" },
        )
      if (error) throw new Error(error.message)
    }

    const { data: seriesData, error: seriesError } = await supabase
      .from("series")
      .select("home_team_id, away_team_id")
      .eq("id", seriesId)
      .single()
    if (seriesError || !seriesData) throw new Error("Series no encontrada")

    const homeCourts = courts.filter((c) => c.winnerId === seriesData.home_team_id).length
    const awayCourts = courts.filter((c) => c.winnerId === seriesData.away_team_id).length
    const winnerId = homeCourts > awayCourts ? seriesData.home_team_id : seriesData.away_team_id

    const { error: updateError } = await supabase
      .from("series")
      .update({
        status: "completed",
        is_general_walkover: false,
        home_courts_won: homeCourts,
        away_courts_won: awayCourts,
        winner_team_id: winnerId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", seriesId)
    if (updateError) throw new Error(updateError.message)
  }

  await recalculateStandings(categoryId)

  revalidatePath("/liga-invierno")
  revalidatePath("/liga-invierno/categorias/caballeros-a")
  revalidatePath("/liga-invierno/categorias/caballeros-b")
  revalidatePath("/liga-invierno/categorias/damas-a")
  revalidatePath("/liga-invierno/categorias/damas-b")
  revalidatePath("/liga-invierno/categorias/mixto-a")
  revalidatePath("/liga-invierno/categorias/mixto-b")
}

async function recalculateStandings(categoryId: string) {
  const rounds = await getRoundsWithSeries(categoryId)
  const teams = await getTeamsByCategory(categoryId)
  const allSeries = rounds.flatMap((r) => r.series)
  const allCourtMatches = allSeries.flatMap((s) => s.court_matches ?? [])
  const standings = calculateStandings(teams, allSeries, allCourtMatches)
  const sorted = sortStandings(standings, allSeries, allCourtMatches)
  await upsertStandingsSnapshot(categoryId, sorted)
}

export async function saveReschedule(
  seriesId: string,
  newDate: string,
  newTime: string,
) {
  const supabase = createAdminClient()

  const { data, error: fetchError } = await supabase
    .from("series")
    .select("scheduled_date, scheduled_time, original_scheduled_date, original_scheduled_time")
    .eq("id", seriesId)
    .single()
  if (fetchError || !data) throw new Error("Series no encontrada")

  const originalDate = data.original_scheduled_date ?? data.scheduled_date
  const originalTime = data.original_scheduled_time ?? data.scheduled_time

  const { error } = await supabase
    .from("series")
    .update({
      scheduled_date: newDate || null,
      scheduled_time: newTime || null,
      original_scheduled_date: originalDate,
      original_scheduled_time: originalTime,
      status: "rescheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", seriesId)
  if (error) throw new Error(error.message)

  revalidatePath("/liga-invierno")
}
