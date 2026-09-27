import { isGrandSlamMonth, pointsForInstance } from "./pointsTable"

// Una fila de circuito_ranking_points: los puntos de un jugador en UN torneo
// mensual (una edición) de una categoría.
export interface AnnualRankingRow {
  playerId: string
  playerName: string
  editionId: string
  editionName: string
  month: number
  points: number
}

export interface AnnualRankingEntry {
  playerId: string
  playerName: string
  points: number
  tournamentsPlayed: number
  tournamentsWon: number
  pointsByEdition: Record<string, number> // editionId → puntos en ese torneo
}

// Un torneo mensual que se jugó en la categoría (alguien sumó puntos).
export interface AnnualRankingTournament {
  editionId: string
  name: string
  month: number
}

export interface AnnualRanking {
  entries: AnnualRankingEntry[]
  tournaments: AnnualRankingTournament[] // en orden cronológico
}

// Ranking anual de una categoría — reglas-circuito-del-parque.md,
// "Acumulado anual": suma de todos los torneos del año. Desempate (respuesta
// a OQ-38): 1) menos torneos jugados, 2) más torneos ganados. Si sigue el
// empate, el nombre solo deja un orden estable (no es criterio deportivo).
//
// Torneo jugado = torneo con puntos (todo participante del cuadro principal
// suma al menos "16vos o más"). Torneo ganado = sus puntos son los de
// campeón en la escala de ese mes (normal o Grand Slam).
//
// `tournaments` son las columnas de la tabla: solo los torneos en los que
// alguien sumó puntos en la categoría — si la categoría no se jugó ese mes,
// ese torneo no aparece.
export function buildAnnualRanking(rows: AnnualRankingRow[]): AnnualRanking {
  const byPlayer = new Map<string, Omit<AnnualRankingEntry, "tournamentsPlayed">>()
  const tournaments = new Map<string, AnnualRankingTournament>()

  for (const row of rows) {
    if (row.points <= 0) continue
    const entry = byPlayer.get(row.playerId) ?? {
      playerId: row.playerId,
      playerName: row.playerName,
      points: 0,
      tournamentsWon: 0,
      pointsByEdition: {},
    }
    entry.points += row.points
    entry.pointsByEdition[row.editionId] = (entry.pointsByEdition[row.editionId] ?? 0) + row.points
    tournaments.set(row.editionId, { editionId: row.editionId, name: row.editionName, month: row.month })
    if (row.points === pointsForInstance("champion", isGrandSlamMonth(row.month))) entry.tournamentsWon++
    byPlayer.set(row.playerId, entry)
  }

  const entries = [...byPlayer.values()]
    .map((entry) => ({ ...entry, tournamentsPlayed: Object.keys(entry.pointsByEdition).length }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        a.tournamentsPlayed - b.tournamentsPlayed ||
        b.tournamentsWon - a.tournamentsWon ||
        a.playerName.localeCompare(b.playerName, "es"),
    )

  return {
    entries,
    tournaments: [...tournaments.values()].sort((a, b) => a.month - b.month),
  }
}
