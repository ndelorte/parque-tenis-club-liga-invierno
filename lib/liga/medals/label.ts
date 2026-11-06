import { seasonFromSlug } from "@/components/liga/season-theme"
import type { MedalPlace, MedalView } from "./types"

type CategoryRef = { name?: string | null; slug?: string | null }
type MedalLabelInput = Pick<MedalView, "place" | "tournamentSlug" | "season"> & {
  categoryName?: string | null
  categorySlug?: string | null
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
}

// Las categorías de Damas llevan el texto en femenino plural ("Campeonas").
export function isDamasCategory(category: CategoryRef): boolean {
  return [category.slug, category.name].some((v) => !!v && normalize(v).startsWith("damas"))
}

export function medalPlaceText(place: MedalPlace, damas: boolean): string {
  if (place === 1) return damas ? "Campeonas" : "Campeón"
  if (place === 2) return damas ? "Subcampeonas" : "Subcampeón"
  return "3° puesto"
}

// Verano 2025 (arranca a fin de 2025) → "2025/26". Invierno 2025 → "2025".
export function medalSeasonLabel(tournamentSlug: string, season: number): string {
  const kind = seasonFromSlug(tournamentSlug)
  const name = kind === "verano" ? "Verano" : kind === "invierno" ? "Invierno" : null
  const year = kind === "verano" ? `${season}/${String(season + 1).slice(-2)}` : String(season)
  return name ? `${name} ${year}` : year
}

// Ej.: "Subcampeonas Verano 2025/26", "Campeón Invierno 2025".
export function medalDescription(medal: MedalLabelInput): string {
  const damas = isDamasCategory({ name: medal.categoryName, slug: medal.categorySlug })
  return `${medalPlaceText(medal.place, damas)} ${medalSeasonLabel(medal.tournamentSlug, medal.season)}`
}
