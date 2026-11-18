// Categorías del Final Master (definidas por el organizador, 2026-11-18).
// `rankingSlug` es la categoría del circuito mensual de la que sale el
// ranking anual (lib/circuito/fixedCategories.ts) y también el slug de la
// categoría del Final Master (mid_master_categories.slug), así la relación
// es directa.
export interface FinalMasterCategoryDef {
  name: string
  rankingSlug: string
  type: "single" | "double"
}

export const FINAL_MASTER_CATEGORIES: FinalMasterCategoryDef[] = [
  { name: "Single Caballeros Primera", rankingSlug: "caballeros-primera-single", type: "single" },
  { name: "Single Caballeros Intermedia", rankingSlug: "caballeros-intermedia-single", type: "single" },
  { name: "Single Caballeros Segunda", rankingSlug: "caballeros-segunda-single", type: "single" },
  { name: "Single Caballeros Tercera", rankingSlug: "caballeros-tercera-single", type: "single" },
  { name: "Single Caballeros +50", rankingSlug: "caballeros-mas50-single", type: "single" },
  { name: "Single Damas Segunda", rankingSlug: "damas-segunda-single", type: "single" },
  { name: "Doble Caballeros Primera", rankingSlug: "caballeros-primera-dobles", type: "double" },
  { name: "Doble Caballeros Segunda", rankingSlug: "caballeros-segunda-dobles", type: "double" },
  { name: "Doble Damas Segunda", rankingSlug: "damas-segunda-dobles", type: "double" },
  { name: "Doble Mixto Intermedia", rankingSlug: "mixto-intermedia-dobles", type: "double" },
]

// Las ediciones del Final Master viven en mid_master_editions (mismo formato
// que el Mid Master, ADR-004) y se distinguen por el slug.
export const FINAL_MASTER_SLUG_PREFIX = "final-master-"

export function finalMasterSlug(year: number): string {
  return `${FINAL_MASTER_SLUG_PREFIX}${year}`
}

export function isFinalMasterSlug(slug: string): boolean {
  return slug.startsWith(FINAL_MASTER_SLUG_PREFIX)
}
