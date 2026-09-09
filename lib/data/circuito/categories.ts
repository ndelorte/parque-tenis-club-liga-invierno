import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/circuito/fixedCategories"
import type { CircuitoCategoryRow } from "./types"

// Re-exportado para no romper imports existentes — el dato en sí vive en
// lib/circuito/fixedCategories.ts (sin dependencias de servidor, así lo
// pueden usar también componentes de cliente).
export { CIRCUITO_FIXED_CATEGORIES }

export async function createFixedCategoriesForEdition(editionId: string): Promise<void> {
  const supabase = createAdminClient()
  const rows = CIRCUITO_FIXED_CATEGORIES.map((c, i) => ({
    edition_id: editionId,
    name: c.name,
    slug: c.slug,
    type: c.type,
    sort_order: i,
  }))
  const { error } = await supabase.from("circuito_categories").insert(rows)
  if (error) throw new Error(`Error al crear las categorías de la edición: ${error.message}`)
}

export async function getCircuitoCategoriesForEdition(editionId: string): Promise<CircuitoCategoryRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_categories")
    .select("*")
    .eq("edition_id", editionId)
    .order("sort_order")

  if (error || !data) return []
  return data
}

export async function getCircuitoCategoryBySlug(
  editionId: string,
  slug: string,
): Promise<CircuitoCategoryRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_categories")
    .select("*")
    .eq("edition_id", editionId)
    .eq("slug", slug)
    .maybeSingle()

  if (error || !data) return null
  return data
}
