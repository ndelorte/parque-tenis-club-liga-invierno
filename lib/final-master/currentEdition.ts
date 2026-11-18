import { FINAL_MASTER_SLUG_PREFIX } from "./categories"

interface EditionLike {
  slug: string
  year: number
  status: string
}

// Edición "vigente" del Final Master (lógica pura):
//  1. con override (FINAL_MASTER_YEAR), la de ese año (o null);
//  2. si no, la más reciente que no esté `finished` y cuyo año sea >= año AR - 1
//     (así en enero el panel sigue mostrando el Final Master del año que
//     terminó, mientras no se marque como terminado);
//  3. si no hay, la del año AR (puede ser null).
export function pickCurrentFinalMasterEdition<T extends EditionLike>(
  editions: T[],
  options: { override: number | null; arYear: number },
): T | null {
  const finalMasters = editions.filter((e) => e.slug.startsWith(FINAL_MASTER_SLUG_PREFIX))
  if (options.override !== null) return finalMasters.find((e) => e.year === options.override) ?? null
  const open = finalMasters
    .filter((e) => e.status !== "finished" && e.year >= options.arYear - 1)
    .sort((a, b) => b.year - a.year)
  if (open.length > 0) return open[0]
  return finalMasters.find((e) => e.year === options.arYear) ?? null
}
