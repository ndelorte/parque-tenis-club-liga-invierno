// Regla de WO de cancha (reglas-liga-invierno.md, decisión del organizador
// 06/11/2026): el WO de cancha es siempre la cancha 3; se juegan la 1 y la 2.
export const COURT_WALKOVER_ALLOWED_COURT = 3

export function canMarkCourtWalkover(courtNumber: number): boolean {
  return courtNumber === COURT_WALKOVER_ALLOWED_COURT
}

// Devuelve un mensaje de error si alguna cancha tiene WO fuera de la cancha 3,
// o null si todo está bien.
export function validateCourtWalkovers(
  courts: ReadonlyArray<{ courtNumber: number; isWalkover: boolean }>,
): string | null {
  const invalid = courts.filter((c) => c.isWalkover && !canMarkCourtWalkover(c.courtNumber))
  if (invalid.length === 0) return null
  const list = invalid.map((c) => c.courtNumber).join(" y ")
  return `El WO de cancha solo puede marcarse en la cancha 3 (se intentó en la cancha ${list}). Si falta pareja en más canchas, cargá WO general.`
}
