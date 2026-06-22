import { LigaHeader } from "@/components/liga/liga-header"
import { LigaBoard } from "@/components/liga/liga-board"
import { LigaReglamento } from "@/components/liga/liga-reglamento"
import { SponsorsBanner } from "@/components/liga/sponsors-banner"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { getActiveTournament } from "@/lib/data/tournaments"
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

export const metadata = {
  title: "Liga de Invierno 2026 | Parque Tenis Club",
  description:
    "Torneo por equipos de dobles. Posiciones, fixture, resultados y equipos de las categorÃ­as Caballeros, Damas y Mixto.",
}

interface Props {
  searchParams: Promise<{ categoria?: string }>
}

export default async function LigaInviernoPage({ searchParams }: Props) {
  const { categoria } = await searchParams
  const tournament = await getActiveTournament()
  const categories = tournament ? await getCategoriesForTournament(tournament.id) : []

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
        if (effectiveStandings.length >= 6) {
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
      <LigaHeader />
      <SponsorsBanner />
      <LigaBoard bundles={bundles} initialCategory={categoria} />
      <LigaReglamento />
      <WhatsappFab />
    </main>
  )
}
