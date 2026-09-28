import { SeasonSelector } from "@/components/liga/SeasonSelector"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { getAllTournaments } from "@/lib/data/tournaments"
import { getCategoriesForTournament } from "@/lib/data/categories"
import { getPodiumForCategory } from "@/lib/data/playoffs"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Ligas de Invierno y Verano | Parque Tenis Club",
  description: "Elegí una temporada de la Liga de Invierno o Verano: tabla, fixture y equipos.",
}

// Resumen simple para "Campeones: ..." en la tarjeta de una edición finalizada
// del selector. Es presentación (armado de un string para la lista), no una
// regla deportiva ni lógica de torneo: se resuelve acá y no en /lib.
function summarizeChampions(names: (string | null)[]): string | null {
  const unique = Array.from(new Set(names.filter((name): name is string => Boolean(name))))
  if (unique.length === 0) return null
  if (unique.length <= 3) {
    if (unique.length === 1) return `Campeones: ${unique[0]}`
    return `Campeones: ${unique.slice(0, -1).join(", ")} y ${unique[unique.length - 1]}`
  }
  const shown = unique.slice(0, 3)
  const rest = unique.length - shown.length
  return `Campeones: ${shown.join(", ")} y ${rest} más`
}

export default async function LigaInviernoSelectorPage() {
  const tournaments = await getAllTournaments()
  const finished = tournaments.filter((t) => t.status === "finished")

  const summaries = await Promise.all(
    finished.map(async (tournament) => {
      const categories = await getCategoriesForTournament(tournament.id)
      const podiums = await Promise.all(categories.map((category) => getPodiumForCategory(category.id)))
      return [tournament.id, summarizeChampions(podiums.map((p) => p.championName))] as const
    }),
  )
  const championsByTournamentId = Object.fromEntries(
    summaries.filter((entry): entry is [string, string] => entry[1] !== null),
  )

  return (
    <main className="min-h-dvh bg-background">
      <SeasonSelector tournaments={tournaments} championsByTournamentId={championsByTournamentId} />
      <WhatsappFab />
    </main>
  )
}
