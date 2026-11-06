import { getAllTournaments } from "@/lib/data/tournaments"
import { getCategoriesForTournament } from "@/lib/data/categories"
import { getPodiumForCategory } from "@/lib/data/playoffs"
import type { PodiumEntry } from "@/lib/liga/medals/candidates"

// Todos los podios (1°, 2° y 3°) de todas las categorías de las ediciones
// finalizadas, Verano e Invierno. `getPodiumForCategory` prioriza las series
// reales (final / 3er puesto) y cae a los campos `manual_*` de las ediciones
// históricas. Es una lectura pesada (varias consultas por categoría): solo se
// usa desde el panel, nunca en páginas públicas.
export async function listHistoricalPodiums(): Promise<PodiumEntry[]> {
  const finished = (await getAllTournaments()).filter((t) => t.status === "finished")
  const perTournament = await Promise.all(
    finished.map(async (tournament) => {
      const categories = await getCategoriesForTournament(tournament.id)
      const perCategory = await Promise.all(
        categories.map(async (category): Promise<PodiumEntry[]> => {
          const podium = await getPodiumForCategory(category.id)
          const base = {
            categoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug,
            tournamentName: tournament.name,
            tournamentSlug: tournament.slug,
            season: tournament.season,
          }
          const places: Array<[1 | 2 | 3, string | null]> = [
            [1, podium.championName],
            [2, podium.runnerUpName],
            [3, podium.thirdPlaceName],
          ]
          return places.flatMap(([place, name]) => (name?.trim() ? [{ ...base, place, historicName: name.trim() }] : []))
        }),
      )
      return perCategory.flat()
    }),
  )
  return perTournament.flat()
}
