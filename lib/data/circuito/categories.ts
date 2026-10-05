import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { CIRCUITO_FIXED_CATEGORIES, categorySlug } from "@/lib/circuito/fixedCategories"
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

// Agrega una categoría que no está entre las 14 fijas (o que falta en esa
// edición) a una edición ya creada. Va al final de la lista.
export async function addCategoryToEdition(input: {
  editionId: string
  name: string
  type: "single" | "dobles"
}): Promise<CircuitoCategoryRow> {
  const name = input.name.trim().replace(/\s+/g, " ")
  const slug = categorySlug(name, input.type)
  if (!slug) throw new Error("Escribí el nombre de la categoría.")

  const supabase = createAdminClient()
  const { data: existing, error: readError } = await supabase
    .from("circuito_categories")
    .select("slug, sort_order")
    .eq("edition_id", input.editionId)
  if (readError) throw new Error(`Error al leer las categorías: ${readError.message}`)
  if ((existing ?? []).some((c) => c.slug === slug)) {
    throw new Error("Esa categoría ya existe en este torneo.")
  }

  const sortOrder = Math.max(-1, ...(existing ?? []).map((c) => c.sort_order)) + 1
  const { data, error } = await supabase
    .from("circuito_categories")
    .insert({ edition_id: input.editionId, name, slug, type: input.type, sort_order: sortOrder })
    .select("*")
    .single()
  if (error || !data) throw new Error(`Error al crear la categoría: ${error?.message ?? "sin datos"}`)
  return data
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
