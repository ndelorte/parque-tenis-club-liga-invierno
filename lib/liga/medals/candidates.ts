import type { NameMatch } from "@/lib/players/similarNames"
import { matchTeamName } from "./teamNameMatch"
import { editionOrder } from "./sort"
import type { MedalPlace } from "./types"

// Una fila del podio histórico (categoría de una edición finalizada).
export interface PodiumEntry {
  categoryId: string
  categoryName: string
  categorySlug: string
  tournamentName: string
  tournamentSlug: string
  season: number
  place: MedalPlace
  // Nombre del equipo tal como figura en esa edición.
  historicName: string
}

export interface MedalCandidate extends PodiumEntry {
  // null: el nombre no se parece al del equipo inscripto.
  match: NameMatch | null
}

export function candidateKey(entry: Pick<PodiumEntry, "categoryId" | "place">): string {
  return `${entry.categoryId}:${entry.place}`
}

// Todas las filas del podio, con su coincidencia de nombre. Primero las que
// coinciden ("same" antes que "similar"), después el resto; dentro de cada
// grupo, la edición más reciente primero.
export function buildMedalCandidates(entries: readonly PodiumEntry[], teamName: string): MedalCandidate[] {
  const rank = (m: NameMatch | null) => (m === "same" ? 0 : m === "similar" ? 1 : 2)
  return entries
    .map((e): MedalCandidate => ({ ...e, match: matchTeamName(teamName, e.historicName) }))
    .sort(
      (a, b) =>
        rank(a.match) - rank(b.match) ||
        editionOrder(b.tournamentSlug, b.season) - editionOrder(a.tournamentSlug, a.season) ||
        a.categoryName.localeCompare(b.categoryName, "es") ||
        a.place - b.place,
    )
}

// Se tildan solas las coincidencias exactas; las parecidas las decide el admin.
// Si dos filas "same" caen en la misma categoría (no debería pasar), se tilda
// solo la primera: la base permite una medalla por equipo y categoría de origen.
export function preselectedKeys(candidates: readonly MedalCandidate[]): string[] {
  const seenCategories = new Set<string>()
  const keys: string[] = []
  for (const c of candidates) {
    if (c.match !== "same" || seenCategories.has(c.categoryId)) continue
    seenCategories.add(c.categoryId)
    keys.push(candidateKey(c))
  }
  return keys
}
