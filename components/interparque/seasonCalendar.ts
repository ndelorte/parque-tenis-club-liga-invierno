// Calendario de domingos de la temporada de Interparque — dirección "Domingos"
// (product/refactor-visual/maquetas/fase-4/Opcion2-Interparque.dc.html).
//
// Regla deportiva ya documentada (product/reglas-interparque.md § Duración y
// calendario): la temporada corre "desde el primer domingo de septiembre
// hasta el último domingo de octubre". No hay en `lib/` un dato explícito de
// "cuántas fechas tiene la temporada" ni de qué año es la temporada activa
// (ver nota al final de este archivo) — este módulo deriva ambas cosas de
// esa regla y de los partidos reales cargados, sin inventar fechas nuevas.
//
// Puramente presentacional: no toca `lib/` (instrucción explícita de esta
// tarea) y no calcula puntaje ni resultados deportivos, solo agrupa partidos
// ya calculados por fecha.

export type SeasonDateStatus = "done" | "next" | "later"

export interface SeasonDate {
  /** 1-based: "Fecha 1", "Fecha 2", ... */
  index: number
  /** Clave "YYYY-MM-DD", mismo formato que `match_date`. */
  key: string
  date: Date
  status: SeasonDateStatus
}

function toISODateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function firstSundayOnOrAfter(date: Date): Date {
  const d = new Date(date)
  const diff = (7 - d.getDay()) % 7
  d.setDate(d.getDate() + diff)
  return d
}

function lastSundayOnOrBefore(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d
}

/** Todos los domingos entre el 1° de septiembre y el 31 de octubre de `year` (inclusive). */
export function seasonSundays(year: number): Date[] {
  const start = firstSundayOnOrAfter(new Date(year, 8, 1, 12))
  const end = lastSundayOnOrBefore(new Date(year, 9, 31, 12))
  const sundays: Date[] = []
  const cur = new Date(start)
  while (cur <= end) {
    sundays.push(new Date(cur))
    cur.setDate(cur.getDate() + 7)
  }
  return sundays
}

function modeYear(years: number[]): number | null {
  if (years.length === 0) return null
  const counts = new Map<number, number>()
  for (const y of years) counts.set(y, (counts.get(y) ?? 0) + 1)
  let best = years[0]
  let bestCount = 0
  for (const [year, count] of counts) {
    if (count > bestCount) {
      best = year
      bestCount = count
    }
  }
  return best
}

export interface SeasonMatchLike {
  match_date: string | null
  status: "scheduled" | "completed"
}

/**
 * Arma las fechas (domingos) de la temporada activa a partir de los partidos
 * reales cargados: el año de la temporada es el más frecuente entre los
 * `match_date` cargados (si no hay ninguno, se usa el año actual). Una fecha
 * queda "done" si tiene al menos un partido `completed` ese día; "next" es la
 * primera fecha sin partidos completados (la próxima a jugarse en orden); el
 * resto queda "later".
 */
export function buildSeasonCalendar(matches: SeasonMatchLike[], now: Date = new Date()): SeasonDate[] {
  const years = matches
    .map((m) => m.match_date)
    .filter((d): d is string => Boolean(d))
    .map((d) => Number.parseInt(d.slice(0, 4), 10))
    .filter((y) => !Number.isNaN(y))

  const year = modeYear(years) ?? now.getFullYear()
  const completedKeys = new Set(
    matches.filter((m) => m.status === "completed" && m.match_date).map((m) => m.match_date as string),
  )

  const sundays = seasonSundays(year)
  const doneFlags = sundays.map((date) => completedKeys.has(toISODateKey(date)))
  const nextIndex = doneFlags.findIndex((done) => !done)

  return sundays.map((date, i) => ({
    index: i + 1,
    key: toISODateKey(date),
    date,
    status: doneFlags[i] ? "done" : i === nextIndex ? "next" : "later",
  }))
}

/** Para cada jugador, en qué fechas jugó un partido `completed`. */
export function buildPlayerParticipation(
  matches: Array<{ status: "scheduled" | "completed"; match_date: string | null; player_a_id: string; player_b_id: string }>,
): Map<string, Set<string>> {
  const byPlayer = new Map<string, Set<string>>()
  for (const match of matches) {
    if (match.status !== "completed" || !match.match_date) continue
    for (const playerId of [match.player_a_id, match.player_b_id]) {
      if (!byPlayer.has(playerId)) byPlayer.set(playerId, new Set())
      byPlayer.get(playerId)!.add(match.match_date)
    }
  }
  return byPlayer
}

export type PlayerDateDot = "on" | "off" | "fut"

export function playerDots(playedKeys: Set<string> | undefined, seasonDates: SeasonDate[]): PlayerDateDot[] {
  return seasonDates.map((seasonDate) => {
    if (seasonDate.status !== "done") return "fut"
    return playedKeys?.has(seasonDate.key) ? "on" : "off"
  })
}

/** "Jugó las fechas 1, 3 y 4" / "Jugó la fecha 4" / "No jugó ninguna fecha todavía". */
export function describePlayedDates(dots: PlayerDateDot[]): string {
  const played = dots
    .map((dot, i) => (dot === "on" ? i + 1 : null))
    .filter((n): n is number => n !== null)

  if (played.length === 0) return "No jugó ninguna fecha todavía"
  if (played.length === 1) return `Jugó la fecha ${played[0]}`
  const last = played[played.length - 1]
  const rest = played.slice(0, -1).join(", ")
  return `Jugó las fechas ${rest} y ${last}`
}

export interface DateGroup<T> {
  /** Clave "YYYY-MM-DD", o "sin-fecha" para partidos completados sin fecha cargada. */
  key: string
  /** La fecha de temporada correspondiente, si `key` cae dentro del calendario calculado. */
  seasonDate: SeasonDate | null
  matches: T[]
}

/**
 * Agrupa partidos `completed` por fecha, en orden cronológico (los partidos
 * sin fecha cargada quedan al final). Genérico sobre el tipo de partido para
 * no acoplar este módulo presentacional al tipo `InterparqueMatch` de `lib/`.
 */
export function groupCompletedMatchesByDate<
  T extends { match_date: string | null; status: "scheduled" | "completed" },
>(matches: T[], seasonDates: SeasonDate[]): DateGroup<T>[] {
  const seasonByKey = new Map(seasonDates.map((s) => [s.key, s]))
  const byKey = new Map<string, T[]>()
  for (const match of matches) {
    if (match.status !== "completed") continue
    const key = match.match_date ?? "sin-fecha"
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(match)
  }

  return Array.from(byKey.entries())
    .sort(([a], [b]) => {
      if (a === "sin-fecha") return 1
      if (b === "sin-fecha") return -1
      return a.localeCompare(b)
    })
    .map(([key, ms]) => ({
      key,
      seasonDate: key !== "sin-fecha" ? (seasonByKey.get(key) ?? null) : null,
      matches: ms,
    }))
}
