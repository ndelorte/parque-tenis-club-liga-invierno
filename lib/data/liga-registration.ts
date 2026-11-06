import { getTournamentBySlug } from "@/lib/data/tournaments"
import { getCategoriesForTournament } from "@/lib/data/categories"
import { getRegistrationAvailability, type RegistrationAvailability } from "@/lib/liga/registration/availability"
import type { Category, Tournament } from "@/lib/tournament/types"

export interface RegistrationPageData {
  tournament: Tournament
  categories: Pick<Category, "id" | "name" | "slug">[]
  availability: RegistrationAvailability
}

// Datos públicos del formulario de inscripción. No incluye nada sensible.
export async function getRegistrationPageData(slug: string): Promise<RegistrationPageData | null> {
  const tournament = await getTournamentBySlug(slug)
  if (!tournament) return null
  const availability = getRegistrationAvailability(tournament)
  const categories = availability.open
    ? (await getCategoriesForTournament(tournament.id)).map(({ id, name, slug }) => ({ id, name, slug }))
    : []
  return { tournament, categories, availability }
}
