import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { CircuitoEditionRow } from "./types"
import { createFixedCategoriesForEdition } from "./categories"

export async function getCircuitoEditions(): Promise<CircuitoEditionRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_editions")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false })

  if (error || !data) return []
  return data
}

export async function getCircuitoEditionBySlug(slug: string): Promise<CircuitoEditionRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_editions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error || !data) return null
  return data
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
    .insert({ slug: input.slug, name: input.name, month: input.month, year: input.year, status: "active" })
    .select("*")
    .single()

  if (error || !data) throw new Error(`Error al crear la edición: ${error?.message ?? "sin datos"}`)

  await createFixedCategoriesForEdition(data.id)
  return data
}
