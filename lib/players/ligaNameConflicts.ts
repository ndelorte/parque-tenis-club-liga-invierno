import { findSimilarPlayers, type NameMatch, type NamedPlayer } from "./similarNames"

export interface LigaPlayerRow {
  playerId: string | null
  displayName: string
  // El organizador ya confirmó que este nombre es otra persona.
  confirmedDistinct?: boolean
}

export interface LigaTeamRow {
  players: LigaPlayerRow[]
}

export interface LigaNameConflict {
  teamIndex: number
  playerIndex: number
  typedName: string
  // Si el jugador ya existía (se está renombrando) o es un alta nueva.
  isNew: boolean
  candidates: Array<{ id: string; displayName: string; match: NameMatch }>
}

// Antes de guardar los equipos: busca los nombres que son un alta nueva, o un
// cambio de nombre, y se parecen a otro jugador ya cargado (otro orden, un
// error de tipeo). Sirve para preguntar "¿es el mismo?" en vez de crear una
// ficha repetida que parte los puntos del ranking.
export function findLigaNameConflicts(teams: LigaTeamRow[], existing: NamedPlayer[]): LigaNameConflict[] {
  const nameById = new Map(existing.map((p) => [p.id, p.displayName]))
  const conflicts: LigaNameConflict[] = []

  teams.forEach((team, teamIndex) => {
    team.players.forEach((player, playerIndex) => {
      const typedName = player.displayName.trim().replace(/\s+/g, " ")
      if (!typedName || player.confirmedDistinct) return

      const isNew = !player.playerId
      // Un jugador existente solo se revisa si se le cambió el nombre.
      if (!isNew && nameById.get(player.playerId!) === typedName) return

      const candidates = findSimilarPlayers(existing, typedName, player.playerId ?? undefined)
        .slice(0, 5)
        .map((c) => ({ id: c.player.id, displayName: c.player.displayName, match: c.match }))
      if (candidates.length > 0) conflicts.push({ teamIndex, playerIndex, typedName, isNew, candidates })
    })
  })

  return conflicts
}
