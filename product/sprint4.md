Integrá las pantallas generadas en v0 para Liga de Invierno.
1. app/liga-invierno/page.tsx

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LigaHeader } from "@/components/liga/liga-header"
import { LigaBoard } from "@/components/liga/liga-board"
import { LigaReglamento } from "@/components/liga/liga-reglamento"
import { WhatsappFab } from "@/components/whatsapp-fab"

export const metadata = {
  title: "Liga de Invierno 2026 | Parque Tenis Club",
  description:
    "Torneo por equipos de dobles. Posiciones, fixture, resultados y equipos de las categorías Caballeros, Damas y Mixto.",
}

export default function LigaInviernoPage() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="bg-primary">
        <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
      <LigaHeader />
      <LigaBoard />
      <LigaReglamento />
      <WhatsappFab />
    </main>
  )
}


2. app/liga-invierno/equipo/[slug]/page.tsx

import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WhatsappFab } from "@/components/whatsapp-fab"
import { TeamDetailView } from "@/components/liga/team-detail"
import { getTeamDetail, getAllTeamSlugs } from "@/lib/equipos"

export function generateStaticParams() {
  return getAllTeamSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const team = getTeamDetail(slug)
  if (!team) return { title: "Equipo no encontrado | Parque Tenis Club" }
  return {
    title: `${team.name} · ${team.categoryLabel} | Liga de Invierno`,
    description: `Detalle del equipo ${team.name} en la Liga de Invierno de Parque Tenis Club: plantel, estadísticas, fechas jugadas y fixture pendiente.`,
  }
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const team = getTeamDetail(slug)
  if (!team) notFound()

  return (
    <main className="min-h-dvh bg-background">
      <SiteHeader />
      <TeamDetailView team={team} />
      <SiteFooter />
      <WhatsappFab />
    </main>
  )
}


3. lib/liga.ts

// Mock data for the Liga de Invierno (Winter League).
// Doubles team tournament. Each series is between two teams over 3 courts.
// A team wins the series by winning 2 of 3 courts. No backend, all mocked.

export type CategoryId =
  | "cab-a"
  | "cab-b"
  | "dam-a"
  | "dam-b"
  | "mix-a"
  | "mix-b"

export type Category = {
  id: CategoryId
  label: string
  group: "Caballeros" | "Damas" | "Mixto"
}

export const CATEGORIES: Category[] = [
  { id: "cab-a", label: "Caballeros A", group: "Caballeros" },
  { id: "cab-b", label: "Caballeros B", group: "Caballeros" },
  { id: "dam-a", label: "Damas A", group: "Damas" },
  { id: "dam-b", label: "Damas B", group: "Damas" },
  { id: "mix-a", label: "Mixto A", group: "Mixto" },
  { id: "mix-b", label: "Mixto B", group: "Mixto" },
]

export type StandingRow = {
  pos: number
  team: string
  played: number
  won: number
  lost: number
  courtsFor: number
  courtsAgainst: number
  points: number
}

export type Match = {
  date: string // ISO date
  round: string
  home: string
  away: string
  // Court results: true = home won that court, false = away won, null = pending
  courts: [boolean | null, boolean | null, boolean | null]
  status: "played" | "upcoming"
}

export type LeagueData = {
  standings: StandingRow[]
  matches: Match[]
  teams: { name: string; players: [string, string] }[]
}

// Helper to build a standings table that is internally consistent.
function row(
  pos: number,
  team: string,
  won: number,
  lost: number,
  courtsFor: number,
  courtsAgainst: number,
): StandingRow {
  return {
    pos,
    team,
    played: won + lost,
    won,
    lost,
    courtsFor,
    courtsAgainst,
    points: won * 3,
  }
}

