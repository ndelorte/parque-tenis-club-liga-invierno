import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getCategoryBySlugForTournament, getCategoriesForTournament } from "@/lib/data/categories"
import { getTournamentBySlug } from "@/lib/data/tournaments"
import { getTeamsByCategory } from "@/lib/data/teams"
import { getStandingsSnapshot } from "@/lib/data/standings"
import { getRoundsWithSeries } from "@/lib/data/series"
import { getPlayoffSeries, getChampionForCategory } from "@/lib/data/playoffs"
import { SectionHero } from "@/components/liga/SectionHero"
import { StandingsTable } from "@/components/liga/StandingsTable"
import { FixtureList } from "@/components/liga/FixtureList"
import { TeamCard } from "@/components/liga/TeamCard"
import { CategoryTabs } from "@/components/liga/CategoryTabs"
import { PlayoffBracket } from "@/components/liga/PlayoffBracket"
import { ChampionBanner } from "@/components/liga/ChampionBanner"
import { buildBracketOrNull } from "@/lib/playoffs/generateProvisionalBracket"
import { formatTournamentTitle } from "@/lib/tournament/formatTournamentTitle"
import { getSeasonTheme } from "@/components/liga/season-theme"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ season: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season, slug } = await params
  const tournament = await getTournamentBySlug(season)
  if (!tournament) return {}
  const category = await getCategoryBySlugForTournament(tournament.id, slug)
  if (!category) return {}
  return {
    title: `${category.name} | ${formatTournamentTitle(tournament)} | Parque Tenis Club`,
    description: `Tabla de posiciones, fixture y equipos de la categoría ${category.name}.`,
  }
}

