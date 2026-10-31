// Lógica pura de ediciones de Interparque (sin UI). Cada edición define su
// primer domingo y cuántos domingos dura; el estado se deriva de esas fechas
// y nunca se guarda (product/reglas-interparque.md § Duración y calendario).
//
// Las fechas son claves "YYYY-MM-DD" y la aritmética es en UTC para no
// depender de la zona horaria de quien corre el código.

export type InterparqueEditionStatus = "upcoming" | "active" | "finished"

export interface EditionDates {
  start_date: string
  sundays_count: number
}

const MS_PER_DAY = 86_400_000

function parseKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

const LABELS = ["1ra", "2da", "3ra", "4ta", "5ta", "6ta", "7ma", "8va", "9na", "10ma"]

/** "1ra edición" ... "10ma edición"; de la 11 en adelante, "Edición 11". */
export function editionLabel(number: number): string {
  if (number >= 1 && number <= LABELS.length) return `${LABELS[number - 1]} edición`
  return `Edición ${number}`
}

/** ¿La clave "YYYY-MM-DD" es una fecha válida y cae domingo? */
export function isSunday(dateKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return false
  const date = parseKey(dateKey)
  return Number.isFinite(date.getTime()) && toKey(date) === dateKey && date.getUTCDay() === 0
}

/** Los `count` domingos consecutivos desde `startDate`, como claves "YYYY-MM-DD". */
export function editionSundays(startDate: string, count: number): string[] {
  const start = parseKey(startDate).getTime()
  return Array.from({ length: Math.max(0, count) }, (_, i) => toKey(new Date(start + i * 7 * MS_PER_DAY)))
}

export function editionLastSunday(edition: EditionDates): string {
  const sundays = editionSundays(edition.start_date, edition.sundays_count)
  return sundays[sundays.length - 1] ?? edition.start_date
}

/** Clave "YYYY-MM-DD" del día de `now` en hora local. */
export function localDateKey(now: Date): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Próxima si hoy es antes del primer domingo; finalizada si hoy es después
 * del último domingo (ese día todavía se juega, así que sigue en juego).
 */
export function deriveEditionStatus(edition: EditionDates, now: Date = new Date()): InterparqueEditionStatus {
  const today = localDateKey(now)
  if (today < edition.start_date) return "upcoming"
  if (today > editionLastSunday(edition)) return "finished"
  return "active"
}

export const EDITION_STATUS_LABEL: Record<InterparqueEditionStatus, string> = {
  upcoming: "Próxima",
  active: "En juego",
  finished: "Finalizada",
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

/** "6 sep – 25 oct 2026" (con año en ambos extremos si cruza de año). */
export function formatEditionRange(edition: EditionDates): string {
  const first = parseKey(edition.start_date)
  const last = parseKey(editionLastSunday(edition))
  const fmt = (d: Date, withYear: boolean) =>
    `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}${withYear ? ` ${d.getUTCFullYear()}` : ""}`
  const crossesYear = first.getUTCFullYear() !== last.getUTCFullYear()
  return `${fmt(first, crossesYear)} – ${fmt(last, true)}`
}
