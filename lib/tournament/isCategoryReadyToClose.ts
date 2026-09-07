// Una categoría está lista para el cierre de temporada (Sprint L4) cuando su
// serie de fase "final" tiene un resultado cargado (jugada o por WO).
export function isCategoryReadyToClose(finalSeriesStatuses: string[]): boolean {
  return finalSeriesStatuses.some((status) => status === "completed" || status === "walkover");
}
