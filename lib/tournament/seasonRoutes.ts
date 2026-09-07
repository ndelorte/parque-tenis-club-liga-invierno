// Construcción de URLs de Liga de Invierno con scope de temporada (Sprint L2).

export function seasonHref(seasonSlug: string): string {
  return `/liga-invierno/${seasonSlug}`;
}

export function categoryHref(seasonSlug: string, categorySlug: string): string {
  return `/liga-invierno/${seasonSlug}/categorias/${categorySlug}`;
}

export function teamHref(seasonSlug: string, categorySlug: string, teamSlug: string): string {
  return `/liga-invierno/${seasonSlug}/equipos/${categorySlug}/${teamSlug}`;
}
