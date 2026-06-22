"use server"
/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isAdminUser } from "@/lib/auth/admin"

// ——— Public types ———

export type CategoryForAdmin = {
  id: string
  name: string
  slug: string
}

export type PlayerInfo = {
  id: string
  displayName: string
}

export type TeamForAdmin = {
  id: string
  name: string
  slug: string
  players: { teamPlayerId: string; playerId: string; displayName: string; isCaptain: boolean }[]
}

export type CourtForAdmin = {
  courtNumber: 1 | 2 | 3
  homePlayer1Id: string | null
  homePlayer2Id: string | null
  awayPlayer1Id: string | null
  awayPlayer2Id: string | null
  score: string | null
  winnerTeamId: string | null
  isWalkover: boolean
}

export type SeriesForAdmin = {
  id: string
  homeTeam: { id: string; name: string; players: PlayerInfo[] }
  awayTeam: { id: string; name: string; players: PlayerInfo[] }
  scheduledDate: string | null
  scheduledTime: string | null
  originalScheduledDate: string | null
  originalScheduledTime: string | null
  status: string
  isGeneralWalkover: boolean
  walkoverWinnerId: string | null
  courts: CourtForAdmin[]
}

export type RoundForAdmin = {
  id: string
  name: string
  roundNumber: number
  series: SeriesForAdmin[]
}

// ——— Read actions ———

export async function getAdminCategories(): Promise<CategoryForAdmin[]> {
  const supabase = await createClient()

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id")
    .eq("status", "active")
    .limit(1)
    .single()

  if (!tournament) return []

  const { data } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("tournament_id", (tournament as any).id)
    .order("sort_order")

  return (data ?? []) as CategoryForAdmin[]
}

export async function getTeamsForAdmin(categoryId: string): Promise<TeamForAdmin[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("teams")
    .select(
      "id, name, slug, team_players(id, player_id, active, players(id, display_name))",
    )
    .eq("category_id", categoryId)
    .eq("active", true)
    .order("name")

  if (!data) return []

  return (data as any[]).map((team) => ({
    id: team.id,
    name: team.name,
    slug: team.slug,
    players: (team.team_players as any[])
      .filter((tp) => tp.active)
      .map((tp) => ({
        teamPlayerId: tp.id,
        playerId: tp.player_id,
        displayName: tp.players?.display_name ?? "",
        isCaptain: tp.is_captain ?? false,
      })),
  }))
}

export async function getRoundsForAdmin(categoryId: string): Promise<RoundForAdmin[]> {
  const supabase = await createClient()

  const [roundsResult, teamsResult] = await Promise.all([
    supabase
      .from("rounds")
      .select(
        `id, name, round_number,
        series(
          id, status, is_general_walkover, walkover_winner_team_id,
          scheduled_date, scheduled_time,
          original_scheduled_date, original_scheduled_time,
          home_team_id, away_team_id,
          court_matches(
            court_number, home_player_1_id, home_player_2_id,
            away_player_1_id, away_player_2_id,
            score, winner_team_id, is_court_walkover
          )
        )`,
      )
      .eq("category_id", categoryId)
      .order("round_number"),
    supabase
      .from("teams")
      .select("id, name, team_players(id, player_id, active, players(id, display_name))")
      .eq("category_id", categoryId)
      .eq("active", true),
  ])

  if (roundsResult.error || !roundsResult.data) return []

  const teamMap = new Map<string, { id: string; name: string; players: PlayerInfo[] }>()
  for (const team of (teamsResult.data ?? []) as any[]) {
    teamMap.set(team.id, {
      id: team.id,
      name: team.name,
      players: (team.team_players as any[])
        .filter((tp) => tp.active)
        .map((tp) => ({ id: tp.player_id, displayName: tp.players?.display_name ?? "" })),
    })
  }

  return (roundsResult.data as any[]).map((round) => ({
    id: round.id,
    name: round.name,
    roundNumber: round.round_number,
    series: (round.series as any[] ?? []).map((s) => {
      const homeTeam = teamMap.get(s.home_team_id) ?? {
        id: s.home_team_id,
        name: "Equipo desconocido",
        players: [],
      }
      const awayTeam = teamMap.get(s.away_team_id) ?? {
        id: s.away_team_id,
        name: "Equipo desconocido",
        players: [],
      }
      const courts: CourtForAdmin[] = ([1, 2, 3] as const).map((n) => {
        const cm = (s.court_matches as any[] ?? []).find((c: any) => c.court_number === n)
        return {
          courtNumber: n,
          homePlayer1Id: cm?.home_player_1_id ?? null,
          homePlayer2Id: cm?.home_player_2_id ?? null,
          awayPlayer1Id: cm?.away_player_1_id ?? null,
          awayPlayer2Id: cm?.away_player_2_id ?? null,
          score: cm?.score ?? null,
          winnerTeamId: cm?.winner_team_id ?? null,
          isWalkover: cm?.is_court_walkover ?? false,
        }
      })
      return {
        id: s.id,
        homeTeam,
        awayTeam,
        scheduledDate: s.scheduled_date ?? null,
        scheduledTime: s.scheduled_time ?? null,
        originalScheduledDate: s.original_scheduled_date ?? null,
        originalScheduledTime: s.original_scheduled_time ?? null,
        status: s.status,
        isGeneralWalkover: s.is_general_walkover,
        walkoverWinnerId: s.walkover_winner_team_id ?? null,
        courts,
      }
    }),
  }))
}