export default async function CategoriaPage({ params }: Props) {
  const { season, slug } = await params

  const tournament = await getTournamentBySlug(season)
  if (!tournament) notFound()

  const category = await getCategoryBySlugForTournament(tournament.id, slug)
  if (!category) notFound()

  if (tournament.status === "finished") {
    const [categories, teams, standings, playoffSeries, champion] = await Promise.all([
      getCategoriesForTournament(tournament.id),
      getTeamsByCategory(category.id),
      getStandingsSnapshot(category.id),
      getPlayoffSeries(category.id),
      getChampionForCategory(category.id),
    ])
    const bracket = buildBracketOrNull(standings, playoffSeries)
    const semifinalMatches = playoffSeries.filter((s) => s.phase === "semifinal").map((s) => ({
      homeTeamName: teams.find((t) => t.id === s.home_team_id)?.name ?? "A definir",
      awayTeamName: teams.find((t) => t.id === s.away_team_id)?.name ?? "A definir",
      scheduledDate: s.scheduled_date,
      scheduledTime: s.scheduled_time,
      status: s.status,
    }))
    const finalSeries = playoffSeries.find((s) => s.phase === "final")
    const finalMatch = finalSeries ? {
      homeTeamName: teams.find((t) => t.id === finalSeries.home_team_id)?.name ?? "A definir",
      awayTeamName: teams.find((t) => t.id === finalSeries.away_team_id)?.name ?? "A definir",
      scheduledDate: finalSeries.scheduled_date,
      scheduledTime: finalSeries.scheduled_time,
      status: finalSeries.status,
    } : undefined

    return (
      <main data-identity={getSeasonTheme(tournament).identity}>
        <SectionHero tournament={tournament} />
        <CategoryTabs categories={categories} seasonSlug={tournament.slug} />

        <div className="max-w-6xl mx-auto space-y-8 px-4 py-8 sm:px-6">
          <div className="border-b border-border pb-5"><p className="text-xs font-bold uppercase tracking-widest text-primary">Categoría · Tabla final</p><h2 className="font-heading text-3xl font-extrabold text-balance text-foreground sm:text-4xl">{category.name}</h2></div>
          <ChampionBanner champion={champion} />
          <section>
            <h3 className="mb-3 font-heading text-2xl font-bold text-foreground">Tabla final</h3>
            <StandingsTable standings={standings} />
          </section>
          {bracket && (
            <section>
              <PlayoffBracket bracket={bracket} semifinals={semifinalMatches} final={finalMatch} provisional={false} />
            </section>
          )}
        </div>
      </main>
    )
  }

  const [categories, teams, standings, rounds, playoffSeries] = await Promise.all([
    getCategoriesForTournament(tournament.id),
    getTeamsByCategory(category.id),
    getStandingsSnapshot(category.id),
    getRoundsWithSeries(category.id),
    getPlayoffSeries(category.id),
  ])

  const series = rounds
    .filter((r) => r.phase === "regular")
    .flatMap((r) => r.series.map((s) => ({ ...s, round: r })))

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

  // Usar standings solo si hay tantos como equipos activos (igual que el panel admin).
  // Si hay menos entradas que equipos activos, usar equipos en orden alfabético como provisional.
  const bracketStandings =
    standings.length >= teams.length
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

  const bracket = buildBracketOrNull(
    bracketStandings,
    playoffSeries.filter((s) => s.phase === "quarterfinal"),
  )

  const thirdPlaceSeries = playoffSeries.find((s) => s.phase === "third_place")
  const thirdPlace = thirdPlaceSeries
    ? {
        homeTeamName: teams.find((t) => t.id === thirdPlaceSeries.home_team_id)?.name ?? "Equipo",
        awayTeamName: teams.find((t) => t.id === thirdPlaceSeries.away_team_id)?.name ?? "Equipo",
        scheduledDate: thirdPlaceSeries.scheduled_date,
        scheduledTime: thirdPlaceSeries.scheduled_time,
        status: thirdPlaceSeries.status,
      }
    : undefined

  const semifinalMatches = playoffSeries
    .filter((s) => s.phase === "semifinal")
    .map((s) => ({
      homeTeamName: teams.find((t) => t.id === s.home_team_id)?.name ?? "A definir",
      awayTeamName: teams.find((t) => t.id === s.away_team_id)?.name ?? "A definir",
      scheduledDate: s.scheduled_date ?? null,
      scheduledTime: s.scheduled_time ?? null,
      status: s.status,
    }))

  const finalSeries = playoffSeries.find((s) => s.phase === "final")
  const finalMatch = finalSeries
    ? {
        homeTeamName: teams.find((t) => t.id === finalSeries.home_team_id)?.name ?? "A definir",
        awayTeamName: teams.find((t) => t.id === finalSeries.away_team_id)?.name ?? "A definir",
        scheduledDate: finalSeries.scheduled_date ?? null,
        scheduledTime: finalSeries.scheduled_time ?? null,
        status: finalSeries.status,
      }
    : undefined

  return (
    <main data-identity={getSeasonTheme(tournament).identity}>
      <SectionHero tournament={tournament} />
      <CategoryTabs categories={categories} seasonSlug={tournament.slug} />

      <div className="max-w-6xl mx-auto space-y-10 px-4 py-8 sm:px-6">
        <div className="border-b border-border pb-5"><p className="text-xs font-bold uppercase tracking-widest text-primary">Categoría · En juego</p><h2 className="font-heading text-3xl font-extrabold text-balance text-foreground sm:text-4xl">{category.name}</h2></div>

        <section>
          <h3 className="mb-3 font-heading text-2xl font-bold text-foreground">Tabla de posiciones</h3>
          <StandingsTable standings={effectiveStandings} />
        </section>

        {bracket && (
          <section>
            <PlayoffBracket
            bracket={bracket}
            semifinals={semifinalMatches.length > 0 ? semifinalMatches : undefined}
            final={finalMatch}
            thirdPlace={thirdPlace}
          />
          </section>
        )}

        <section>
          <FixtureList series={series} />
        </section>

        {teams.length > 0 && (
          <section>
            <h3 className="mb-3 font-heading text-2xl font-bold text-foreground">Equipos</h3>
            <div className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
              {teams.map((team) => (
                <TeamCard key={team.id} team={team} categorySlug={slug} seasonSlug={tournament.slug} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
