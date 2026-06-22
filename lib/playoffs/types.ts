import type { Team } from "@/lib/tournament/types"

export type PlayoffSlot = {
  seed: number
  team: Team
}

export type QuarterFinalMatchup = {
  matchNumber: 1 | 2
  home: PlayoffSlot
  away: PlayoffSlot
  seriesId?: string
  scheduledDate?: string
  scheduledTime?: string
  status: "pending" | "scheduled" | "completed" | "walkover"
  winnerTeamId?: string
}

export type ProvisionalBracket = {
  byes: [PlayoffSlot, PlayoffSlot]
  quarterfinals: [QuarterFinalMatchup, QuarterFinalMatchup]
}