// ——— Mutation actions ———

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
}

export type PlayerInput = {
  teamPlayerId: string | null
  playerId: string | null
  displayName: string
  isCaptain: boolean
}

export type TeamInput = {
  id: string | null
  name: string
  players: PlayerInput[]
}

export async function saveTeamPlayers(
  categoryId: string,
  teams: TeamInput[],
): Promise<{ success: boolean; error?: string }> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!isAdminUser(user)) {
    return { success: false, error: "No autorizado" }
  }

  const supabase = createAdminClient()

  try {
    const { data: currentTeams } = await supabase
      .from("teams")
      .select("id")
      .eq("category_id", categoryId)
      .eq("active", true)

    const inputIds = new Set(teams.filter((t) => t.id).map((t) => t.id!))

    for (const { id } of (currentTeams ?? []) as any[]) {
      if (!inputIds.has(id)) {
        await supabase.from("team_players").update({ active: false }).eq("team_id", id)
        await supabase.from("teams").update({ active: false }).eq("id", id)
      }
    }

    for (const team of teams) {
      let teamId = team.id

      if (!teamId) {
        const slug = `${slugify(team.name)}-${Date.now()}`
        const { data: newTeam } = await supabase
          .from("teams")
          .insert({ category_id: categoryId, name: team.name, slug, active: true })
          .select("id")
          .single()
        if (!newTeam) continue
        teamId = (newTeam as any).id
      } else {
        await supabase.from("teams").update({ name: team.name }).eq("id", teamId)
      }

      const { data: currentTPs } = await supabase
        .from("team_players")
        .select("id, player_id")
        .eq("team_id", teamId)
        .eq("active", true)

      const inputTPIds = new Set(
        team.players.filter((p) => p.teamPlayerId).map((p) => p.teamPlayerId!),
      )

      for (const tp of (currentTPs ?? []) as any[]) {
        if (!inputTPIds.has(tp.id)) {
          await supabase.from("team_players").update({ active: false }).eq("id", tp.id)
        }
      }

      for (const player of team.players) {
        if (!player.displayName.trim()) continue

        if (!player.playerId) {
          const { data: newPlayer } = await supabase
            .from("players")
            .insert({
              display_name: player.displayName.trim(),
              first_name: player.displayName.trim(),
              last_name: "",
              active: true,
            })
            .select("id")
            .single()
          if (!newPlayer) continue
          await supabase.from("team_players").insert({
            team_id: teamId,
            player_id: (newPlayer as any).id,
            active: true,
            is_captain: player.isCaptain ?? false,
          })
        } else {
          await supabase
            .from("players")
            .update({ display_name: player.displayName.trim() })
            .eq("id", player.playerId)
          if (player.teamPlayerId) {
            await supabase
              .from("team_players")
              .update({ is_captain: player.isCaptain ?? false })
              .eq("id", player.teamPlayerId)
          }
        }
      }
    }

    revalidatePath("/panel-parque")
    revalidatePath("/liga-invierno")
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export type CourtInput = {
  courtNumber: 1 | 2 | 3
  homePlayer1Id: string | null
  homePlayer2Id: string | null
  awayPlayer1Id: string | null
  awayPlayer2Id: string | null
  score: string
  winnerTeamId: string | null
  isWalkover: boolean
}

export type SeriesResultInput = {
  seriesId: string
  homeTeamId: string
  awayTeamId: string
  isGeneralWalkover: boolean
  walkoverWinnerId: string | null
  courts: CourtInput[]
}

export async function saveSeriesResult(
  input: SeriesResultInput,
): Promise<{ success: boolean; error?: string }> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!isAdminUser(user)) {
    return { success: false, error: "No autorizado" }
  }

  const supabase = createAdminClient()

  try {
    if (input.isGeneralWalkover && input.walkoverWinnerId) {
      const isHome = input.walkoverWinnerId === input.homeTeamId
      await supabase
        .from("series")
        .update({
          is_general_walkover: true,
          walkover_winner_team_id: input.walkoverWinnerId,
          winner_team_id: input.walkoverWinnerId,
          home_courts_won: isHome ? 3 : 0,
          away_courts_won: isHome ? 0 : 3,
          status: "walkover",
        })
        .eq("id", input.seriesId)

      revalidatePath("/panel-parque")
      revalidatePath("/liga-invierno")
      return { success: true }
    }

    let homeCourts = 0
    let awayCourts = 0

    for (const court of input.courts) {
      if (court.winnerTeamId === input.homeTeamId) homeCourts++
      if (court.winnerTeamId === input.awayTeamId) awayCourts++

      const { data: existing } = await supabase
        .from("court_matches")
        .select("id")
        .eq("series_id", input.seriesId)
        .eq("court_number", court.courtNumber)
        .maybeSingle()

      const matchData = {
        series_id: input.seriesId,
        court_number: court.courtNumber,
        home_player_1_id: court.homePlayer1Id,
        home_player_2_id: court.homePlayer2Id,
        away_player_1_id: court.awayPlayer1Id,
        away_player_2_id: court.awayPlayer2Id,
        score: court.score || null,
        winner_team_id: court.winnerTeamId,
        is_court_walkover: court.isWalkover,
      }

      if (existing) {
        await supabase.from("court_matches").update(matchData).eq("id", (existing as any).id)
      } else {
        await supabase.from("court_matches").insert(matchData)
      }
    }

    const winnerId =
      homeCourts >= 2 ? input.homeTeamId : awayCourts >= 2 ? input.awayTeamId : null

    await supabase
      .from("series")
      .update({
        is_general_walkover: false,
        home_courts_won: homeCourts,
        away_courts_won: awayCourts,
        winner_team_id: winnerId,
        status: winnerId ? "completed" : "in_progress",
      })
      .eq("id", input.seriesId)

    revalidatePath("/panel-parque")
    revalidatePath("/liga-invierno")
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ——— Playoff actions ———

export type StandingForAdmin = {
  teamId: string
  teamName: string
  position: number
}

export type PlayoffSeriesForAdmin = {
  id: string
  roundId: string
  phase: "quarterfinal" | "semifinal" | "final" | "third_place"
  homeTeam: { id: string; name: string; players: PlayerInfo[] }
  awayTeam: { id: string; name: string; players: PlayerInfo[] }
  scheduledDate: string | null
  scheduledTime: string | null
  status: string
  isGeneralWalkover: boolean
  walkoverWinnerId: string | null
  winnerTeamId: string | null
  courts: CourtForAdmin[]
}

export async function getStandingsForAdmin(
  categoryId: string
): Promise<StandingForAdmin[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("standings_snapshot")
    .select("team_id, position, teams(id, name)")
    .eq("category_id", categoryId)
    .order("position")

  if (!data) return []

  return (data as any[]).map((row) => ({
    teamId: row.team_id,
    teamName: row.teams?.name ?? "Equipo",
    position: row.position,
  }))
}

export async function getPlayoffSeriesForAdmin(
  categoryId: string
): Promise<PlayoffSeriesForAdmin[]> {
  const supabase = await createClient()

  const [roundsResult, teamsResult] = await Promise.all([
    supabase
      .from("rounds")
      .select(
        `id, phase,
        series(
          id, status, is_general_walkover, walkover_winner_team_id, winner_team_id,
          scheduled_date, scheduled_time, home_team_id, away_team_id,
          court_matches(
            court_number, home_player_1_id, home_player_2_id,
            away_player_1_id, away_player_2_id,
            score, winner_team_id, is_court_walkover
          )
        )`,
      )
      .eq("category_id", categoryId)
      .neq("phase", "regular")
      .order("round_number"),
    supabase
      .from("teams")
      .select("id, name, team_players(id, player_id, active, players(id, display_name))")
      .eq("category_id", categoryId)
      .eq("active", true),
  ])

  if (roundsResult.error || !roundsResult.data) return []

  const teamMap = new Map<string, { id: string; name: string; players: PlayerInfo[] }>()
  for (const team of (teamsResult.data ?? []) as any[]) {
    teamMap.set(team.id, {
      id: team.id,
      name: team.name,
      players: (team.team_players as any[])
        .filter((tp) => tp.active)
        .map((tp) => ({ id: tp.player_id, displayName: tp.players?.display_name ?? "" })),
    })
  }

  const result: PlayoffSeriesForAdmin[] = []
  for (const round of (roundsResult.data as any[])) {
    for (const s of round.series ?? []) {
      const homeTeam = teamMap.get(s.home_team_id) ?? { id: s.home_team_id, name: "Equipo", players: [] }
      const awayTeam = teamMap.get(s.away_team_id) ?? { id: s.away_team_id, name: "Equipo", players: [] }
      const courts: CourtForAdmin[] = ([1, 2, 3] as const).map((n) => {
        const cm = (s.court_matches as any[] ?? []).find((c: any) => c.court_number === n)
        return {
          courtNumber: n,
          homePlayer1Id: cm?.home_player_1_id ?? null,
          homePlayer2Id: cm?.home_player_2_id ?? null,
          awayPlayer1Id: cm?.away_player_1_id ?? null,
          awayPlayer2Id: cm?.away_player_2_id ?? null,
          score: cm?.score ?? null,
          winnerTeamId: cm?.winner_team_id ?? null,
          isWalkover: cm?.is_court_walkover ?? false,
        }
      })
      result.push({
        id: s.id,
        roundId: round.id,
        phase: round.phase as "quarterfinal" | "semifinal" | "final" | "third_place",
        homeTeam,
        awayTeam,
        scheduledDate: s.scheduled_date ?? null,
        scheduledTime: s.scheduled_time ?? null,
        status: s.status,
        isGeneralWalkover: s.is_general_walkover,
        walkoverWinnerId: s.walkover_winner_team_id ?? null,
        winnerTeamId: s.winner_team_id ?? null,
        courts,
      })
    }
  }

  return result
}

export async function createQuarterFinalSeries(
  categoryId: string,
  homeTeamId: string,
  awayTeamId: string,
  scheduledDate: string | null,
  scheduledTime: string | null,
): Promise<{ success: boolean; seriesId?: string; error?: string }> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!isAdminUser(user)) {
    return { success: false, error: "No autorizado" }
  }

  const supabase = createAdminClient()

  try {
    // Check if a QF round already exists for this category
    const { data: existingRound } = await supabase
      .from("rounds")
      .select("id")
      .eq("category_id", categoryId)
      .eq("phase", "quarterfinal")
      .maybeSingle()

    let roundId: string

    if (existingRound) {
      roundId = (existingRound as any).id
    } else {
      const { data: newRound, error: roundError } = await supabase
        .from("rounds")
        .insert({
          category_id: categoryId,
          phase: "quarterfinal",
          round_number: 100,
          name: "Cuartos de Final",
          status: "scheduled",
        })
        .select("id")
        .single()

      if (roundError || !newRound) {
        return { success: false, error: roundError?.message ?? "Error al crear la ronda" }
      }
      roundId = (newRound as any).id
    }

    // Check if a series for these two teams already exists in this round
    const { data: existingSeries } = await supabase
      .from("series")
      .select("id")
      .eq("round_id", roundId)
      .or(`and(home_team_id.eq.${homeTeamId},away_team_id.eq.${awayTeamId}),and(home_team_id.eq.${awayTeamId},away_team_id.eq.${homeTeamId})`)
      .maybeSingle()

    if (existingSeries) {
      // Update schedule only
      const { error: updateError } = await supabase
        .from("series")
        .update({
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
        })
        .eq("id", (existingSeries as any).id)

      if (updateError) return { success: false, error: updateError.message }

      revalidatePath("/panel-parque")
      revalidatePath("/liga-invierno")
      return { success: true, seriesId: (existingSeries as any).id }
    }

    const { data: newSeries, error: seriesError } = await supabase
      .from("series")
      .insert({
        round_id: roundId,
        category_id: categoryId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status: "scheduled",
        is_general_walkover: false,
      })
      .select("id")
      .single()

    if (seriesError || !newSeries) {
      return { success: false, error: seriesError?.message ?? "Error al crear la serie" }
    }

    revalidatePath("/panel-parque")
    revalidatePath("/liga-invierno")
    return { success: true, seriesId: (newSeries as any).id }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// phase_round_numbers: semifinal=101, final=102, third_place=103
const PHASE_CONFIG: Record<"semifinal" | "final" | "third_place", { roundNumber: number; name: string }> = {
  semifinal: { roundNumber: 101, name: "Semifinal" },
  final: { roundNumber: 102, name: "Final" },
  third_place: { roundNumber: 103, name: "Tercer y Cuarto Puesto" },
}

export async function upsertPlayoffSeries(params: {
  categoryId: string
  phase: "semifinal" | "final" | "third_place"
  homeTeamId: string
  awayTeamId: string
  scheduledDate: string | null
  scheduledTime: string | null
  existingSeriesId?: string
}): Promise<{ success: boolean; seriesId?: string; error?: string }> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!isAdminUser(user)) {
    return { success: false, error: "No autorizado" }
  }

  const { categoryId, phase, homeTeamId, awayTeamId, scheduledDate, scheduledTime, existingSeriesId } = params
  const supabase = createAdminClient()

  try {
    if (existingSeriesId) {
      const { error } = await supabase
        .from("series")
        .update({ scheduled_date: scheduledDate, scheduled_time: scheduledTime })
        .eq("id", existingSeriesId)
      if (error) return { success: false, error: error.message }
      revalidatePath("/panel-parque")
      revalidatePath("/liga-invierno")
      return { success: true, seriesId: existingSeriesId }
    }

    const cfg = PHASE_CONFIG[phase]
    const { data: existingRound } = await supabase
      .from("rounds")
      .select("id")
      .eq("category_id", categoryId)
      .eq("phase", phase)
      .maybeSingle()

    let roundId: string
    if (existingRound) {
      roundId = (existingRound as any).id
    } else {
      const { data: newRound, error: roundError } = await supabase
        .from("rounds")
        .insert({ category_id: categoryId, phase, round_number: cfg.roundNumber, name: cfg.name, status: "scheduled" })
        .select("id")
        .single()
      if (roundError || !newRound) return { success: false, error: roundError?.message ?? "Error al crear la ronda" }
      roundId = (newRound as any).id
    }

    // Check if a series for this pair already exists
    const { data: existingSeries } = await supabase
      .from("series")
      .select("id")
      .eq("round_id", roundId)
      .or(`and(home_team_id.eq.${homeTeamId},away_team_id.eq.${awayTeamId}),and(home_team_id.eq.${awayTeamId},away_team_id.eq.${homeTeamId})`)
      .maybeSingle()

    if (existingSeries) {
      await supabase.from("series").update({ scheduled_date: scheduledDate, scheduled_time: scheduledTime }).eq("id", (existingSeries as any).id)
      revalidatePath("/panel-parque")
      revalidatePath("/liga-invierno")
      return { success: true, seriesId: (existingSeries as any).id }
    }

    const { data: newSeries, error: seriesError } = await supabase
      .from("series")
      .insert({
        round_id: roundId,
        category_id: categoryId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status: "scheduled",
        is_general_walkover: false,
      })
      .select("id")
      .single()

    if (seriesError || !newSeries) return { success: false, error: seriesError?.message ?? "Error al crear la serie" }
    revalidatePath("/panel-parque")
    revalidatePath("/liga-invierno")
    return { success: true, seriesId: (newSeries as any).id }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

export async function updateSeriesSchedule(
  seriesId: string,
  date: string,
  time: string,
): Promise<{ success: boolean; error?: string }> {
  const authClient = await createClient()
  const {
    data: { user },
  } = await authClient.auth.getUser()
  if (!isAdminUser(user)) {
    return { success: false, error: "No autorizado" }
  }

  const supabase = createAdminClient()

  try {
    const { data: current } = await supabase
      .from("series")
      .select(
        "scheduled_date, scheduled_time, original_scheduled_date, original_scheduled_time, status",
      )
      .eq("id", seriesId)
      .single()

    if (!current) return { success: false, error: "Serie no encontrada" }

    const c = current as any
    const originalDate = c.original_scheduled_date ?? c.scheduled_date
    const originalTime = c.original_scheduled_time ?? c.scheduled_time
    const isRescheduled = date !== originalDate || time !== (originalTime ?? "")
    const isCompleted = c.status === "completed" || c.status === "walkover"
    const statusUpdate = isCompleted
      ? {}
      : { status: isRescheduled ? "rescheduled" : "scheduled" }

    await supabase
      .from("series")
      .update({
        scheduled_date: date || null,
        scheduled_time: time || null,
        original_scheduled_date: originalDate,
        original_scheduled_time: originalTime,
        ...statusUpdate,
      })
      .eq("id", seriesId)

    revalidatePath("/panel-parque")
    revalidatePath("/liga-invierno")
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
