import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCategoryBySlug, getCategoriesForTournament } from "@/lib/data/categories"
import { getActiveTournament } from "@/lib/data/tournaments"
import { getTeamsByCategory } from "@/lib/data/teams"
import { getStandingsSnapshot } from "@/lib/data/standings"
import { getRoundsWithSeries } from "@/lib/data/series"
import { getPlayoffSeries } from "@/lib/data/playoffs"
import { TournamentHeader } from "@/components/liga/TournamentHeader"
import { StandingsTable } from "@/components/liga/StandingsTable"
import { FixtureList } from "@/components/liga/FixtureList"
import { TeamCard } from "@/components/liga/TeamCard"
import { CategoryTabs } from "@/components/liga/CategoryTabs"
import { PlayoffBracket } from "@/components/liga/PlayoffBracket"
import { generateProvisionalBracket, mergeProvisionalBracketWithScheduledMatches } from "@/lib/playoffs/generateProvisionalBracket"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return {}
  return {
    title: `${category.name} | Liga de Invierno | Parque Tenis Club`,
    description: `Tabla de posiciones, fixture y equipos de la categoría ${category.name}.`,
  }
}

export default async function CategoriaPage({ params }: Props) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const [tournament, categories, teams, standings, rounds, playoffSeries] = await Promise.all([
    getActiveTournament(),
    getCategoriesForTournament(category.tournament_id),
    getTeamsByCategory(category.id),
    getStandingsSnapshot(category.id),
    getRoundsWithSeries(category.id),
    getPlayoffSeries(category.id),
  ])

  const series = rounds.flatMap((r) =>
    r.series.map((s) => ({ ...s, round: r })),
  )

  const effectiveStandings =
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

  let bracket = null
  try {
    if (effectiveStandings.length >= 6) {
      const generated = generateProvisionalBracket(effectiveStandings, effectiveStandings.length)
      bracket = mergeProvisionalBracketWithScheduledMatches(generated, playoffSeries)
    }
  } catch {
    bracket = null
  }

  return (
    <div>
      {tournament && <TournamentHeader tournament={tournament} />}
      <CategoryTabs categories={categories} />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>

        <section>
          <h3 className="font-semibold text-gray-800 mb-3">Tabla de posiciones</h3>
          <StandingsTable standings={effectiveStandings} />
        </section>

        {bracket && (
          <section>
            <PlayoffBracket bracket={bracket} />
          </section>
        )}

        <section>
          <FixtureList series={series} />
        </section>

        {teams.length > 0 && (
          <section>
            <h3 className="font-semibold text-gray-800 mb-3">Equipos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
