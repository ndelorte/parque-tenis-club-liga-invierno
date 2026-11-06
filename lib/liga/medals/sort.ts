import { seasonFromSlug } from "@/components/liga/season-theme"
import type { MedalView } from "./types"

// Orden cronológico de una edición. `tournaments.season` es el año en que
// arranca. El Invierno se juega a mitad de año (Invierno 2025 ≈ 2025,5) y el
// Verano arranca a fin de año y termina el siguiente (Verano 2025/26 ≈
// 2025,9). Entonces, del más nuevo al más viejo:
//   Invierno 2026 > Verano 2025/26 > Invierno 2025 > Verano 2024/25
// Una edición de temporada desconocida cuenta como el año pelado.
export function editionOrder(tournamentSlug: string, season: number): number {
  const kind = seasonFromSlug(tournamentSlug)
  if (kind === "verano") return season + 0.9
  if (kind === "invierno") return season + 0.5
  return season
}

// Más reciente primero. Desempate estable: mejor puesto, después categoría.
export function sortMedalsRecentFirst<T extends MedalView>(medals: readonly T[]): T[] {
  return [...medals].sort(
    (a, b) =>
      editionOrder(b.tournamentSlug, b.season) - editionOrder(a.tournamentSlug, a.season) ||
      a.place - b.place ||
      a.categoryName.localeCompare(b.categoryName, "es"),
  )
}
