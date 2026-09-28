import { notFound } from "next/navigation"
import { SectionHero } from "@/components/liga/SectionHero"
import { LigaBoard } from "@/components/liga/liga-board"
import { LigaReglamento } from "@/components/liga/liga-reglamento"
import { SponsorsBanner } from "@/components/liga/sponsors-banner"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { ClosedSeasonView } from "@/components/liga/ClosedSeasonView"
import { ComingSoonView } from "@/components/liga/ComingSoonView"
import { getTournamentBySlug } from "@/lib/data/tournaments"
import { getTournamentSponsors } from "@/lib/data/tournament-sponsors"
import { getPhotos } from "@/lib/data/tournament-photos"
import { getCategoriesForTournament } from "@/lib/data/categories"
import { getTeamsByCategory } from "@/lib/data/teams"
import { getStandingsSnapshot } from "@/lib/data/standings"
import { getRoundsWithSeries } from "@/lib/data/series"
import { getPlayoffSeries, getPodiumForCategory } from "@/lib/data/playoffs"
import { getSeasonTheme } from "@/components/liga/season-theme"
import { buildBracketOrNull } from "@/lib/playoffs/generateProvisionalBracket"
import { formatTournamentTitle } from "@/lib/tournament/formatTournamentTitle"
import type { StandingsRow } from "@/lib/tournament/types"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ season: string }>
  searchParams: Promise<{ categoria?: string }>
}

export async function generateMetadata({ params }: Props) {
  const { season } = await params
  const tournament = await getTournamentBySlug(season)
  if (!tournament) return {}
  return {
    title: `${formatTournamentTitle(tournament)} | Parque Tenis Club`,
    description:
      "Torneo por equipos de dobles. Posiciones, fixture, resultados y equipos de las categorías Caballeros, Damas y Mixto.",
  }
}

export default async function SeasonPage({ params, searchParams }: Props) {
  const { season } = await params
  const { categoria } = await searchParams

  const tournament = await getTournamentBySlug(season)
  if (!tournament) notFound()
  const theme = getSeasonTheme(tournament)

  if (tournament.status === "upcoming") {
    return (
      <main className="min-h-dvh bg-background" data-identity={theme.identity}>
        <SectionHero tournament={tournament} />
        <ComingSoonView tournament={tournament} />
        <WhatsappFab />
      </main>
    )
  }

  const categories = await getCategoriesForTournament(tournament.id)

  if (tournament.status === "finished") {
    const [closedBundles, generalPhotos] = await Promise.all([
      Promise.all(
        categories.map(async (category) => {
          const [podium, photos] = await Promise.all([
            getPodiumForCategory(category.id),
            getPhotos(tournament.id, category.id),
          ])
          return {
            category,
            championName: podium.championName,
            runnerUpName: podium.runnerUpName,
            thirdPlaceName: podium.thirdPlaceName,
            photos,
          }
        }),
      ),
      getPhotos(tournament.id, null),
    ])

    return (
      <main className="min-h-dvh bg-background" data-identity={theme.identity}>
        <SectionHero tournament={tournament} />
        <ClosedSeasonView tournament={tournament} bundles={closedBundles} generalPhotos={generalPhotos} />
        <WhatsappFab />
      </main>
    )
  }

  const [bundles, sponsors] = await Promise.all([
    Promise.all(
      categories.map(async (category) => {
        const [standings, rounds, teams, playoffSeries] = await Promise.all([
          getStandingsSnapshot(category.id),
          getRoundsWithSeries(category.id),
          getTeamsByCategory(category.id),
          getPlayoffSeries(category.id),
        ])

        const effectiveStandings: StandingsRow[] =
          standings.length > 0
            ? standings
            : teams.map((t, i) => ({
                team_id: t.id,
                team: t,
                played: 0,
                won: 0,
                lost: 0,
                points: 0,
                courts_won: 0,
                courts_lost: 0,
                courts_diff: 0,
                sets_won: 0,
                sets_lost: 0,
                sets_diff: 0,
                games_won: 0,
                games_lost: 0,
                games_diff: 0,
                position: i + 1,
              }))

        return {
          category,
          standings,
          rounds,
          teams,
          bracket: buildBracketOrNull(effectiveStandings, playoffSeries),
          playoffSeries,
        }
      }),
    ),
    getTournamentSponsors(tournament.id),
  ])

  return (
    <main className="min-h-dvh bg-background" data-identity={theme.identity}>
      <SectionHero tournament={tournament} />
      <LigaBoard bundles={bundles} initialCategory={categoria} seasonSlug={tournament.slug} season={theme.season} />
      <LigaReglamento />
      <SponsorsBanner sponsors={sponsors} />
      <WhatsappFab />
    </main>
  )
}
