import { createClient } from "@/lib/supabase/server"
import { calculateZoneStandings } from "@/lib/mid-master/calculateZoneStandings"
import type {
  DbMmCategory,
  DbMmGroup,
  DbMmMatch,
  DbMmParticipant,
  MmCategoryAdminData,
  MmGroupWithData,
} from "./types"
import { getZoneSize } from "./types"
import type {
  MmCategory,
  MmKnockout,
  MmKnockoutMatch,
  MmMatch,
  MmParticipant,
  MmStandingsRow,
  MmZone,
  MatchStatus,
} from "@/lib/mid-master/types"

// ── Raw DB queries ────────────────────────────────────────────────────────────

export async function getMmCategories(): Promise<DbMmCategory[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("mid_master_categories")
    .select("*")
    .order("sort_order", { ascending: true })
  return (data as DbMmCategory[]) ?? []
}

export async function getMmCategoryBySlug(slug: string): Promise<DbMmCategory | null> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("mid_master_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()
  return (data as DbMmCategory) ?? null
}

export async function getMmGroupsByCategory(categoryId: string): Promise<DbMmGroup[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("mid_master_groups")
    .select("*")
    .eq("category_id", categoryId)
    .order("name", { ascending: true })
  return (data as DbMmGroup[]) ?? []
}

export async function getMmParticipantsByGroup(groupId: string): Promise<DbMmParticipant[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("mid_master_participants")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: true })
  return (data as DbMmParticipant[]) ?? []
}

export async function getMmMatchesByCategory(categoryId: string): Promise<DbMmMatch[]> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("mid_master_matches")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: true })
  return (data as DbMmMatch[]) ?? []
}

// ── Adapters: DB → public component types ─────────────────────────────────────

function adaptParticipant(p: DbMmParticipant): MmParticipant {
  return { id: p.id, displayName: p.display_name }
}

function adaptMatch(m: DbMmMatch): MmMatch {
  return {
    id: m.id,
    participantAId: m.participant_a_id ?? "",
    participantBId: m.participant_b_id ?? "",
    status: (m.status as MatchStatus) ?? "pending",
    scheduledDate: m.scheduled_date ?? undefined,
    scheduledTime: m.scheduled_time ?? undefined,
    score: m.score ?? undefined,
    winnerId: m.winner_id ?? undefined,
  }
}

function normalizeGroupName(raw: string): "Zona A" | "Zona B" {
  const upper = raw.toUpperCase()
  if (upper.includes("A")) return "Zona A"
  return "Zona B"
}

function adaptGroup(
  group: DbMmGroup,
  participants: DbMmParticipant[],
  groupMatches: DbMmMatch[],
): MmZone {
  const mmParticipants = participants.map(adaptParticipant)
  const mmMatches = groupMatches.map(adaptMatch)

  const standingRows = calculateZoneStandings(participants, groupMatches)
  const mmStandings: MmStandingsRow[] = standingRows.map((r) => ({
    participantId: r.participantId,
    position: r.position,
    played: r.played,
    won: r.won,
    lost: r.lost,
    setsWon: r.setsWon,
    setsLost: r.setsLost,
    setsDiff: r.setsDiff,
    gamesWon: r.gamesWon,
    gamesLost: r.gamesLost,
    gamesDiff: r.gamesDiff,
    advances: r.advances,
  }))

  return {
    id: group.id,
    name: normalizeGroupName(group.name),
    participants: mmParticipants,
    matches: mmMatches,
    standings: mmStandings,
  }
}

function emptyKnockoutMatch(id: string, phase: "semifinal" | "final", label: string, labelA: string, labelB: string): MmKnockoutMatch {
  return { id, phase, label, participantALabel: labelA, participantBLabel: labelB, status: "pending" }
}

function adaptKnockout(knockoutMatches: DbMmMatch[], allParticipants: DbMmParticipant[]): MmKnockout {
  const semis = knockoutMatches.filter((m) => m.phase === "semifinal")
  const finals = knockoutMatches.filter((m) => m.phase === "final")

  function adaptKM(m: DbMmMatch): MmKnockoutMatch {
    const pA = m.participant_a_id
      ? allParticipants.find((p) => p.id === m.participant_a_id)?.display_name
      : undefined
    const pB = m.participant_b_id
      ? allParticipants.find((p) => p.id === m.participant_b_id)?.display_name
      : undefined
    return {
      id: m.id,
      phase: m.phase as "semifinal" | "final",
      label: m.phase === "final" ? "Final" : `Semifinal`,
      participantAId: m.participant_a_id ?? undefined,
      participantBId: m.participant_b_id ?? undefined,
      participantALabel: pA ?? m.participant_a_label,
      participantBLabel: pB ?? m.participant_b_label,
      status: (m.status as MatchStatus) ?? "pending",
      scheduledDate: m.scheduled_date ?? undefined,
      scheduledTime: m.scheduled_time ?? undefined,
      score: m.score ?? undefined,
      winnerId: m.winner_id ?? undefined,
    }
  }

  return {
    semifinal1: semis[0] ? adaptKM(semis[0]) : emptyKnockoutMatch("sf1", "semifinal", "Semifinal 1", "1° Zona A", "2° Zona B"),
    semifinal2: semis[1] ? adaptKM(semis[1]) : emptyKnockoutMatch("sf2", "semifinal", "Semifinal 2", "1° Zona B", "2° Zona A"),
    final: finals[0] ? adaptKM(finals[0]) : emptyKnockoutMatch("f", "final", "Final", "Ganador SF 1", "Ganador SF 2"),
  }
}

