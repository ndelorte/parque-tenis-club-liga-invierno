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

// Cast helper: permite queries a tablas mid_master_* que no están en el tipo Database
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function supabase(): Promise<any> {
  return createClient()
}

function logError(fn: string, error: unknown) {
  console.error(`[mid-master] ${fn}:`, JSON.stringify(error))
}

// ── Raw DB queries ────────────────────────────────────────────────────────────

export async function getMmCategories(): Promise<DbMmCategory[]> {
  const sb = await supabase()
  const { data, error } = await sb
    .from("mid_master_categories")
    .select("*")

  if (error) { logError("getMmCategories", error); return [] }
  if (!data?.length) return []

  // Ordenar client-side por sort_order si existe, sino por name
  return (data as DbMmCategory[]).sort((a, b) => {
    const ao = a.sort_order ?? 999
    const bo = b.sort_order ?? 999
    if (ao !== bo) return ao - bo
    return a.name.localeCompare(b.name)
  })
}

export async function getMmCategoryBySlug(slug: string): Promise<DbMmCategory | null> {
  const sb = await supabase()
  const { data, error } = await sb
    .from("mid_master_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error) { logError("getMmCategoryBySlug", error); return null }
  return (data as DbMmCategory) ?? null
}

export async function getMmGroupsByCategory(categoryId: string): Promise<DbMmGroup[]> {
  const sb = await supabase()
  const { data, error } = await sb
    .from("mid_master_groups")
    .select("*")
    .eq("category_id", categoryId)

  if (error) { logError("getMmGroupsByCategory", error); return [] }
  // Ordenar: Zona A antes que Zona B
  return ((data as DbMmGroup[]) ?? []).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getMmParticipantsByGroup(groupId: string): Promise<DbMmParticipant[]> {
  const sb = await supabase()
  const { data, error } = await sb
    .from("mid_master_participants")
    .select("*")
    .eq("group_id", groupId)

  if (error) { logError("getMmParticipantsByGroup", error); return [] }
  return (data as DbMmParticipant[]) ?? []
}

export async function getMmMatchesByCategory(categoryId: string): Promise<DbMmMatch[]> {
  const sb = await supabase()
  const { data, error } = await sb
    .from("mid_master_matches")
    .select("*")
    .eq("category_id", categoryId)

  if (error) { logError("getMmMatchesByCategory", error); return [] }
  return (data as DbMmMatch[]) ?? []
}

// ── Adapters: DB → public component types ────────────────────────────────────

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
  return raw.toUpperCase().includes("A") ? "Zona A" : "Zona B"
}

function adaptGroup(
  group: DbMmGroup,
  participants: DbMmParticipant[],
  groupMatches: DbMmMatch[],
): MmZone {
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
    participants: participants.map(adaptParticipant),
    matches: groupMatches.map(adaptMatch),
    standings: mmStandings,
  }
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
      label: m.phase === "final" ? "Final" : "Semifinal",
      participantAId: m.participant_a_id ?? undefined,
      participantBId: m.participant_b_id ?? undefined,
      participantALabel: pA ?? m.participant_a_label ?? "Por definir",
      participantBLabel: pB ?? m.participant_b_label ?? "Por definir",
      status: (m.status as MatchStatus) ?? "pending",
      scheduledDate: m.scheduled_date ?? undefined,
      scheduledTime: m.scheduled_time ?? undefined,
      score: m.score ?? undefined,
      winnerId: m.winner_id ?? undefined,
    }
  }

  function emptyKM(id: string, phase: "semifinal" | "final", labelA: string, labelB: string): MmKnockoutMatch {
    return { id, phase, label: phase === "final" ? "Final" : "Semifinal", participantALabel: labelA, participantBLabel: labelB, status: "pending" }
  }

  return {
    semifinal1: semis[0] ? adaptKM(semis[0]) : emptyKM("sf1", "semifinal", "1° Zona A", "2° Zona B"),
    semifinal2: semis[1] ? adaptKM(semis[1]) : emptyKM("sf2", "semifinal", "1° Zona B", "2° Zona A"),
    final: finals[0] ? adaptKM(finals[0]) : emptyKM("f", "final", "Ganador SF 1", "Ganador SF 2"),
  }
}

// ── Public composite queries ──────────────────────────────────────────────────

export async function getMmCategoriesForPublic(): Promise<MmCategory[]> {
  const categories = await getMmCategories()
  if (categories.length === 0) return []

  const results = await Promise.all(
    categories.map(async (cat) => {
      const [groups, matches] = await Promise.all([
        getMmGroupsByCategory(cat.id),
        getMmMatchesByCategory(cat.id),
      ])

      const groupA = groups.find((g) => g.name.toUpperCase().includes("A")) ?? groups[0]
      const groupB = groups.find((g) => g.name.toUpperCase().includes("B")) ?? groups[1]
      if (!groupA || !groupB) {
        console.warn(`[mid-master] Categoría ${cat.slug} no tiene 2 grupos`)
        return null
      }

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
    }),
  )

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

  return {
    category: cat,
    groupA: { group: groupA, participants: participantsA, matches: matches.filter((m) => m.group_id === groupA.id) },
    groupB: { group: groupB, participants: participantsB, matches: matches.filter((m) => m.group_id === groupB.id) },
    knockoutMatches,
    allParticipants: [...participantsA, ...participantsB],
  }
}
