import { notFound } from "next/navigation"
import { LigaHeader } from "@/components/liga/liga-header"
import { LigaBoard } from "@/components/liga/liga-board"
import { LigaReglamento } from "@/components/liga/liga-reglamento"
import { SponsorsBanner } from "@/components/liga/sponsors-banner"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { getTournamentBySlug } from "@/lib/data/tournaments"
import { getCategoriesForTournament } from "@/lib/data/categories"
import { getTeamsByCategory } from "@/lib/data/teams"
import { getStandingsSnapshot } from "@/lib/data/standings"
import { getRoundsWithSeries } from "@/lib/data/series"
import { getPlayoffSeries } from "@/lib/data/playoffs"
import {
  generateProvisionalBracket,
  mergeProvisionalBracketWithScheduledMatches,
} from "@/lib/playoffs/generateProvisionalBracket"
import type { ProvisionalBracket } from "@/lib/playoffs/types"
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
    title: `${tournament.name} ${tournament.season} | Parque Tenis Club`,
    description:
      "Torneo por equipos de dobles. Posiciones, fixture, resultados y equipos de las categorías Caballeros, Damas y Mixto.",
  }
}

export default async function SeasonPage({ params, searchParams }: Props) {
  const { season } = await params
  const { categoria } = await searchParams

  const tournament = await getTournamentBySlug(season)
  if (!tournament) notFound()

  if (tournament.status === "upcoming") {
    return (
      <main className="min-h-dvh bg-background">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            {tournament.name} {tournament.season}
          </h1>
          <p className="mt-2 text-gray-600">Próximamente. Todavía no arrancó esta edición.</p>
        </div>
        <WhatsappFab />
      </main>
    )
  }

  const categories = await getCategoriesForTournament(tournament.id)

  if (tournament.status === "finished") {
    return (
      <main className="min-h-dvh bg-background">
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-gray-900">
            {tournament.name} {tournament.season}
          </h1>
          <p className="mt-2 text-gray-600">
            Esta edición ya terminó. Muy pronto vas a poder ver acá la tabla final y el cuadro de
            campeones.
          </p>
        </div>
        <WhatsappFab />
      </main>
    )
  }

  const bundles = await Promise.all(
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

      let bracket: ProvisionalBracket | null = null
      try {
        if (effectiveStandings.length >= 5) {
          const generated = generateProvisionalBracket(effectiveStandings, effectiveStandings.length)
          bracket = mergeProvisionalBracketWithScheduledMatches(generated, playoffSeries)
        }
      } catch {
        bracket = null
      }

      return { category, standings, rounds, teams, bracket, playoffSeries }
    }),
  )

  return (
    <main className="min-h-dvh bg-background">
      <LigaHeader tournament={tournament} />
      <LigaBoard bundles={bundles} initialCategory={categoria} seasonSlug={tournament.slug} />
      <LigaReglamento />
      <SponsorsBanner />
      <WhatsappFab />
    </main>
  )
}
