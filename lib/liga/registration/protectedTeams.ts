// Panel "Jugadores" (saveTeamPlayers): da de baja los equipos de la categoría
// que no vienen en la lista. Los equipos aprobados desde una inscripción
// online NO se dan de baja por omisión: eso se hace a propósito desde la
// ficha de la inscripción (con su historial).

export function teamsToDeactivate(currentTeamIds: string[], listedTeamIds: Iterable<string>, protectedTeamIds: Iterable<string>): string[] {
  const listed = new Set(listedTeamIds)
  const protectedIds = new Set(protectedTeamIds)
  return currentTeamIds.filter((id) => !listed.has(id) && !protectedIds.has(id))
}