export const LEAGUE: Record<CategoryId, LeagueData> = {
  "cab-a": {
    standings: [
      row(1, "Los Halcones", 4, 0, 11, 1),
      row(2, "Drop Shot", 3, 1, 9, 4),
      row(3, "Saque y Volea", 2, 2, 7, 6),
      row(4, "Polvo de Ladrillo", 1, 3, 4, 9),
      row(5, "Doble Falta", 0, 4, 1, 11),
    ],
    matches: [
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Los Halcones",
        away: "Saque y Volea",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Drop Shot",
        away: "Doble Falta",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Los Halcones",
        away: "Polvo de Ladrillo",
        courts: [true, true, false],
        status: "played",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Drop Shot",
        away: "Saque y Volea",
        courts: [true, false, true],
        status: "played",
      },
      {
        date: "2026-06-13",
        round: "Fecha 3",
        home: "Saque y Volea",
        away: "Doble Falta",
        courts: [true, true, false],
        status: "played",
      },
    ],
    teams: [
      { name: "Los Halcones", players: ["M. Fernández", "J. Pérez"] },
      { name: "Drop Shot", players: ["L. Gómez", "R. Díaz"] },
      { name: "Saque y Volea", players: ["A. Suárez", "P. Romero"] },
      { name: "Polvo de Ladrillo", players: ["F. Castro", "N. Vega"] },
      { name: "Doble Falta", players: ["G. Ramos", "S. Ortiz"] },
    ],
  },
  "cab-b": {
    standings: [
      row(1, "Red Alta", 3, 1, 9, 5),
      row(2, "Los Pibes", 3, 1, 8, 5),
      row(3, "Smash", 2, 2, 6, 6),
      row(4, "Globeros", 1, 3, 4, 9),
      row(5, "Revés a Dos Manos", 1, 3, 3, 9),
    ],
    matches: [
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Red Alta",
        away: "Smash",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Los Pibes",
        away: "Globeros",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Red Alta",
        away: "Revés a Dos Manos",
        courts: [true, false, true],
        status: "played",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Los Pibes",
        away: "Smash",
        courts: [false, true, true],
        status: "played",
      },
    ],
    teams: [
      { name: "Red Alta", players: ["D. Molina", "E. Sosa"] },
      { name: "Los Pibes", players: ["T. Acosta", "B. Luna"] },
      { name: "Smash", players: ["I. Herrera", "C. Medina"] },
      { name: "Globeros", players: ["H. Ríos", "V. Campos"] },
      { name: "Revés a Dos Manos", players: ["O. Bravo", "W. Núñez"] },
    ],
  },
  "dam-a": {
    standings: [
      row(1, "Las Tigras", 4, 0, 12, 2),
      row(2, "Volea Fina", 2, 2, 7, 6),
      row(3, "Slice", 2, 2, 6, 7),
      row(4, "Las Águilas", 0, 4, 2, 12),
    ],
    matches: [
      {
        date: "2026-06-27",
        round: "Fecha 5",
        home: "Las Tigras",
        away: "Slice",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Las Tigras",
        away: "Las Águilas",
        courts: [true, true, true],
        status: "played",
      },
      {
        date: "2026-06-20",
        round: "Fecha 4",
        home: "Volea Fina",
        away: "Slice",
        courts: [true, false, true],
        status: "played",
      },
    ],
    teams: [
      { name: "Las Tigras", players: ["M. López", "C. Ferreyra"] },
      { name: "Volea Fina", players: ["A. Giménez", "L. Cabrera"] },
      { name: "Slice", players: ["P. Maldonado", "R. Ledesma"] },
      { name: "Las Águilas", players: ["S. Aguirre", "N. Paz"] },
    ],
  },
  "dam-b": {
    standings: [
      row(1, "Drive", 3, 0, 8, 3),
      row(2, "Las Gardenias", 2, 1, 6, 4),
      row(3, "Topspin", 1, 2, 4, 6),
      row(4, "Las Nuevas", 0, 3, 2, 7),
    ],
    matches: [
      {
        date: "2026-06-27",
        round: "Fecha 4",
        home: "Drive",
        away: "Topspin",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-20",
        round: "Fecha 3",
        home: "Drive",
        away: "Las Nuevas",
        courts: [true, true, false],
        status: "played",
      },
      {
        date: "2026-06-20",
        round: "Fecha 3",
        home: "Las Gardenias",
        away: "Topspin",
        courts: [true, false, true],
        status: "played",
      },
    ],
    teams: [
      { name: "Drive", players: ["V. Torres", "F. Ibáñez"] },
      { name: "Las Gardenias", players: ["M. Ojeda", "J. Silva"] },
      { name: "Topspin", players: ["E. Rojas", "D. Cardozo"] },
      { name: "Las Nuevas", players: ["B. Figueroa", "G. Morales"] },
    ],
  },
  "mix-a": {
    standings: [
      row(1, "Match Point", 4, 0, 11, 2),
      row(2, "Dúo Dinámico", 3, 1, 9, 4),
      row(3, "Ace", 2, 2, 6, 7),
      row(4, "Tie Break", 1, 3, 3, 9),
      row(5, "Los Mixtos", 0, 4, 2, 11),
    ],
    matches: [
      {
        date: "2026-06-28",
        round: "Fecha 5",
        home: "Match Point",
        away: "Ace",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-28",
        round: "Fecha 5",
        home: "Dúo Dinámico",
        away: "Los Mixtos",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-21",
        round: "Fecha 4",
        home: "Match Point",
        away: "Tie Break",
        courts: [true, true, false],
        status: "played",
      },
      {
        date: "2026-06-21",
        round: "Fecha 4",
        home: "Dúo Dinámico",
        away: "Ace",
        courts: [true, false, true],
        status: "played",
      },
    ],
    teams: [
      { name: "Match Point", players: ["C. Vera", "M. Ruiz"] },
      { name: "Dúo Dinámico", players: ["L. Benítez", "A. Coronel"] },
      { name: "Ace", players: ["P. Godoy", "S. Méndez"] },
      { name: "Tie Break", players: ["R. Quiroga", "N. Vera"] },
      { name: "Los Mixtos", players: ["F. Arce", "V. Leiva"] },
    ],
  },
  "mix-b": {
    standings: [
      row(1, "Los Cracks", 3, 1, 8, 5),
      row(2, "Sin Drama", 3, 1, 8, 6),
      row(3, "Bandeja", 2, 2, 6, 6),
      row(4, "Cambio de Lado", 1, 3, 4, 8),
      row(5, "Los Domingueros", 1, 3, 4, 9),
    ],
    matches: [
      {
        date: "2026-06-28",
        round: "Fecha 5",
        home: "Los Cracks",
        away: "Bandeja",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-28",
        round: "Fecha 5",
        home: "Sin Drama",
        away: "Los Domingueros",
        courts: [null, null, null],
        status: "upcoming",
      },
      {
        date: "2026-06-21",
        round: "Fecha 4",
        home: "Los Cracks",
        away: "Cambio de Lado",
        courts: [true, false, true],
        status: "played",
      },
      {
        date: "2026-06-21",
        round: "Fecha 4",
        home: "Sin Drama",
        away: "Bandeja",
        courts: [true, true, false],
        status: "played",
      },
    ],
    teams: [
      { name: "Los Cracks", players: ["J. Cáceres", "M. Roldán"] },
      { name: "Sin Drama", players: ["A. Peralta", "L. Sandoval"] },
      { name: "Bandeja", players: ["P. Escobar", "C. Villalba"] },
      { name: "Cambio de Lado", players: ["R. Domínguez", "S. Bustos"] },
      { name: "Los Domingueros", players: ["F. Navarro", "V. Juárez"] },
    ],
  },
}

