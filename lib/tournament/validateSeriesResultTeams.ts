// Validación de los equipos que llegan del cliente al guardar el resultado de
// una serie (saveSeriesResult). Los ids del local/visitante, el ganador del WO
// general y el ganador de cada cancha vienen del navegador: se contrastan con
// la serie leída de la base antes de escribir nada.
//
// No valida el formato del score ni quién debería ganar cada cancha: el
// ganador lo elige el admin (decisión del organizador).

export interface SeriesTeamsInput {
  homeTeamId: string
  awayTeamId: string
  isGeneralWalkover: boolean
  walkoverWinnerId: string | null
  courts: ReadonlyArray<{ courtNumber: number; winnerTeamId: string | null }>
}

export interface SeriesTeamsInDb {
  homeTeamId: string
  awayTeamId: string
}

// Devuelve un mensaje para el admin si algo no cuadra con la serie de la
// base, o null si está todo bien.
export function validateSeriesResultTeams(
  input: SeriesTeamsInput,
  series: SeriesTeamsInDb,
): string | null {
  if (input.homeTeamId !== series.homeTeamId || input.awayTeamId !== series.awayTeamId) {
    return "Los equipos no coinciden con los de la serie. Recargá la página y volvé a cargar el resultado."
  }

  const isSeriesTeam = (teamId: string) =>
    teamId === series.homeTeamId || teamId === series.awayTeamId

  if (input.isGeneralWalkover) {
    if (!input.walkoverWinnerId) return "Elegí qué equipo gana por W.O. general."
    if (!isSeriesTeam(input.walkoverWinnerId)) {
      return "El ganador del W.O. general no es uno de los equipos de la serie."
    }
    return null
  }

  const seen = new Set<number>()
  for (const court of input.courts) {
    if (![1, 2, 3].includes(court.courtNumber) || seen.has(court.courtNumber)) {
      return "Las canchas de la serie no son válidas. Recargá la página y probá de nuevo."
    }
    seen.add(court.courtNumber)
    if (court.winnerTeamId !== null && !isSeriesTeam(court.winnerTeamId)) {
      return `El ganador de la cancha ${court.courtNumber} no es uno de los equipos de la serie.`
    }
  }
  return null
}
