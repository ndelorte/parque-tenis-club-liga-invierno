import type { Tournament, Round } from "@/lib/tournament/types"
import { formatTournamentTitle } from "@/lib/tournament/formatTournamentTitle"

// Tablero "En juego" de la home (plan-refactor-visual.md §4.2, PR 1B): qué se
// está jugando en cada competencia. Funciones puras; la lectura de datos vive
// en lib/data/home.ts.

type SeriesStatusLike = { status: string }
type RoundLike = Pick<Round, "phase" | "round_number" | "name"> & { series: SeriesStatusLike[] }

export type LigaEnJuego =
  | { kind: "fecha"; title: string; slug: string; round: number }
  | { kind: "playoffs"; title: string; slug: string }
  | { kind: "proximamente"; title: string; slug: string }

export type CircuitoEnJuego = { title: string; slug: string; categories: number }

export type InterparqueEnJuego = { players: number; matchesPlayed: number }

const FINISHED_SERIES = new Set(["completed", "walkover", "cancelled"])

// Misma definición que "Próxima fecha" en liga-board: la primera fecha regular
// con alguna serie sin terminar. Con varias categorías, la más atrasada.
export function firstPendingRegularRound(roundsByCategory: RoundLike[][]): number | null {
  let min: number | null = null
  for (const rounds of roundsByCategory) {
    const pending = rounds
      .filter((r) => r.phase === "regular" && r.series.some((s) => !FINISHED_SERIES.has(s.status)))
      .map((r) => r.round_number)
    if (pending.length === 0) continue
    const first = Math.min(...pending)
    if (min === null || first < min) min = first
  }
  return min
}

// Temporada activa → su fecha en juego (o playoffs si ya terminó la fase
// regular). Sin temporada activa → la próxima, anunciada como "Próximamente".
export function buildLigaEnJuego(
  tournaments: Tournament[],
  activeRoundsByCategory: RoundLike[][],
): LigaEnJuego | null {
  const active = tournaments.find((t) => t.status === "active")
  if (active) {
    const title = formatTournamentTitle(active)
    const round = firstPendingRegularRound(activeRoundsByCategory)
    return round === null
      ? { kind: "playoffs", title, slug: active.slug }
      : { kind: "fecha", title, slug: active.slug, round }
  }
  const next = tournaments
    .filter((t) => t.status === "upcoming")
    .sort((a, b) => a.season - b.season)[0]
  if (next) return { kind: "proximamente", title: formatTournamentTitle(next), slug: next.slug }
  return null
}

type EditionLike = { slug: string; name: string; status: "upcoming" | "active" | "finished"; year: number; month: number }

// El torneo del mes en curso; si todavía no se cargó, el próximo; si tampoco
// hay, el último jugado.
export function pickCircuitoEdition<E extends EditionLike>(editions: E[]): E | null {
  const byDate = [...editions].sort((a, b) => a.year - b.year || a.month - b.month)
  return (
    byDate.find((e) => e.status === "active") ??
    byDate.find((e) => e.status === "upcoming") ??
    byDate.filter((e) => e.status === "finished").at(-1) ??
    null
  )
}

// Categorías que se juegan en la edición: las que tienen cuadro armado (mismo
// criterio que /circuito-del-parque/torneos/[edition]).
export function countPlayedCategories(categories: { draw_size: number | null }[]): number {
  return categories.filter((c) => c.draw_size).length
}

export function buildInterparqueEnJuego(
  players: { active: boolean }[],
  matches: { status: string }[],
): InterparqueEnJuego {
  return {
    players: players.filter((p) => p.active).length,
    matchesPlayed: matches.filter((m) => m.status === "completed").length,
  }
}
