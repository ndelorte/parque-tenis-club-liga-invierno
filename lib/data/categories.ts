import { createClient } from "@/lib/supabase/server"
import type { Category } from "@/lib/tournament/types"
import type { Database } from "@/lib/supabase/types"

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"]

function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    tournament_id: row.tournament_id,
    name: row.name,
    slug: row.slug,
    phase_format: row.phase_format,
    regular_phase_type: row.regular_phase_type,
    teams_count: row.teams_count,
    sort_order: row.sort_order,
    direct_semifinalists_count: row.direct_semifinalists_count ?? undefined,
    quarterfinals_enabled: row.quarterfinals_enabled,
  }
}

export async function getCategoriesForTournament(tournamentId: string): Promise<Category[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("sort_order")

  if (error || !data) return []

  return (data as CategoryRow[]).map(mapCategoryRow)
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) return null

  return mapCategoryRow(data as CategoryRow)
}

/**
 * @deprecated `categories.slug` ya no es único global (multi-temporada permite
 * el mismo slug en 2 torneos). Usar `getCategoryBySlugForTournament`. Se
 * mantiene hasta migrar sus usos en Sprint L2.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error || !data) return null

  return mapCategoryRow(data as CategoryRow)
}

export async function getCategoryBySlugForTournament(
  tournamentId: string,
  slug: string
): Promise<Category | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("tournament_id", tournamentId)
    .eq("slug", slug)
    .single()

  if (error || !data) return null

  return mapCategoryRow(data as CategoryRow)
}
