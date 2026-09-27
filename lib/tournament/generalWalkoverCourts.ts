// WO general (reglas-liga-invierno.md, respuesta a OQ-08): las 3 canchas de
// la serie se registran como 6-0 6-0 a favor del equipo presente — también si
// la serie ya tenía resultados cargados. El score se guarda, como todos, desde
// la perspectiva del local ("0-6 0-6" = ganó el visitante).
export interface GeneralWalkoverCourt {
  courtNumber: 1 | 2 | 3
  score: "6-0 6-0" | "0-6 0-6"
  winnerTeamId: string
}

export function generalWalkoverCourts(
  walkoverWinnerId: string,
  homeTeamId: string,
): GeneralWalkoverCourt[] {
  const score = walkoverWinnerId === homeTeamId ? "6-0 6-0" : "0-6 0-6"
  return ([1, 2, 3] as const).map((courtNumber) => ({ courtNumber, score, winnerTeamId: walkoverWinnerId }))
}
