import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { deriveEditionStatus, statusForMonth } from "@/lib/circuito/editionStatus"
import type { CategoryStatusMatch } from "@/lib/circuito/categoryStatus"
import type { CircuitoEditionRow } from "./types"
import { createFixedCategoriesForEdition } from "./categories"

const PAGE = 1000

// Pisa el status guardado con el que sale de los resultados cargados (ver
// deriveEditionStatus). Si una edición no tiene cuadros, queda el guardado.
async function withDerivedStatus(editions: CircuitoEditionRow[]): Promise<CircuitoEditionRow[]> {
  if (editions.length === 0) return editions
  const supabase = await createClient()

  const { data: categoryRows } = await supabase
    .from("circuito_categories")
    .select("id, edition_id, draw_size")
    .in("edition_id", editions.map((e) => e.id))
  const categories = categoryRows as { id: string; edition_id: string; draw_size: number | null }[] | null
  if (!categories || categories.length === 0) return editions

  const matchesByCategory = new Map<string, CategoryStatusMatch[]>()
  const ids = categories.map((c) => c.id)
  for (let i = 0; i < ids.length; i += 40) {
    const chunk = ids.slice(i, i + 40)
    for (let from = 0; ; from += PAGE) {
      const { data: matchRows } = await supabase
        .from("circuito_matches")
        .select("category_id, bracket, round_number, zone, participant_a_id, participant_b_id, winner_id, score")
        .in("category_id", chunk)
        .order("id")
        .range(from, from + PAGE - 1)
      const data = matchRows as (CategoryStatusMatch & { category_id: string })[] | null
      if (!data) return editions
      for (const m of data) {
        const list = matchesByCategory.get(m.category_id) ?? []
        list.push(m)
        matchesByCategory.set(m.category_id, list)
      }
      if (data.length < PAGE) break
    }
  }

  return editions.map((e) => {
    const derived = deriveEditionStatus(
      categories
        .filter((c) => c.edition_id === e.id)
        .map((c) => ({ drawSize: c.draw_size, matches: matchesByCategory.get(c.id) ?? [] })),
    )
    return derived ? { ...e, status: derived } : e
  })
}

export async function getCircuitoEditions(): Promise<CircuitoEditionRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_editions")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })

  if (error || !data) return []
  return withDerivedStatus(data)
}

export async function getCircuitoEditionBySlug(slug: string): Promise<CircuitoEditionRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_editions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error || !data) return null
  return (await withDerivedStatus([data]))[0]
}

export async function createCircuitoEdition(input: {
  slug: string
  name: string
  month: number
  year: number
}): Promise<CircuitoEditionRow> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("circuito_editions")
    .insert({
      slug: input.slug,
      name: input.name,
      month: input.month,
      year: input.year,
      status: statusForMonth(input.year, input.month),
    })
    .select("*")
    .single()

  if (error || !data) throw new Error(`Error al crear la edición: ${error?.message ?? "sin datos"}`)

  await createFixedCategoriesForEdition(data.id)
  return data
}
