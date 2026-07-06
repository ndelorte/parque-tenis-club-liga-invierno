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
import { getZoneSize, getDisplayOrder, normalizeType } from "./types"
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRow = Record<string, any>

// Cast helper: permite queries a tablas mid_master_* fuera del tipo Database
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function supabase(): Promise<any> {
  return createClient()
}

function logError(fn: string, error: unknown) {
  console.error(`[mid-master] ${fn}:`, JSON.stringify(error))
}

// ── Schema helpers: extraen valores de columnas con nombre desconocido ────────

/** Lee el nombre del participante desde cualquier columna posible */
function getParticipantName(row: AnyRow): string {
  return (
    row.display_name ?? row.name ?? row.full_name ??
    row.player_name ?? row.participant_name ?? "—"
  )
}

/** Lee el group_id desde cualquier columna FK posible */
function getMatchGroupId(row: AnyRow): string | null {
  const v = row.group_id ?? row.zone_id ?? row.round_id ?? row.group ?? null
  return v ?? null
}

/** Lee la fase del partido desde cualquier columna posible */
function getMatchPhase(row: AnyRow): string {
  return row.phase ?? row.stage ?? row.round ?? row.type ?? ""
}

/** Lee el status del partido desde cualquier columna posible */
function getMatchStatus(row: AnyRow): string {
  return row.status ?? row.state ?? "pending"
}

// ── Raw DB queries ────────────────────────────────────────────────────────────

export async function getMmCategories(): Promise<DbMmCategory[]> {
  const sb = await supabase()
  const { data, error } = await sb.from("mid_master_categories").select("*")
  if (error) { logError("getMmCategories", error); return [] }
  if (!data?.length) return []
  return (data as DbMmCategory[]).sort((a, b) => {
    const ao = getDisplayOrder(a), bo = getDisplayOrder(b)
    if (ao !== bo) return ao - bo
    return a.name.localeCompare(b.name)
  })
}

export async function getMmCategoryBySlug(slug: string): Promise<DbMmCategory | null> {
  const sb = await supabase()
  const { data, error } = await sb.from("mid_master_categories").select("*").eq("slug", slug).maybeSingle()
  if (error) { logError("getMmCategoryBySlug", error); return null }
  return (data as DbMmCategory) ?? null
}

export async function getMmGroupsByCategory(categoryId: string): Promise<DbMmGroup[]> {
  const sb = await supabase()
  const { data, error } = await sb.from("mid_master_groups").select("*").eq("category_id", categoryId)
  if (error) { logError("getMmGroupsByCategory", error); return [] }
  return ((data as DbMmGroup[]) ?? []).sort((a, b) =>
    ((a.display_order ?? 999) - (b.display_order ?? 999)) || a.name.localeCompare(b.name)
  )
}

/** Busca participantes probando múltiples nombres de columna FK.
 *  Primero valida la columna con limit=0, luego hace el query real. */
export async function getMmParticipantsByGroup(groupId: string): Promise<DbMmParticipant[]> {
  const sb = await supabase()
  const fkCols = ["group_id", "zone_id", "group", "mid_master_group_id"]

  // 1. Encontrar la columna FK válida
  let validCol: string | null = null
  for (const col of fkCols) {
    const { error } = await sb
      .from("mid_master_participants")
      .select(col)
      .limit(0)
    if (!error) { validCol = col; break }
    const isColError = error.message?.includes("schema cache") ||
      error.message?.includes("Could not find") ||
      error.message?.includes("does not exist")
    if (!isColError) { logError(`getMmParticipantsByGroup probe [${col}]`, error); break }
  }

  if (!validCol) {
    logError("getMmParticipantsByGroup", `No se encontró columna FK. Probado: ${fkCols.join(", ")}`)
    return []
  }

  // 2. Query real con la columna confirmada
  const { data, error } = await sb
    .from("mid_master_participants")
    .select("*")
    .eq(validCol, groupId)

  if (error) { logError(`getMmParticipantsByGroup [${validCol}]`, error); return [] }
  return (data as DbMmParticipant[]) ?? []
}

export async function getMmMatchesByCategory(categoryId: string): Promise<AnyRow[]> {
  const sb = await supabase()
  const { data, error } = await sb.from("mid_master_matches").select("*").eq("category_id", categoryId)
  if (error) { logError("getMmMatchesByCategory", error); return [] }
  return data ?? []
}

// ── Adapters: DB → public component types ────────────────────────────────────

function adaptParticipant(p: AnyRow): MmParticipant {
  return { id: p.id, displayName: getParticipantName(p) }
}

function adaptMatch(m: AnyRow): MmMatch {
  return {
    id: m.id,
    participantAId: m.participant_a_id ?? m.player_a_id ?? "",
    participantBId: m.participant_b_id ?? m.player_b_id ?? "",
    status: getMatchStatus(m) as MatchStatus,
    scheduledDate: m.scheduled_date ?? undefined,
    scheduledTime: m.scheduled_time ?? undefined,
    score: m.score ?? undefined,
    winnerId: m.winner_id ?? undefined,
  }
}

function normalizeGroupName(raw: string): "Zona A" | "Zona B" {
  const upper = raw.toUpperCase().trim()
  if (upper === "A" || upper.endsWith(" A") || upper.startsWith("A")) return "Zona A"
  return "Zona B"
}

function isGroupA(group: DbMmGroup): boolean {
  const upper = group.name.toUpperCase().trim()
  return upper === "A" || upper.endsWith(" A") || upper.startsWith("A") ||
    (group.display_order ?? 999) < 2
}

