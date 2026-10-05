import type { BracketSlotMatch } from "./syncBracketSlots"

export interface SwapUpdate {
  matchId: string
  participantAId: string | null
  participantBId: string | null
}

// El orden del cuadro solo se puede tocar mientras no se jugó nada: un
// resultado ya cargado quedaría atado a participantes que cambiaron de lugar.
export function canReorderBracket(matches: BracketSlotMatch[]): boolean {
  return matches.every((m) => m.winnerId === null && m.score === null)
}

// Intercambia dos participantes de lugar en la 1ª ronda del cuadro principal
// (eliminación: partidos de la 1ª ronda; zonas / todos contra todos: todos
// los partidos de la 1ª ronda donde aparecen). Devuelve solo los partidos
// que cambian. Los lugares derivados (byes, semis) los recalcula después
// syncCircuitoBracketSlots.
export function computeSwapUpdates(matches: BracketSlotMatch[], idA: string, idB: string): SwapUpdate[] {
  if (idA === idB) throw new Error("Elegí dos participantes distintos.")

  const round1 = matches.filter((m) => m.bracket === "main" && m.round === 1)
  const inRound1 = (id: string) => round1.some((m) => m.participantAId === id || m.participantBId === id)
  if (!inRound1(idA) || !inRound1(idB)) throw new Error("Esos participantes no están en el cuadro.")

  const swap = (id: string | null) => (id === idA ? idB : id === idB ? idA : id)
  return round1
    .map((m) => ({ matchId: m.id, participantAId: swap(m.participantAId), participantBId: swap(m.participantBId), m }))
    .filter(({ m, participantAId, participantBId }) => participantAId !== m.participantAId || participantBId !== m.participantBId)
    .map(({ matchId, participantAId, participantBId }) => ({ matchId, participantAId, participantBId }))
}
