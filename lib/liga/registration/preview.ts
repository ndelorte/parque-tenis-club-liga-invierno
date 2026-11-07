import type { Category, Tournament } from "@/lib/tournament/types"

export const PREVIEW_BRANCH = "feat/liga-verano-inscripcion"
export const PREVIEW_SEASON = "liga-verano-2026-2027"
export const PREVIEW_TOURNAMENT_ID = "preview-liga-verano-2026-2027"

// Solo servidor: nunca se activa en producción, aunque se fusione esta branch.
export function isRegistrationPreview(): boolean {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_REF === PREVIEW_BRANCH
  }
  return process.env.NODE_ENV === "development" && process.env.LIGA_REGISTRATION_PREVIEW === "1"
}

export function getPreviewTournament(): Tournament | null {
  if (!isRegistrationPreview()) return null
  return {
    id: PREVIEW_TOURNAMENT_ID,
    slug: PREVIEW_SEASON,
    name: "Liga de Verano",
    season: 2026,
    status: "active",
    registration_open: true,
    registration_min_players: 6,
    registration_max_players: 12,
  }
}

export function getPreviewCategories(): Category[] {
  return ["Damas A", "Damas B", "Caballeros A", "Caballeros B", "Mixto A", "Mixto B"].map((name, index) => ({
    id: `preview-category-${index}`,
    tournament_id: PREVIEW_TOURNAMENT_ID,
    name,
    slug: name.toLowerCase().replaceAll(" ", "-"),
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    sort_order: index,
  }))
}