// Format an ISO date to a readable Spanish label.
export function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  })
}

// Compute the series result from court outcomes.
export function seriesResult(courts: Match["courts"]) {
  const home = courts.filter((c) => c === true).length
  const away = courts.filter((c) => c === false).length
  return { home, away }
}


4. lib/equipos.ts

// Builds rich, per-team detail data for the Liga de Invierno team pages.
// Derived deterministically from the shared LEAGUE mock so it stays in sync
// with the standings/board, then enriched with captain, "lista de buena fe",
// per-court line-ups, exact scores and WO labels. All mocked, no backend.

import {
  CATEGORIES,
  LEAGUE,
  formatDate,
  type CategoryId,
  type Match,
} from "@/lib/liga"

export type CourtDetail = {
  court: number
  homePlayers: [string, string]
  awayPlayers: [string, string]
  score: string
  winner: "home" | "away"
  wo: boolean
}

export type PlayedDate = {
  round: string
  date: string
  opponent: string
  isHome: boolean
  courtsWon: number
  courtsLost: number
  result: "win" | "loss"
  courts: CourtDetail[]
}

export type PendingDate = {
  round: string
  date: string
  time: string
  opponent: string
  isHome: boolean
}

export type TeamStats = {
  played: number
  won: number
  lost: number
  courtsFor: number
  courtsAgainst: number
  points: number
  position: number
  totalTeams: number
}

export type TeamDetail = {
  slug: string
  name: string
  categoryId: CategoryId
  categoryLabel: string
  captain: string
  roster: string[]
  stats: TeamStats
  played: PlayedDate[]
  pending: PendingDate[]
}

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// Deterministic pseudo-random in [0,1) from a string seed.
function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

// Extra reserve players to flesh out the "lista de buena fe".
const RESERVES = [
  "M. Aguirre",
  "J. Cabrera",
  "L. Sosa",
  "P. Ferreyra",
  "D. Ramírez",
  "N. Acuña",
]

function buildRoster(name: string, players: [string, string]): string[] {
  const r1 = RESERVES[Math.floor(seeded(name + "r1") * RESERVES.length)]
  const r2 = RESERVES[Math.floor(seeded(name + "r2") * RESERVES.length)]
  const roster = [...players]
  if (!roster.includes(r1)) roster.push(r1)
  if (!roster.includes(r2) && r2 !== r1) roster.push(r2)
  return roster
}

const SCORES = ["6-3 6-4", "7-5 6-3", "6-4 4-6 6-2", "6-2 6-1", "7-6 6-4", "6-3 7-5"]

