import { parseMmScore } from "./parseMmScore"
import type { DbMmMatch, DbMmParticipant } from "@/lib/data/mid-master/types"

export interface ZoneStandingRow {
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

interface Stats {
  played: number
  won: number
  lost: number
  setsWon: number
  setsLost: number
  gamesWon: number
  gamesLost: number
}

/**
 * Calcula standings de una zona a partir de sus partidos ya filtrados.
 * groupMatches: solo los partidos de esta zona (group_id === zone.id).
 */
export function calculateZoneStandings(
  participants: DbMmParticipant[],
  groupMatches: DbMmMatch[],
): ZoneStandingRow[] {
  const statsMap = new Map<string, Stats>()
  for (const p of participants) {
    statsMap.set(p.id, {
      played: 0, won: 0, lost: 0,
      setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0,
    })
  }

  const completedMatches = groupMatches.filter(
    (m) =>
      m.status === "completed" &&
      m.participant_a_id &&
      m.participant_b_id &&
      m.winner_id,
  )

  for (const match of completedMatches) {
    const aId = match.participant_a_id!
    const bId = match.participant_b_id!
    const a = statsMap.get(aId)
    const b = statsMap.get(bId)
    if (!a || !b) continue

    let sA = match.sets_a ?? 0
    let sB = match.sets_b ?? 0
    let gA = match.games_a ?? 0
    let gB = match.games_b ?? 0

    if (match.score) {
      try {
        const parsed = parseMmScore(match.score, false)
        sA = parsed.setsA; sB = parsed.setsB
        gA = parsed.gamesA; gB = parsed.gamesB
      } catch {
        // use stored values
      }
    }

    const aWon = match.winner_id === aId

    a.played++; b.played++
    a.setsWon += sA; a.setsLost += sB
    a.gamesWon += gA; a.gamesLost += gB
    b.setsWon += sB; b.setsLost += sA
    b.gamesWon += gB; b.gamesLost += gA

    if (aWon) { a.won++; b.lost++ }
    else      { b.won++; a.lost++ }
  }

  const rows: ZoneStandingRow[] = participants.map((p) => {
    const s = statsMap.get(p.id)!
    return {
      participantId: p.id,
      position: 0,
      played: s.played,
      won: s.won,
      lost: s.lost,
      setsWon: s.setsWon,
      setsLost: s.setsLost,
      setsDiff: s.setsWon - s.setsLost,
      gamesWon: s.gamesWon,
      gamesLost: s.gamesLost,
      gamesDiff: s.gamesWon - s.gamesLost,
      advances: false,
    }
  })

  const sorted = sortWithH2H(rows, completedMatches)

  return sorted.map((row, i) => ({
    ...row,
    position: i + 1,
    advances: i < 2,
  }))
}

function sortWithH2H(rows: ZoneStandingRow[], matches: DbMmMatch[]): ZoneStandingRow[] {
  return [...rows].sort((a, b) => {
    if (b.won !== a.won) return b.won - a.won
    if (b.setsDiff !== a.setsDiff) return b.setsDiff - a.setsDiff
    if (b.gamesDiff !== a.gamesDiff) return b.gamesDiff - a.gamesDiff

    const h2h = matches.find(
      (m) =>
        (m.participant_a_id === a.participantId && m.participant_b_id === b.participantId) ||
        (m.participant_a_id === b.participantId && m.participant_b_id === a.participantId),
    )
    if (h2h?.winner_id === a.participantId) return -1
    if (h2h?.winner_id === b.participantId) return 1
    return 0
  })
}
