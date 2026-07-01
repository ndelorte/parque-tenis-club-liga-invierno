import type { StandingsRow } from "@/lib/tournament/types"
import type { ProvisionalBracket, QuarterFinalMatchup } from "./types"

export function generateSixTeamQuarterfinals(
  standings: StandingsRow[]
): ProvisionalBracket {
  const sorted = [...standings]
    .sort((a, b) => a.position - b.position)
    .slice(0, 6)

  if (sorted.length < 6) {
    throw new Error(
      `Se necesitan 6 equipos para generar el cuadro, hay ${sorted.length}`
    )
  }

  return {
    format: "six_team",
    byes: [
      { seed: 1, team: sorted[0].team },
      { seed: 2, team: sorted[1].team },
    ],
    quarterfinals: [
      {
        matchNumber: 1,
        home: { seed: 3, team: sorted[2].team },
        away: { seed: 6, team: sorted[5].team },
        status: "pending",
      },
      {
        matchNumber: 2,
        home: { seed: 4, team: sorted[3].team },
        away: { seed: 5, team: sorted[4].team },
        status: "pending",
      },
    ],
  }
}

export function generateFiveTeamQuarterfinals(
  standings: StandingsRow[]
): ProvisionalBracket {
  const sorted = [...standings]
    .sort((a, b) => a.position - b.position)
    .slice(0, 5)

  if (sorted.length < 5) {
    throw new Error(
      `Se necesitan 5 equipos para generar el cuadro, hay ${sorted.length}`
    )
  }

  return {
    format: "five_team",
    byes: [
      { seed: 1, team: sorted[0].team },
      { seed: 2, team: sorted[1].team },
      { seed: 3, team: sorted[2].team },
    ],
    quarterfinals: [
      {
        matchNumber: 1,
        home: { seed: 4, team: sorted[3].team },
        away: { seed: 5, team: sorted[4].team },
        status: "pending",
      },
    ],
  }
}

export function generateProvisionalBracket(
  standings: StandingsRow[],
  teamsCount: number
): ProvisionalBracket {
  if (teamsCount === 5 && standings.length >= 5) {
    return generateFiveTeamQuarterfinals(standings)
  }
  if (teamsCount >= 6 && standings.length >= 6) {
    return generateSixTeamQuarterfinals(standings)
  }
  throw new Error(`No se puede generar el cuadro: se necesitan al menos 5 equipos (hay ${standings.length})`)
}

type ScheduledSeriesStub = {
  id: string
  home_team_id: string
  away_team_id: string
  scheduled_date?: string
  scheduled_time?: string
  status: string
  winner_team_id?: string | null
}

export function mergeProvisionalBracketWithScheduledMatches(
  bracket: ProvisionalBracket,
  playoffSeries: ScheduledSeriesStub[]
): ProvisionalBracket {
  const enrichedQFs = bracket.quarterfinals.map((qf) => {
    const match = playoffSeries.find(
      (s) =>
        (s.home_team_id === qf.home.team.id && s.away_team_id === qf.away.team.id) ||
        (s.home_team_id === qf.away.team.id && s.away_team_id === qf.home.team.id)
    )
    if (!match) return qf

    const status: QuarterFinalMatchup["status"] =
      match.status === "completed"
        ? "completed"
        : match.status === "walkover"
        ? "walkover"
        : match.status === "scheduled" || match.status === "rescheduled"
        ? "scheduled"
        : "pending"

    return {
      ...qf,
      seriesId: match.id,
      scheduledDate: match.scheduled_date,
      scheduledTime: match.scheduled_time,
      status,
      winnerTeamId: match.winner_team_id ?? undefined,
    }
  })

  return { ...bracket, quarterfinals: enrichedQFs }
}
