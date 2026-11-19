// Pareja de dobles con compañero "a confirmar".
export const PARTNER_TBD_LABEL = "A confirmar"

/** Aviso cuando hay parejas sin compañero (bloquea armar los cuadros). */
export const PENDING_PARTNER_MESSAGE =
  "Hay parejas con compañero a confirmar: elegí el compañero antes de armar los cuadros (el orden sale del ranking de los dos)."

/** Nombre de la pareja: "Jugador 1 / Jugador 2" o "Jugador 1 / A confirmar". */
export function pairName(name1: string, name2?: string | null): string {
  const second = name2?.trim()
  return `${name1.trim()} / ${second ? second : PARTNER_TBD_LABEL}`
}

/** True si alguna pareja (dobles) todavía no tiene compañero cargado. */
export function hasPendingPartner(participants: Array<{ player_2_id?: string | null }>): boolean {
  return participants.some((p) => !p.player_2_id)
}
