import { isMedalPlace, type MedalView } from "./types"
import { sortMedalsRecentFirst } from "./sort"

// Fila de `team_medals` con su categoría y torneo de origen (join de Supabase).
// PostgREST devuelve cada relación como objeto, pero por tipado laxo a veces
// llega como arreglo: se acepta cualquiera de las dos formas.
type One<T> = T | T[] | null
export interface TeamMedalRow {
  team_id: string
  place: number
  categories: One<{
    name: string
    slug: string
    tournaments: One<{ slug: string; season: number }>
  }>
}

function first<T>(value: One<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value
}

// Agrupa por equipo y ordena de la más reciente a la más vieja. Descarta
// filas incompletas (categoría o torneo borrados, puesto inválido).
export function groupMedalsByTeam(rows: readonly TeamMedalRow[]): Record<string, MedalView[]> {
  const byTeam: Record<string, MedalView[]> = {}
  for (const row of rows) {
    const category = first(row.categories)
    const tournament = category ? first(category.tournaments) : null
    if (!category || !tournament || !isMedalPlace(row.place)) continue
    ;(byTeam[row.team_id] ??= []).push({
      place: row.place,
      categoryName: category.name,
      categorySlug: category.slug,
      tournamentSlug: tournament.slug,
      season: tournament.season,
    })
  }
  for (const id of Object.keys(byTeam)) byTeam[id] = sortMedalsRecentFirst(byTeam[id])
  return byTeam
}
