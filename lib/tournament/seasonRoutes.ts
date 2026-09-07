// Construcción de URLs de Liga Invierno/Verano con scope de temporada
// (Sprint L2; ruta base renombrada de /liga-invierno a /ligas-invierno-verano
// para reflejar que cubre ambas ligas).

export const LIGAS_BASE = "/ligas-invierno-verano";

export function seasonHref(seasonSlug: string): string {
  return `${LIGAS_BASE}/${seasonSlug}`;
}

export function categoryHref(seasonSlug: string, categorySlug: string): string {
  return `${LIGAS_BASE}/${seasonSlug}/categorias/${categorySlug}`;
}

export function teamHref(seasonSlug: string, categorySlug: string, teamSlug: string): string {
  return `${LIGAS_BASE}/${seasonSlug}/equipos/${categorySlug}/${teamSlug}`;
}