function buildCourts(
  teamRoster: string[],
  oppRoster: string[],
  courtOutcomes: Match["courts"],
  teamIsHome: boolean,
  seed: string,
): CourtDetail[] {
  return courtOutcomes.map((outcome, i) => {
    // outcome is true when HOME won that court.
    const teamWon = teamIsHome ? outcome === true : outcome === false
    const tp: [string, string] = [
      teamRoster[i % teamRoster.length],
      teamRoster[(i + 1) % teamRoster.length],
    ]
    const op: [string, string] = [
      oppRoster[i % oppRoster.length],
      oppRoster[(i + 1) % oppRoster.length],
    ]
    const wo = seeded(seed + "wo" + i) > 0.88
    const score = wo ? "W.O." : SCORES[Math.floor(seeded(seed + i) * SCORES.length)]
    return {
      court: i + 1,
      homePlayers: teamIsHome ? tp : op,
      awayPlayers: teamIsHome ? op : tp,
      score,
      winner: teamWon ? "home" : "away",
      wo,
    }
  })
}

const TIMES = ["09:00", "10:30", "14:00", "16:30", "19:00"]

export function getTeamDetail(slug: string): TeamDetail | null {
  for (const cat of CATEGORIES) {
    const data = LEAGUE[cat.id]
    const team = data.teams.find((t) => slugify(t.name) === slug)
    if (!team) continue

    const standing = data.standings.find((s) => s.team === team.name)
    const roster = buildRoster(team.name, team.players)

    const played: PlayedDate[] = []
    const pending: PendingDate[] = []

    for (const m of data.matches) {
      const isHome = m.home === team.name
      const isAway = m.away === team.name
      if (!isHome && !isAway) continue
      const opponentName = isHome ? m.away : m.home
      const opp = data.teams.find((t) => t.name === opponentName)
      const oppRoster = opp ? buildRoster(opp.name, opp.players) : ["—", "—"]

      if (m.status === "upcoming") {
        pending.push({
          round: m.round,
          date: m.date,
          time: TIMES[Math.floor(seeded(m.date + opponentName) * TIMES.length)],
          opponent: opponentName,
          isHome,
        })
      } else {
        const courts = buildCourts(
          roster,
          oppRoster,
          m.courts,
          isHome,
          m.date + team.name,
        )
        const courtsWon = courts.filter((c) => c.winner === "home" === isHome).length
        const won = courts.filter((c) =>
          isHome ? c.winner === "home" : c.winner === "away",
        ).length
        const lost = courts.length - won
        played.push({
          round: m.round,
          date: m.date,
          opponent: opponentName,
          isHome,
          courtsWon: won,
          courtsLost: lost,
          result: won > lost ? "win" : "loss",
          courts,
        })
      }
    }

    return {
      slug,
      name: team.name,
      categoryId: cat.id,
      categoryLabel: cat.label,
      captain: team.players[0],
      roster,
      stats: {
        played: standing?.played ?? 0,
        won: standing?.won ?? 0,
        lost: standing?.lost ?? 0,
        courtsFor: standing?.courtsFor ?? 0,
        courtsAgainst: standing?.courtsAgainst ?? 0,
        points: standing?.points ?? 0,
        position: standing?.pos ?? 0,
        totalTeams: data.standings.length,
      },
      played,
      pending,
    }
  }
  return null
}

// Canonical (home-perspective) detail for a single series, used by the board
// so the "Todos los resultados" cards show the same per-court info as the
// team pages' "Fechas jugadas".
export function getSeriesDetail(
  categoryId: CategoryId,
  match: Match,
): { homeScore: number; awayScore: number; courts: CourtDetail[] } {
  const data = LEAGUE[categoryId]
  const home = data.teams.find((t) => t.name === match.home)
  const away = data.teams.find((t) => t.name === match.away)
  const homeRoster = home
    ? buildRoster(home.name, home.players)
    : ["—", "—"]
  const awayRoster = away
    ? buildRoster(away.name, away.players)
    : ["—", "—"]
  const courts = buildCourts(
    homeRoster,
    awayRoster,
    match.courts,
    true,
    match.date + match.home,
  )
  const homeScore = courts.filter((c) => c.winner === "home").length
  const awayScore = courts.filter((c) => c.winner === "away").length
  return { homeScore, awayScore, courts }
}

export function getAllTeamSlugs(): string[] {
  const slugs: string[] = []
  for (const cat of CATEGORIES) {
    for (const t of LEAGUE[cat.id].teams) {
      slugs.push(slugify(t.name))
    }
  }
  return slugs
}

export { formatDate }


5. components/liga/liga-header.tsx

import { Trophy, Layers, Swords, Medal, FileText, Snowflake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Snowfall } from "@/components/decorations/snowfall"

const FORMAT = [
  {
    icon: Layers,
    title: "Por equipos de dobles",
    text: "Cada equipo juega de a parejas a lo largo de toda la liga.",
  },
  {
    icon: Swords,
    title: "3 canchas por serie",
    text: "Cada serie enfrenta a dos equipos en simultáneo en 3 canchas.",
  },
  {
    icon: Medal,
    title: "Gana 2 de 3",
    text: "El equipo que gana 2 de las 3 canchas se lleva la serie.",
  },
]