function adaptGroup(
  group: DbMmGroup,
  participants: AnyRow[],
  groupMatches: AnyRow[],
): MmZone {
  const standingRows = calculateZoneStandings(
    participants as DbMmParticipant[],
    groupMatches as DbMmMatch[],
  )
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

function adaptKnockout(knockoutMatches: AnyRow[], allParticipants: AnyRow[]): MmKnockout {
  const semis = knockoutMatches.filter((m) => getMatchPhase(m) === "semifinal")
  const finals = knockoutMatches.filter((m) => getMatchPhase(m) === "final")

  function adaptKM(m: AnyRow): MmKnockoutMatch {
    const aId = m.participant_a_id ?? m.player_a_id
    const bId = m.participant_b_id ?? m.player_b_id
    const pA = aId ? getParticipantName(allParticipants.find((p) => p.id === aId) ?? {}) : undefined
    const pB = bId ? getParticipantName(allParticipants.find((p) => p.id === bId) ?? {}) : undefined
    const phase = getMatchPhase(m) as "semifinal" | "final"
    return {
      id: m.id,
      phase,
      label: phase === "final" ? "Final" : "Semifinal",
      participantAId: aId ?? undefined,
      participantBId: bId ?? undefined,
      participantALabel: (pA && pA !== "—" ? pA : null) ?? m.participant_a_label ?? "Por definir",
      participantBLabel: (pB && pB !== "—" ? pB : null) ?? m.participant_b_label ?? "Por definir",
      status: getMatchStatus(m) as MatchStatus,
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

// ── Construcción de categoría (común a público y admin) ───────────────────────

async function buildCategory(cat: DbMmCategory): Promise<MmCategory | null> {
  const [groups, allMatches] = await Promise.all([
    getMmGroupsByCategory(cat.id),
    getMmMatchesByCategory(cat.id),
  ])

  const groupA = groups.find(isGroupA) ?? groups[0]
  const groupB = groups.find((g) => !isGroupA(g)) ?? groups[1]
  if (!groupA || !groupB) {
    console.warn(`[mid-master] Categoría ${cat.slug} sin 2 grupos`)
    return null
  }

  const [participantsA, participantsB] = await Promise.all([
    getMmParticipantsByGroup(groupA.id),
    getMmParticipantsByGroup(groupB.id),
  ])

  // Separar partidos de zona y knockout usando el FK de grupo detectado dinámicamente
  const matchesA = allMatches.filter((m) => getMatchGroupId(m) === groupA.id)
  const matchesB = allMatches.filter((m) => getMatchGroupId(m) === groupB.id)
  // Knockout: partidos donde el grupo FK es null o no tiene ninguno de los grupos conocidos
  const knockoutMatches = allMatches.filter((m) => {
    const gid = getMatchGroupId(m)
    return gid === null || (gid !== groupA.id && gid !== groupB.id)
  })

  const allParticipants = [...participantsA, ...participantsB]

  return {
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    shortName: cat.short_name ?? cat.name,
    type: normalizeType(cat.type),
    zoneSize: getZoneSize(cat),
    zones: [
      adaptGroup(groupA, participantsA, matchesA),
      adaptGroup(groupB, participantsB, matchesB),
    ] as [MmZone, MmZone],
    knockout: adaptKnockout(knockoutMatches, allParticipants),
  }
}

// ── Public composite queries ──────────────────────────────────────────────────

export async function getMmCategoriesForPublic(): Promise<MmCategory[]> {
  const categories = await getMmCategories()
  if (!categories.length) return []
  const results = await Promise.all(categories.map(buildCategory))
  return results.filter((r): r is MmCategory => r !== null)
}

export async function getMmCategoryForPublic(slug: string): Promise<MmCategory | null> {
  const cat = await getMmCategoryBySlug(slug)
  if (!cat) return null
  return buildCategory(cat)
}

// ── Admin composite query ─────────────────────────────────────────────────────

export async function getMmCategoryAdminData(slug: string): Promise<MmCategoryAdminData | null> {
  const cat = await getMmCategoryBySlug(slug)
  if (!cat) return null

  const [groups, matches] = await Promise.all([
    getMmGroupsByCategory(cat.id),
    getMmMatchesByCategory(cat.id),
  ])

  const groupA = groups.find(isGroupA) ?? groups[0]
  const groupB = groups.find((g) => !isGroupA(g)) ?? groups[1]
  if (!groupA || !groupB) return null

  const [participantsA, participantsB] = await Promise.all([
    getMmParticipantsByGroup(groupA.id),
    getMmParticipantsByGroup(groupB.id),
  ])

  const knockoutMatches = matches.filter((m: AnyRow) => {
    const gid = getMatchGroupId(m)
    return gid === null || (gid !== groupA.id && gid !== groupB.id)
  }) as DbMmMatch[]

  return {
    category: cat,
    groupA: {
      group: groupA,
      participants: participantsA as DbMmParticipant[],
      matches: matches.filter((m: AnyRow) => getMatchGroupId(m) === groupA.id) as DbMmMatch[],
    },
    groupB: {
      group: groupB,
      participants: participantsB as DbMmParticipant[],
      matches: matches.filter((m: AnyRow) => getMatchGroupId(m) === groupB.id) as DbMmMatch[],
    },
    knockoutMatches,
    allParticipants: [...participantsA, ...participantsB] as DbMmParticipant[],
  }
}
