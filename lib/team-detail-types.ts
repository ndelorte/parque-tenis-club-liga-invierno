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
  categorySlug: string
  categoryLabel: string
  captain: string
  roster: string[]
  stats: TeamStats
  played: PlayedDate[]
  pending: PendingDate[]
}
