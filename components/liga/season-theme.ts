// Estación de una edición de la Liga, leída del slug (liga-invierno-AAAA /
// liga-verano-AAAA-AAAA) — plan-refactor-visual.md §4.4. Es presentación, no
// una regla deportiva: si el slug no se reconoce, aspecto neutro.
export type Season = "invierno" | "verano" | "neutro"

export function seasonFromSlug(slug: string): Season {
  if (slug.startsWith("liga-invierno")) return "invierno"
  if (slug.startsWith("liga-verano")) return "verano"
  return "neutro"
}
