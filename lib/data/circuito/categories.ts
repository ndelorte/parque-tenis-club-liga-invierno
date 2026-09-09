import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { CircuitoCategoryRow } from "./types"

// 14 categorías fijas del Circuito del Parque (reglas-circuito-del-parque.md,
// respuesta a OQ-23). Se crean automáticamente para cada edición nueva — no
// hay pantalla para tipearlas a mano cada mes.
const FIXED_CATEGORIES: Array<{ name: string; slug: string; type: "single" | "dobles" }> = [
  { name: "Caballeros Primera", slug: "caballeros-primera-single", type: "single" },
  { name: "Caballeros Intermedia", slug: "caballeros-intermedia-single", type: "single" },
  { name: "Caballeros Segunda", slug: "caballeros-segunda-single", type: "single" },
  { name: "Caballeros Tercera", slug: "caballeros-tercera-single", type: "single" },
  { name: "Caballeros +50", slug: "caballeros-mas50-single", type: "single" },
  { name: "Damas Primera", slug: "damas-primera-single", type: "single" },
  { name: "Damas Segunda", slug: "damas-segunda-single", type: "single" },
  { name: "Caballeros Primera", slug: "caballeros-primera-dobles", type: "dobles" },
  { name: "Caballeros Intermedia", slug: "caballeros-intermedia-dobles", type: "dobles" },
  { name: "Caballeros Segunda", slug: "caballeros-segunda-dobles", type: "dobles" },
  { name: "Damas Primera", slug: "damas-primera-dobles", type: "dobles" },
  { name: "Damas Segunda", slug: "damas-segunda-dobles", type: "dobles" },
  { name: "Mixto Intermedia", slug: "mixto-intermedia-dobles", type: "dobles" },
  { name: "Mixto Segunda", slug: "mixto-segunda-dobles", type: "dobles" },
]

export async function createFixedCategoriesForEdition(editionId: string): Promise<void> {
  const supabase = createAdminClient()
  const rows = FIXED_CATEGORIES.map((c, i) => ({
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
