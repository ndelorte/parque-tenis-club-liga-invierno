import { isGrandSlamMonth, pointsForInstance } from "./pointsTable"

// Una fila de circuito_ranking_points: los puntos de un jugador en UN torneo
// mensual (una edición) de una categoría.
export interface AnnualRankingRow {
  playerId: string
  playerName: string
  editionId: string
  month: number
  points: number
}

export interface AnnualRankingEntry {
  playerId: string
  playerName: string
  points: number
  tournamentsPlayed: number
  tournamentsWon: number
}

// Ranking anual de una categoría — reglas-circuito-del-parque.md,
// "Acumulado anual": suma de todos los torneos del año. Desempate (respuesta
// a OQ-38): 1) menos torneos jugados, 2) más torneos ganados. Si sigue el
// empate, el nombre solo deja un orden estable (no es criterio deportivo).
//
// Torneo jugado = torneo con puntos (todo participante del cuadro principal
// suma al menos "16vos o más"). Torneo ganado = sus puntos son los de
// campeón en la escala de ese mes (normal o Grand Slam).
export function buildAnnualRanking(rows: AnnualRankingRow[]): AnnualRankingEntry[] {
  const byPlayer = new Map<string, AnnualRankingEntry & { editions: Set<string> }>()

  for (const row of rows) {
    if (row.points <= 0) continue
    const entry = byPlayer.get(row.playerId) ?? {
      playerId: row.playerId,
      playerName: row.playerName,
      points: 0,
      tournamentsPlayed: 0,
      tournamentsWon: 0,
      editions: new Set<string>(),
    }
    entry.points += row.points
    entry.editions.add(row.editionId)
    if (row.points === pointsForInstance("champion", isGrandSlamMonth(row.month))) entry.tournamentsWon++
    byPlayer.set(row.playerId, entry)
  }

  return [...byPlayer.values()]
    .map(({ editions, ...entry }) => ({ ...entry, tournamentsPlayed: editions.size }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.tournamentsPlayed - b.tournamentsPlayed ||
        b.tournamentsWon - a.tournamentsWon ||
        a.playerName.localeCompare(b.playerName, "es"),
    )
}
