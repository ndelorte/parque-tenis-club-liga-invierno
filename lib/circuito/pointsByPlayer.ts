// El ranking del Circuito es por jugador (circuito_ranking_points.player_id),
// no por pareja: un participante de dobles acredita los mismos puntos a sus 2
// jugadores. Si una misma persona figura en 2 participantes de la categoría
// (cambió de compañero/a durante el torneo), se queda con el MÁXIMO — el mismo
// criterio que mergeRankingPoints al unificar fichas: no se suma (contaría doble)
// y no gana el último participante iterado.

export interface ParticipantPlayers {
  id: string
  player_id: string | null
  player_2_id: string | null
}

export function pointsByPlayer(
  participants: readonly ParticipantPlayers[],
  pointsByParticipant: ReadonlyMap<string, number>,
): Map<string, number> {
  const result = new Map<string, number>()
  for (const p of participants) {
    const points = pointsByParticipant.get(p.id) ?? 0
    if (points === 0) continue
    for (const playerId of [p.player_id, p.player_2_id]) {
      if (!playerId) continue
      result.set(playerId, Math.max(result.get(playerId) ?? 0, points))
    }
  }
  return result
}
