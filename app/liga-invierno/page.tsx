import { LigaHeader } from "@/components/liga/liga-header"
import { LigaBoard } from "@/components/liga/liga-board"
import { LigaReglamento } from "@/components/liga/liga-reglamento"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { getActiveTournament } from "@/lib/data/tournaments"
import { getCategoriesForTournament } from "@/lib/data/categories"
import { getTeamsByCategory } from "@/lib/data/teams"
import { getStandingsSnapshot } from "@/lib/data/standings"
import { getRoundsWithSeries } from "@/lib/data/series"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Liga de Invierno 2026 | Parque Tenis Club",
  description:
    "Torneo por equipos de dobles. Posiciones, fixture, resultados y equipos de las categorías Caballeros, Damas y Mixto.",
}

export default async function LigaInviernoPage() {
  const tournament = await getActiveTournament()
  const categories = tournament ? await getCategoriesForTournament(tournament.id) : []

  const bundles = await Promise.all(
    categories.map(async (category) => {
      const [standings, rounds, teams] = await Promise.all([
        getStandingsSnapshot(category.id),
        getRoundsWithSeries(category.id),
        getTeamsByCategory(category.id),
      ])
      return { category, standings, rounds, teams }
    }),
  )

  return (
    <main className="min-h-dvh bg-background">
      <LigaHeader />
      <LigaBoard bundles={bundles} />
      <LigaReglamento />
      <WhatsappFab />
    </main>
  )
}
