// 14 categorías fijas del Circuito del Parque (reglas-circuito-del-parque.md,
// respuesta a OQ-23). Dato puro (sin acceso a Supabase) para que lo puedan
// importar tanto componentes de servidor como de cliente — lib/data/circuito
// arrastra lib/supabase/server (next/headers), que rompe en componentes
// cliente.
export const CIRCUITO_FIXED_CATEGORIES: Array<{ name: string; slug: string; type: "single" | "dobles" }> = [
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

// Slug de una categoría agregada a mano: "Caballeros +50" + dobles →
// "caballeros-mas50-dobles" (mismo criterio que las 14 fijas).
export function categorySlug(name: string, type: "single" | "dobles"): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\+/g, "mas")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base ? `${base}-${type}` : ""
}

export interface RankedCategory {
  name: string
  slug: string
  type: "single" | "dobles"
}

// Categorías que tienen jugadores con puntos, en el orden de siempre (primero
// las 14 fijas) y, a continuación, las que se agregaron a mano a algún torneo
// (por tipo y nombre) — así una categoría nueva aparece en el ranking apenas
// suma puntos.
export function orderRankedCategories(found: RankedCategory[]): RankedCategory[] {
  const bySlug = new Map(found.map((c) => [c.slug, c]))
  const fixed = CIRCUITO_FIXED_CATEGORIES.filter((c) => bySlug.has(c.slug)).map((c) => bySlug.get(c.slug)!)
  const fixedSlugs = new Set(CIRCUITO_FIXED_CATEGORIES.map((c) => c.slug))
  const extra = found
    .filter((c) => !fixedSlugs.has(c.slug))
    .sort((a, b) => (a.type === b.type ? 0 : a.type === "single" ? -1 : 1) || a.name.localeCompare(b.name, "es"))
  return [...fixed, ...extra]
}
