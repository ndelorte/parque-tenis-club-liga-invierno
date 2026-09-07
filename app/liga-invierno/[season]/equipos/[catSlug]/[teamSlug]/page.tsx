import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCategoryBySlugForTournament } from "@/lib/data/categories"
import { getTournamentBySlug } from "@/lib/data/tournaments"
import { getTeamBySlugAndCategory } from "@/lib/data/teams"
import { getSeriesForTeam } from "@/lib/data/series"
import { getStandingsSnapshot } from "@/lib/data/standings"
import { TeamDetailView } from "@/components/liga/team-detail"
import type { TeamDetail, PlayedDate, PendingDate, CourtDetail } from "@/lib/team-detail-types"
import type { CourtMatch } from "@/lib/tournament/types"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ season: string; catSlug: string; teamSlug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season, catSlug, teamSlug } = await params
  const tournament = await getTournamentBySlug(season)
  if (!tournament) return {}
  const category = await getCategoryBySlugForTournament(tournament.id, catSlug)
  if (!category) return {}
  const team = await getTeamBySlugAndCategory(teamSlug, category.id)
  if (!team) return {}
  return {
    title: `${team.name} | ${tournament.name} ${tournament.season} | Parque Tenis Club`,
    description: `Historial, jugadores y fixture de ${team.name} en la ${tournament.name}.`,
  }
}

function buildCourtDetail(cm: CourtMatch, teamId: string, isHome: boolean): CourtDetail {
  const currentTeamWon = cm.winner_team_id === teamId
  const winner = (currentTeamWon === isHome) ? ("home" as const) : ("away" as const)
  return {
    court: cm.court_number,
    homePlayers: [
      cm.home_player_1?.display_name ?? "—",
      cm.home_player_2?.display_name ?? "—",
    ],
    awayPlayers: [
      cm.away_player_1?.display_name ?? "—",
      cm.away_player_2?.display_name ?? "—",
    ],
    score: cm.score ?? (cm.is_court_walkover ? "6-0 6-0" : "—"),
    winner,
    wo: cm.is_court_walkover,
  }
}

export default async function EquipoPage({ params }: Props) {
  const { season, catSlug, teamSlug } = await params

  const tournament = await getTournamentBySlug(season)
  if (!tournament) notFound()

  const category = await getCategoryBySlugForTournament(tournament.id, catSlug)
  if (!category) notFound()

  const team = await getTeamBySlugAndCategory(teamSlug, category.id)
  if (!team) notFound()

  const [allSeries, allStandings] = await Promise.all([
    getSeriesForTeam(team.id),
    getStandingsSnapshot(team.category_id),
  ])

  const myStanding = allStandings.find((s) => s.team_id === team.id)

  const played: PlayedDate[] = []
  const pending: PendingDate[] = []

  for (const s of allSeries) {
    const isHome = s.home_team_id === team.id
    const opponentTeam = isHome ? s.away_team : s.home_team
    const opponentName = opponentTeam?.name ?? (isHome ? s.away_team_id : s.home_team_id)
    const roundName = s.round?.name ?? ""

    if (s.status === "completed" || s.status === "walkover") {
      const courts = (s.court_matches ?? [])
        .sort((a, b) => a.court_number - b.court_number)
        .map((cm) => buildCourtDetail(cm, team.id, isHome))

      const teamCourtsWon = isHome ? (s.home_courts_won ?? 0) : (s.away_courts_won ?? 0)
      const teamCourtsLost = isHome ? (s.away_courts_won ?? 0) : (s.home_courts_won ?? 0)

      played.push({
        round: roundName,
        date: s.scheduled_date ?? "",
        opponent: opponentName,
        isHome,
        courtsWon: teamCourtsWon,
        courtsLost: teamCourtsLost,
        result:
          s.winner_team_id === team.id || s.walkover_winner_team_id === team.id
            ? "win"
            : "loss",
        courts,
      })
    } else if ((s.status === "scheduled" || s.status === "rescheduled") && s.round?.phase === "regular") {
      pending.push({
        round: roundName,
        date: s.scheduled_date ?? "",
        time: s.scheduled_time ?? "—",
        opponent: opponentName,
        isHome,
      })
    }
  }

  const captainPlayer = team.players?.find((tp) => tp.is_captain)
  const captainName = captainPlayer?.player?.display_name ?? team.captain_name ?? "—"
  const roster = (team.players ?? []).map((tp) => tp.player?.display_name ?? "—")
  const categoryLabel = category.name

  const teamDetail: TeamDetail = {
    slug: team.slug,
    name: team.name,
    seasonSlug: tournament.slug,
    categorySlug: category.slug,
    categoryLabel,
    captain: captainName,
    roster,
    stats: {
      played: myStanding?.played ?? 0,
      won: myStanding?.won ?? 0,
      lost: myStanding?.lost ?? 0,
      courtsFor: myStanding?.courts_won ?? 0,
      courtsAgainst: myStanding?.courts_lost ?? 0,
      points: myStanding?.points ?? 0,
      position: myStanding?.position ?? 0,
      totalTeams: allStandings.length,
    },
    played,
    pending,
  }

  return <TeamDetailView team={teamDetail} />
}
