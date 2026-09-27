export interface InterparquePlayer {
  id: string
  first_name: string
  last_name: string
}

export interface InterparqueMatchRow {
  status: "scheduled" | "completed"
  player_a_id: string
  player_b_id: string
  points_a: number
  points_b: number
}

export interface InterparqueStandingRow {
  playerId: string
  displayName: string
  played: number
  points: number
}

/**
 * Tabla de posiciones de Interparque, calculada en vivo a partir de los
 * partidos completados (nunca se persiste un snapshot — ver ADR-006).
 * Desempate (reglas-interparque.md, respuesta a OQ-IP-01): a igualdad de
 * puntos queda arriba quien jugó menos partidos. Si sigue el empate, el
 * nombre solo deja un orden estable (no es criterio deportivo).
 */
export function calculateInterparqueStandings(
  players: InterparquePlayer[],
  matches: InterparqueMatchRow[],
): InterparqueStandingRow[] {
  const statsById = new Map<string, { played: number; points: number }>()
  for (const player of players) {
    statsById.set(player.id, { played: 0, points: 0 })
  }

  for (const match of matches) {
    if (match.status !== "completed") continue

    const a = statsById.get(match.player_a_id)
    if (a) {
      a.played += 1
      a.points += match.points_a
    }

    const b = statsById.get(match.player_b_id)
    if (b) {
      b.played += 1
      b.points += match.points_b
    }
  }

  const rows: InterparqueStandingRow[] = players.map((player) => {
    const stats = statsById.get(player.id)!
    return {
      playerId: player.id,
      displayName: `${player.first_name} ${player.last_name}`,
      played: stats.played,
      points: stats.points,
    }
  })

  return rows.sort((rowA, rowB) => {
    if (rowB.points !== rowA.points) return rowB.points - rowA.points
    if (rowA.played !== rowB.played) return rowA.played - rowB.played
    return rowA.displayName.localeCompare(rowB.displayName)
  })
}
