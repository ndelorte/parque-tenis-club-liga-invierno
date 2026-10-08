import { categoryStatus, type CategoryStatusMatch } from "./categoryStatus"

export type EditionStatus = "finished" | "active" | "upcoming"

// Estado de una edición a partir de lo que ya se cargó (lo que se muestra en
// la landing, el calendario y la home):
// - upcoming: todavía no se cargó ningún resultado en ninguna categoría.
// - active: hay al menos un resultado y alguna categoría con cuadro sigue sin
//   terminar (le falta definir campeón).
// - finished: todas las categorías con cuadro tienen campeón.
// Las categorías sin cuadro generado no cuentan. Devuelve null si ninguna
// tiene cuadro: no hay datos para decidir y se conserva el estado guardado.
export function deriveEditionStatus(
  categories: { drawSize: number | null; matches: CategoryStatusMatch[] }[],
): EditionStatus | null {
  const withBracket = categories.filter((c) => c.drawSize && c.matches.length > 0)
  if (withBracket.length === 0) return null

  const hasResult = withBracket.some((c) => c.matches.some((m) => m.winner_id || m.score))
  if (!hasResult) return "upcoming"

  const allFinished = withBracket.every((c) => categoryStatus(c.drawSize!, c.matches, {}).kind === "finished")
  return allFinished ? "finished" : "active"
}

// Estado por fecha del calendario. Solo para el valor inicial al crear/importar
// una edición: el que se muestra sale de deriveEditionStatus. El status de una edición depende de la fecha real (mes en curso = active,
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
