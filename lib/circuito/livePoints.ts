// Puntos "en vivo" del Circuito del Parque (excepción: China Open y Paris Open 2026).
//
// Regla normal (reglas-circuito-del-parque.md): un jugador suma los puntos de
// su instancia cuando queda eliminado (o sale campeón). En las ediciones de
// LIVE_POINTS_EDITION_SLUGS, durante TODO el torneo, se suma también al ganar:
// cada jugador muestra los puntos que ya tiene asegurados por la ronda a la
// que llegó (ver `live` en calculateRankingPoints.ts).
//
// La lista de slugs es explícita (no se usa `status` de circuito_editions porque
// no se actualiza solo). No hay fecha de corte ni hace falta revertir nada: el piso "asegurado" nunca
// supera la instancia final, así que al terminar el torneo el modo en vivo y la
// regla normal dan exactamente los mismos puntos. Las demás ediciones (incluidas
// las próximas) siguen con la regla normal.
//
// Para aplicar el modo en vivo a los partidos ya cargados, correr
// `npm run recalc:ranking-en-vivo -- --apply` (scripts/recalc-ranking-en-vivo.ts).

export const LIVE_POINTS_EDITION_SLUGS: readonly string[] = ["circuito-2026-10", "circuito-2026-11"]

export function isLivePointsEdition(editionSlug: string | null | undefined): boolean {
  return !!editionSlug && LIVE_POINTS_EDITION_SLUGS.includes(editionSlug)
}