export function LigaHeader() {
  return (
    <header className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <Snowfall />
      {/* Decorative icy glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-winter/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex size-16 shrink-0 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-lg ring-4 ring-primary-foreground/10">
              <Trophy className="size-8 animate-bob" />
              <Snowflake className="absolute -right-2 -top-2 size-6 rounded-full bg-winter p-1 text-winter-foreground shadow" />
            </div>
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-winter-foreground">
                <Snowflake className="size-4 text-winter" />
                Temporada de invierno
              </p>
              <h1 className="text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Liga de Invierno 2026
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/70">
                Parque Tenis Club · ¡el frío no para el tenis!
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="secondary"
            size="lg"
            className="h-12 w-full rounded-2xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:w-auto"
          >
            <a href="#reglamento">
              <FileText className="size-5" />
              Ver reglamento
            </a>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FORMAT.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl bg-primary-foreground/10 p-5 ring-1 ring-primary-foreground/15 transition-transform duration-300 hover:-translate-y-1 hover:bg-primary-foreground/15"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-1 ring-accent/30">
                <f.icon className="size-6" />
              </div>
              <h2 className="mt-3 font-heading text-lg font-bold">{f.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-primary-foreground/80">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}


6. components/liga/liga-board.tsx

"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarClock,
  ListChecks,
  Users,
  Trophy,
  Snowflake,
  Medal,
  ChevronRight,
  ChevronDown,
  MapPin,
} from "lucide-react"
import {
  CATEGORIES,
  LEAGUE,
  formatDate,
  seriesResult,
  type CategoryId,
  type Match,
} from "@/lib/liga"
import { slugify, getSeriesDetail, type CourtDetail } from "@/lib/equipos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const TEAM_TINTS = [
  "bg-primary/15 text-primary",
  "bg-winter/20 text-winter",
  "bg-accent/15 text-accent",
]

export function LigaBoard() {
  const [active, setActive] = useState<CategoryId>("cab-a")
  const data = LEAGUE[active]

  const upcoming = useMemo(
    () => data.matches.filter((m) => m.status === "upcoming"),
    [data],
  )
  const played = useMemo(
    () =>
      data.matches
        .filter((m) => m.status === "played")
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data],
  )
  const nextDate = upcoming[0]?.date

  return (
    <section className="relative isolate overflow-hidden">
      {/* Frosty backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-winter/15 via-background to-background"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-12 -z-10 size-72 rounded-full bg-winter/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/2 -z-10 size-72 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Category selector */}
        <div>
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <Snowflake className="size-5 text-winter" />
            Elegí tu categoría
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                aria-pressed={active === c.id}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition-all duration-200",
                  active === c.id
                    ? "scale-105 bg-primary text-primary-foreground ring-primary"
                    : "bg-card text-secondary-foreground ring-border hover:-translate-y-0.5 hover:bg-winter/10 hover:text-primary hover:ring-winter/40",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {/* Standings */}
        <Card className="overflow-hidden border-t-4 border-t-accent lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Trophy className="size-5" />
              </span>
              Tabla de posiciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-center">PJ</TableHead>
                    <TableHead className="text-center">G</TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">
                      <span title="Canchas a favor / en contra">Canchas</span>
                    </TableHead>
                    <TableHead className="text-center">Pts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.standings.map((r) => (
                    <TableRow
                      key={r.team}
                      className={cn(
                        r.pos === 1 && "bg-accent/5",
                        r.pos <= 3 && "font-medium",
                      )}
                    >
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full text-xs font-bold",
                            podiumClass(r.pos),
                          )}
                        >
                          {r.pos}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          {r.pos <= 3 && (
                            <Medal className={cn("size-4", podiumIcon(r.pos))} />
                          )}
                          {r.team}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {r.played}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {r.won}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {r.lost}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {r.courtsFor}:{r.courtsAgainst}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex min-w-7 justify-center rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                          {r.points}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              PJ: jugados · G: ganados · P: perdidos · Canchas: a favor:en
              contra · Pts: 3 por serie ganada.
            </p>
          </CardContent>
        </Card>

        {/* Next round */}
        <Card className="overflow-hidden border-t-4 border-t-winter">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-winter/15 text-winter">
                <CalendarClock className="size-5" />
              </span>
              Próxima fecha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nextDate && (
              <Badge className="gap-1 bg-winter text-winter-foreground hover:bg-winter">
                <Snowflake className="size-3" />
                {formatDate(nextDate)}
              </Badge>
            )}
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay series programadas por el momento.
              </p>
            )}
            {upcoming.map((m, i) => (
              <div
                key={i}
                className="rounded-xl border border-border border-l-4 border-l-winter bg-winter/5 p-3"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {m.round}
                </p>
                <div className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                  <span className="text-pretty">{m.home}</span>
                  <span className="text-xs text-muted-foreground">vs</span>
                  <span className="text-pretty text-right">{m.away}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* All results */}
      <Card className="mt-6 overflow-hidden border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ListChecks className="size-5" />
            </span>
            Todos los resultados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {played.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Todavía no hay fechas jugadas en esta categoría.
            </p>
          )}
          {played.map((m, i) => (
            <SeriesCard key={i} match={m} categoryId={active} />
          ))}
        </CardContent>
      </Card>

      {/* Fixture */}
      <Card className="mt-6 overflow-hidden border-t-4 border-t-winter">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <span className="flex size-8 items-center justify-center rounded-xl bg-winter/15 text-winter">
              <CalendarClock className="size-5" />
            </span>
            Fixture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Serie</TableHead>
                  <TableHead className="text-center">Canchas</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.matches.map((m, i) => {
                  const res = seriesResult(m.courts)
                  return (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(m.date)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {m.home}{" "}
                        <span className="text-muted-foreground">vs</span>{" "}
                        {m.away}
                      </TableCell>
                      <TableCell className="text-center text-sm font-semibold text-foreground">
                        {m.status === "played" ? `${res.home}–${res.away}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.status === "played" ? (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary"
                          >
                            Jugada
                          </Badge>
                        ) : (
                          <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                            Por jugar
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Teams */}
      <Card className="mt-6 overflow-hidden border-t-4 border-t-accent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading">
            <span className="flex size-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Users className="size-5" />
            </span>
            Equipos participantes
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.teams.map((t, i) => (
            <Link
              key={t.name}
              href={`/liga-invierno/equipo/${slugify(t.name)}`}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-winter/50 hover:shadow-md"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold",
                  TEAM_TINTS[i % TEAM_TINTS.length],
                )}
              >
                {t.name.charAt(0)}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1 font-heading font-bold text-foreground">
                  {t.name}
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-winter" />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t.players[0]} · {t.players[1]}
                </p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
      </div>
    </section>
  )
}

function podiumClass(pos: number) {
  if (pos === 1) return "bg-amber-400 text-amber-950"
  if (pos === 2) return "bg-slate-300 text-slate-800"
  if (pos === 3) return "bg-orange-400 text-orange-950"
  return "bg-secondary text-secondary-foreground"
}

function podiumIcon(pos: number) {
  if (pos === 1) return "text-amber-500"
  if (pos === 2) return "text-slate-400"
  if (pos === 3) return "text-orange-500"
  return "text-muted-foreground"
}

function SeriesCard({
  match,
  categoryId,
}: {
  match: Match
  categoryId: CategoryId
}) {
  const [open, setOpen] = useState(false)
  const detail = getSeriesDetail(categoryId, match)
  const homeWon = detail.homeScore > detail.awayScore

  return (
    <div className="overflow-hidden rounded-2xl border border-border border-l-4 border-l-primary">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/50"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ListChecks className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-bold text-foreground">
            <span className={cn(homeWon && "text-primary")}>{match.home}</span>{" "}
            <span className="text-muted-foreground">vs</span>{" "}
            <span className={cn(!homeWon && "text-primary")}>{match.away}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {match.round} · {formatDate(match.date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary">
            {detail.homeScore}–{detail.awayScore}
          </Badge>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-2 border-t border-border bg-secondary/30 p-3">
          {detail.courts.map((c) => (
            <CourtRow key={c.court} court={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CourtRow({ court }: { court: CourtDetail }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin className="size-3.5 text-winter" />
          Cancha {court.court}
        </span>
        {court.wo && (
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">
            W.O.
          </Badge>
        )}
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <PairCell players={court.homePlayers} winner={court.winner === "home"} />
        <span className="font-heading text-sm font-bold text-foreground">
          {court.score}
        </span>
        <PairCell
          players={court.awayPlayers}
          winner={court.winner === "away"}
          align="right"
        />
      </div>
    </div>
  )
}

function PairCell({
  players,
  winner,
  align = "left",
}: {
  players: [string, string]
  winner: boolean
  align?: "left" | "right"
}) {
  return (
    <div className={cn(align === "right" && "text-right")}>
      {players.map((p) => (
        <p
          key={p}
          className={cn(
            "truncate text-xs",
            winner
              ? "font-bold text-foreground"
              : "font-medium text-muted-foreground",
          )}
        >
          {p}
        </p>
      ))}
    </div>
  )
}


7. components/liga/liga-reglamento.tsx

import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

const RULES = [
  "El torneo es por equipos en modalidad dobles.",
  "Cada serie enfrenta a dos equipos y se juega en 3 canchas.",
  "Gana la serie el equipo que se impone en 2 de las 3 canchas.",
  "Se otorgan 3 puntos por serie ganada y 0 por serie perdida.",
  "En caso de igualdad de puntos, se define por diferencia de canchas.",
]

export function LigaReglamento() {
  return (
    <section
      id="reglamento"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-24"
    >
      <div className="rounded-3xl bg-secondary/60 p-6 ring-1 ring-border sm:p-10">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="size-5" />
          <h2 className="font-heading text-xl font-bold">Reglamento</h2>
        </div>
        <ul className="mt-5 space-y-3">
          {RULES.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              {r}
            </li>
          ))}
        </ul>
        <Button
          asChild
          size="lg"
          className="mt-7 h-12 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <a
            href="/reglamento-liga-invierno.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="size-5" />
            Reglamento completo
          </a>
        </Button>
      </div>
    </section>
  )
}


8. components/liga/team-detail.tsx

"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronDown,
  Crown,
  Users,
  Trophy,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Snowflake,
  MapPin,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDate, type TeamDetail } from "@/lib/equipos"

export function TeamDetailView({ team }: { team: TeamDetail }) {
  const [open, setOpen] = useState<number | null>(0)

  const winRate =
    team.stats.played > 0
      ? Math.round((team.stats.won / team.stats.played) * 100)
      : 0

  const stats = [
    { label: "Posición", value: `${team.stats.position}º`, accent: "accent" },
    { label: "Puntos", value: team.stats.points, accent: "primary" },
    { label: "PJ", value: team.stats.played, accent: "winter" },
    { label: "Ganados", value: team.stats.won, accent: "primary" },
    { label: "Perdidos", value: team.stats.lost, accent: "winter" },
    { label: "Efectividad", value: `${winRate}%`, accent: "accent" },
  ] as const

  return (
    <div className="relative isolate overflow-hidden">
      {/* Frosty backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-winter/15 via-background to-background"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-10 -z-10 size-72 rounded-full bg-winter/20 blur-3xl"
      />

      {/* Hero header */}
      <header className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-winter/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <Link
            href="/liga-invierno"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a la Liga de Invierno
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-accent font-heading text-2xl font-extrabold text-accent-foreground shadow-lg ring-4 ring-primary-foreground/10">
              {team.name.charAt(0)}
            </span>
            <div>
              <Badge className="gap-1 bg-winter text-winter-foreground hover:bg-winter">
                <Snowflake className="size-3" />
                {team.categoryLabel}
              </Badge>
              <h1 className="mt-2 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                {team.name}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary-foreground/80">
                <Crown className="size-4 text-accent" />
                Capitán: {team.captain}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-2xl border bg-card p-3 text-center shadow-sm",
                s.accent === "accent" && "border-t-2 border-t-accent",
                s.accent === "primary" && "border-t-2 border-t-primary",
                s.accent === "winter" && "border-t-2 border-t-winter",
              )}
            >
              <p className="font-heading text-2xl font-extrabold text-foreground">
                {s.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Roster - lista de buena fe */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Users className="size-5" />
              </span>
              Lista de buena fe
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {team.roster.map((player) => {
              const isCaptain = player === team.captain
              return (
                <div
                  key={player}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5",
                    isCaptain && "border-accent/40 bg-accent/5",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {player.charAt(0)}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {player}
                  </span>
                  {isCaptain && (
                    <Badge className="ml-auto gap-1 bg-accent text-accent-foreground hover:bg-accent">
                      <Crown className="size-3" />
                      Capitán
                    </Badge>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Fechas jugadas */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Trophy className="size-5" />
              </span>
              Fechas jugadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.played.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay fechas jugadas.
              </p>
            )}
            {team.played.map((d, i) => {
              const isOpen = open === i
              const won = d.result === "win"
              return (
                <div
                  key={i}
                  className={cn(
                    "overflow-hidden rounded-2xl border",
                    won
                      ? "border-l-4 border-l-primary border-border"
                      : "border-l-4 border-l-destructive border-border",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        won
                          ? "bg-primary/15 text-primary"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {won ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        <XCircle className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm font-bold text-foreground">
                        {d.round} · vs {d.opponent}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(d.date)} · {d.isHome ? "Local" : "Visitante"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          won
                            ? "bg-primary text-primary-foreground hover:bg-primary"
                            : "bg-destructive text-destructive-foreground hover:bg-destructive",
                        )}
                      >
                        {won ? "Ganó" : "Perdió"} {d.courtsWon}-{d.courtsLost}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          "size-5 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-2 border-t border-border bg-secondary/30 p-3">
                      {d.courts.map((c) => {
                        const teamWonCourt = c.winner === "home" === d.isHome
                        return (
                          <div
                            key={c.court}
                            className="rounded-xl border border-border bg-card p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <MapPin className="size-3.5 text-winter" />
                                Cancha {c.court}
                              </span>
                              {c.wo ? (
                                <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                                  W.O.
                                </Badge>
                              ) : (
                                <Badge
                                  className={cn(
                                    teamWonCourt
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {teamWonCourt ? "Ganada" : "Perdida"}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              <PairCell
                                players={c.homePlayers}
                                winner={c.winner === "home"}
                              />
                              <span className="font-heading text-sm font-bold text-foreground">
                                {c.score}
                              </span>
                              <PairCell
                                players={c.awayPlayers}
                                winner={c.winner === "away"}
                                align="right"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Fixture pendiente */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-winter">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-winter/15 text-winter">
                <CalendarClock className="size-5" />
              </span>
              Fixture pendiente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.pending.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay fechas pendientes por el momento.
              </p>
            )}
            {team.pending.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-border border-l-4 border-l-winter bg-winter/5 p-4"
              >
                <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-winter/15 text-winter">
                  <Snowflake className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-sm font-bold text-foreground">
                    {d.round} · vs {d.opponent}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(d.date)} · {d.time} hs ·{" "}
                    {d.isHome ? "Local" : "Visitante"}
                  </p>
                </div>
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                  Por jugar
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PairCell({
  players,
  winner,
  align = "left",
}: {
  players: [string, string]
  winner: boolean
  align?: "left" | "right"
}) {
  return (
    <div className={cn(align === "right" && "text-right")}>
      {players.map((p) => (
        <p
          key={p}
          className={cn(
            "truncate text-xs",
            winner
              ? "font-bold text-foreground"
              : "font-medium text-muted-foreground",
          )}
        >
          {p}
        </p>
      ))}
    </div>
  )
}


9. components/decorations/snowfall.tsx

import { Snowflake } from "lucide-react"
import { cn } from "@/lib/utils"

// Deterministic snowflake field (no random => no hydration mismatch).
// Decorative only; hidden from assistive tech.
const FLAKES = [
  { left: "6%", size: 14, delay: "0s", duration: "11s", drift: "1.5rem", opacity: 0.5 },
  { left: "18%", size: 10, delay: "3s", duration: "14s", drift: "-1rem", opacity: 0.35 },
  { left: "29%", size: 18, delay: "1.5s", duration: "9s", drift: "2rem", opacity: 0.6 },
  { left: "41%", size: 12, delay: "5s", duration: "13s", drift: "-1.5rem", opacity: 0.4 },
  { left: "53%", size: 16, delay: "2s", duration: "10s", drift: "1rem", opacity: 0.55 },
  { left: "64%", size: 10, delay: "6s", duration: "15s", drift: "-2rem", opacity: 0.3 },
  { left: "73%", size: 20, delay: "0.5s", duration: "8s", drift: "1.5rem", opacity: 0.6 },
  { left: "84%", size: 13, delay: "4s", duration: "12s", drift: "-1rem", opacity: 0.45 },
  { left: "92%", size: 11, delay: "2.5s", duration: "13s", drift: "1rem", opacity: 0.4 },
]

export function Snowfall({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {FLAKES.map((f, i) => (
        <Snowflake
          key={i}
          className="absolute -top-6 animate-snow text-winter-foreground"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            animationDelay: f.delay,
            animationDuration: f.duration,
            // custom prop consumed by the snow-fall keyframes
            ["--snow-drift" as string]: f.drift,
          }}
        />
      ))}
    </div>
  )
}


10. components/ui/badge.tsx

import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }


11. components/ui/button.tsx

import * as React from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
        outline:
          'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
        ghost:
          'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
        destructive:
          'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  children,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  // Support shadcn-style `asChild` by mapping to Base UI's `render` prop.
  if (asChild && React.isValidElement(children)) {
    return (
      <ButtonPrimitive
        data-slot="button"
        nativeButton={false}
        className={cn(buttonVariants({ variant, size, className }))}
        render={children as React.ReactElement<Record<string, unknown>>}
        {...props}
      />
    )
  }

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }


12. components/ui/card.tsx

import * as React from "react"

import { cn } from "@/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}


13. components/ui/table.tsx

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}


14. components/ui/tabs.tsx

"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-horizontal/tabs:h-8 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent dark:group-data-[variant=line]/tabs-list:data-active:border-transparent dark:group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-background data-active:text-foreground dark:data-active:border-input dark:data-active:bg-input/30 dark:data-active:text-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-5px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }


Requisitos:
- Usar datos mockeados desde /content o /lib/mocks.
- No conectar Supabase todavía.
- No cambiar reglas deportivas.
- No hardcodear datos dentro de componentes si pueden vivir en mocks.
- Crear componentes reutilizables:
 - TournamentHeader
 - CategoryTabs
 - StandingsTable
 - FixtureList
 - ResultCard
 - SeriesDetail
 - CourtMatchDetail
 - TeamCard
 - TeamSchedule
- Ejecutar lint y build al final