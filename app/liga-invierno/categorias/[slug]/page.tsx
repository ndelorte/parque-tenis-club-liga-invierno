import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCategoryBySlug, getCategoriesForTournament } from "@/lib/data/categories"
import { getActiveTournament } from "@/lib/data/tournaments"
import { getTeamsByCategory } from "@/lib/data/teams"
import { getStandingsSnapshot } from "@/lib/data/standings"
import { getRoundsWithSeries } from "@/lib/data/series"
import { TournamentHeader } from "@/components/liga/TournamentHeader"
import { StandingsTable } from "@/components/liga/StandingsTable"
import { FixtureList } from "@/components/liga/FixtureList"
import { TeamCard } from "@/components/liga/TeamCard"
import { CategoryTabs } from "@/components/liga/CategoryTabs"

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

  const [tournament, categories, teams, standings, rounds] = await Promise.all([
    getActiveTournament(),
    getCategoriesForTournament(category.tournament_id),
    getTeamsByCategory(category.id),
    getStandingsSnapshot(category.id),
    getRoundsWithSeries(category.id),
  ])

  const series = rounds.flatMap((r) =>
    r.series.map((s) => ({ ...s, round: r })),
  )

  return (
    <div>
      {tournament && <TournamentHeader tournament={tournament} />}
      <CategoryTabs categories={categories} />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>

        <section>
          <h3 className="font-semibold text-gray-800 mb-3">Tabla de posiciones</h3>
          <StandingsTable standings={standings} />
        </section>

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
