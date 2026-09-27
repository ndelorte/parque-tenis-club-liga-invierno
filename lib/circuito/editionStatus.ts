// El status de una edición depende de la fecha real (mes en curso = active,
// ya pasado = finished, todavía no llegó = upcoming) — no de si ya tenemos
// datos/resultados cargados. Un mes ya jugado sigue siendo "finished" aunque
// la carga de resultados vaya atrasada.
export function statusForMonth(year: number, month: number): "finished" | "active" | "upcoming" {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  if (year < currentYear || (year === currentYear && month < currentMonth)) return "finished"
  if (year === currentYear && month === currentMonth) return "active"
  return "upcoming"
}
