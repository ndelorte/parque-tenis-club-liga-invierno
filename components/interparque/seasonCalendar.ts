// Calendario de domingos de una edición de Interparque — dirección "Domingos"
// (product/refactor-visual/maquetas/fase-4/Opcion2-Interparque.dc.html).
//
// Cada edición define su primer domingo y cuántos domingos dura
// (product/reglas-interparque.md § Duración y calendario, tabla
// `interparque_editions`). Este módulo arma las fechas a partir de esos dos
// datos; no deriva nada de los partidos cargados.
//
// Puramente presentacional: no calcula puntaje ni resultados deportivos, solo
// agrupa partidos ya calculados por fecha.

import { editionSundays } from "@/lib/interparque/editions"

export type SeasonDateStatus = "done" | "next" | "later"

export interface SeasonDate {
  /** 1-based: "Fecha 1", "Fecha 2", ... */
  index: number
  /** Clave "YYYY-MM-DD", mismo formato que `match_date`. */
  key: string
  date: Date
  status: SeasonDateStatus
}

export interface SeasonEditionLike {
  start_date: string
  sundays_count: number
}

/**
 * Arma las fechas (domingos) de la edición. Una fecha queda "done" cuando ya
 * pasó (por calendario, no por si se cargó un partido ese día: si llovió y no
 * hay partido registrado, la fecha igual pasa a "jugada" al otro día); "next"
 * es la primera fecha que no pasó todavía; el resto queda "later".
 */
export function buildSeasonCalendar(edition: SeasonEditionLike, now: Date = new Date()): SeasonDate[] {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Mediodía local: el `Date` solo se usa para mostrar día y mes sin corrimientos.
  const sundays = editionSundays(edition.start_date, edition.sundays_count).map((key) => {
    const [y, m, d] = key.split("-").map(Number)
    return { key, date: new Date(y, m - 1, d, 12) }
  })
  const doneFlags = sundays.map(({ date }) => date < todayStart)
  const nextIndex = doneFlags.findIndex((done) => !done)

  return sundays.map(({ key, date }, i) => ({
    index: i + 1,
    key,
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
