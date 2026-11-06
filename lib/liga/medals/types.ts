// Medallas de podio por equipo (Fase V2). Tipos serializables: viajan del
// servidor a los componentes cliente tal cual.

export type MedalPlace = 1 | 2 | 3

export function isMedalPlace(value: unknown): value is MedalPlace {
  return value === 1 || value === 2 || value === 3
}

// Lo mínimo para armar la descripción de una medalla. El texto NO se guarda
// en la base: se calcula con estos datos (ver label.ts), así las reglas de
// redacción viven en un solo lugar.
export interface MedalView {
  place: MedalPlace
  categoryName: string
  categorySlug: string
  tournamentSlug: string
  // Año de inicio de la edición (`tournaments.season`).
  season: number
}
