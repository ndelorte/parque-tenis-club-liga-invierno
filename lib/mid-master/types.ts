export type MatchStatus = "pending" | "scheduled" | "completed"
export type CategoryType = "singles" | "doubles"

export interface MmParticipant {
  id: string
  displayName: string
}

export interface MmMatch {
  id: string
  participantAId: string
  participantBId: string
  status: MatchStatus
  scheduledDate?: string
  scheduledTime?: string
  score?: string
  winnerId?: string
}

export interface MmStandingsRow {
  participantId: string
  position: number
  played: number
  won: number
  lost: number
  setsWon: number
  setsLost: number
  setsDiff: number
  gamesWon: number
  gamesLost: number
  gamesDiff: number
  advances: boolean
}

export interface MmZone {
  id: string
  name: "Zona A" | "Zona B"
  participants: MmParticipant[]
  matches: MmMatch[]
  standings: MmStandingsRow[]
}

export interface MmKnockoutMatch {
  id: string
  phase: "semifinal" | "final"
  label: string
  participantAId?: string
  participantBId?: string
  participantALabel: string
  participantBLabel: string
  status: MatchStatus
  scheduledDate?: string
  scheduledTime?: string
  score?: string
  winnerId?: string
}

export interface MmKnockout {
  semifinal1: MmKnockoutMatch
  semifinal2: MmKnockoutMatch
  final: MmKnockoutMatch
}

export interface MmCategory {
  id: string
  slug: string
  name: string
  shortName: string
  type: CategoryType
  zoneSize: 3 | 4
  zones: [MmZone, MmZone]
  knockout: MmKnockout
}

export interface MmEdition {
  id: string
  name: string
  year: number
  status: "upcoming" | "active" | "finished"
  categories: MmCategory[]
}

export function lookupParticipant(
  zones: [MmZone, MmZone],
  id: string,
): MmParticipant | undefined {
  return [...zones[0].participants, ...zones[1].participants].find(
    (p) => p.id === id,
  )
}
