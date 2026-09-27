// Cabezas de serie desde el ranking — reglas-circuito-del-parque.md,
// "Seeding": la fuente es el ranking vigente de la categoría. En dobles la
// pareja toma la posición de su mejor jugador. Quien no tiene ranking queda
// sin seed (null): el motor lo ubica después de los sembrados.

export interface SeedableParticipant {
  id: string
  playerId: string | null
  player2Id: string | null
}

// `rankingOrder`: ids de jugadores en el orden del ranking (1° primero), ya
// con el desempate aplicado (lib/circuito/buildAnnualRanking.ts).
// Devuelve participantId → seed (1 = mejor), o null si no tiene ranking.
export function assignSeedsFromRanking(
  participants: SeedableParticipant[],
  rankingOrder: string[],
): Map<string, number | null> {
  const positionOf = new Map(rankingOrder.map((playerId, i) => [playerId, i]))

  const bestPosition = (p: SeedableParticipant): number | null => {
    const positions = [p.playerId, p.player2Id]
      .filter((id): id is string => !!id)
      .map((id) => positionOf.get(id))
      .filter((pos): pos is number => pos !== undefined)
    return positions.length > 0 ? Math.min(...positions) : null
  }

  const ranked = participants
    .map((p) => ({ id: p.id, position: bestPosition(p) }))
    .filter((p): p is { id: string; position: number } => p.position !== null)
    .sort((a, b) => a.position - b.position)

  const seeds = new Map<string, number | null>(participants.map((p) => [p.id, null]))
  ranked.forEach((p, i) => seeds.set(p.id, i + 1))
  return seeds
}
