// Pareja de dobles con compañero "a confirmar".
export const PARTNER_TBD_LABEL = "A confirmar"

/** Nombre de la pareja: "Jugador 1 / Jugador 2" o "Jugador 1 / A confirmar". */
export function pairName(name1: string, name2?: string | null): string {
  const second = name2?.trim()
  return `${name1.trim()} / ${second ? second : PARTNER_TBD_LABEL}`
}

/** True si alguna pareja (dobles) todavía no tiene compañero cargado. */
export function hasPendingPartner(participants: Array<{ player_2_id?: string | null }>): boolean {
  return participants.some((p) => !p.player_2_id)
}