// ── Public composite queries ──────────────────────────────────────────────────

export async function getMmCategoriesForPublic(): Promise<MmCategory[]> {
  const categories = await getMmCategories()
  if (categories.length === 0) return []

  const results = await Promise.all(categories.map(async (cat) => {
    const [groups, matches] = await Promise.all([
      getMmGroupsByCategory(cat.id),
      getMmMatchesByCategory(cat.id),
    ])

    const groupA = groups.find((g) => g.name.toUpperCase().includes("A")) ?? groups[0]
    const groupB = groups.find((g) => g.name.toUpperCase().includes("B")) ?? groups[1]
    if (!groupA || !groupB) return null

    const [participantsA, participantsB] = await Promise.all([
      getMmParticipantsByGroup(groupA.id),
      getMmParticipantsByGroup(groupB.id),
    ])

    const allParticipants = [...participantsA, ...participantsB]
    const knockoutMatches = matches.filter((m) => m.group_id === null)

    return {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      shortName: cat.short_name ?? cat.name,
      type: cat.type,
      zoneSize: getZoneSize(cat),
      zones: [
        adaptGroup(groupA, participantsA, matches.filter((m) => m.group_id === groupA.id)),
        adaptGroup(groupB, participantsB, matches.filter((m) => m.group_id === groupB.id)),
      ] as [MmZone, MmZone],
      knockout: adaptKnockout(knockoutMatches, allParticipants),
    } satisfies MmCategory
  }))

  return results.filter((r): r is MmCategory => r !== null)
}

export async function getMmCategoryForPublic(slug: string): Promise<MmCategory | null> {
  const cat = await getMmCategoryBySlug(slug)
  if (!cat) return null

  const [groups, matches] = await Promise.all([
    getMmGroupsByCategory(cat.id),
    getMmMatchesByCategory(cat.id),
  ])

  const groupA = groups.find((g) => g.name.toUpperCase().includes("A")) ?? groups[0]
  const groupB = groups.find((g) => g.name.toUpperCase().includes("B")) ?? groups[1]
  if (!groupA || !groupB) return null

  const [participantsA, participantsB] = await Promise.all([
    getMmParticipantsByGroup(groupA.id),
    getMmParticipantsByGroup(groupB.id),
  ])

  const allParticipants = [...participantsA, ...participantsB]
  const knockoutMatches = matches.filter((m) => m.group_id === null)

  return {
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    shortName: cat.short_name ?? cat.name,
    type: cat.type,
    zoneSize: getZoneSize(cat),
    zones: [
      adaptGroup(groupA, participantsA, matches.filter((m) => m.group_id === groupA.id)),
      adaptGroup(groupB, participantsB, matches.filter((m) => m.group_id === groupB.id)),
    ] as [MmZone, MmZone],
    knockout: adaptKnockout(knockoutMatches, allParticipants),
  }
}

// ── Admin composite query ─────────────────────────────────────────────────────

export async function getMmCategoryAdminData(slug: string): Promise<MmCategoryAdminData | null> {
  const cat = await getMmCategoryBySlug(slug)
  if (!cat) return null

  const [groups, matches] = await Promise.all([
    getMmGroupsByCategory(cat.id),
    getMmMatchesByCategory(cat.id),
  ])

  const groupA = groups.find((g) => g.name.toUpperCase().includes("A")) ?? groups[0]
  const groupB = groups.find((g) => g.name.toUpperCase().includes("B")) ?? groups[1]
  if (!groupA || !groupB) return null

  const [participantsA, participantsB] = await Promise.all([
    getMmParticipantsByGroup(groupA.id),
    getMmParticipantsByGroup(groupB.id),
  ])

  const knockoutMatches = matches.filter((m) => m.group_id === null)

  const buildGroupData = (group: DbMmGroup, participants: DbMmParticipant[]): MmGroupWithData => ({
    group,
    participants,
    matches: matches.filter((m) => m.group_id === group.id),
  })

  return {
    category: cat,
    groupA: buildGroupData(groupA, participantsA),
    groupB: buildGroupData(groupB, participantsB),
    knockoutMatches,
    allParticipants: [...participantsA, ...participantsB],
  }
}
