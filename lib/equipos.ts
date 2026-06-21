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
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000
}

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
          oppRoster as string[],
          m.courts,
          isHome,
          m.date + team.name,
        )
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
    awayRoster as string[],
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
