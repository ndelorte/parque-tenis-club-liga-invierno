// ── DB row types — reflejo exacto del esquema real de Supabase ───────────────

export interface DbMmEdition {
  id: string
  slug: string
  name: string
  year: number
  status: "upcoming" | "active" | "finished"
  created_at?: string
}

export interface DbMmCategory {
  id: string
  edition_id: string
  name: string
  slug: string
  type: string               // "single" | "double"
  display_order?: number | null
  group_size?: number | null
  is_active?: boolean | null
  created_at?: string
}

export interface DbMmGroup {
  id: string
  category_id: string
  name: string               // "A" | "B"
  display_order?: number | null
  created_at?: string
}

export interface DbMmParticipant {
  id: string
  category_id: string        // FK a mid_master_categories
  name: string               // nombre del jugador/pareja
  slug?: string | null
  seed?: number | null
  group_name: string         // "A" | "B" — en qué zona juega
  display_order?: number | null
  is_active?: boolean | null
  created_at?: string
}

export interface DbMmMatch {
  id: string
  category_id: string
  group_id: string | null    // FK a mid_master_groups (null = knockout)
  phase: string              // "group" | "semifinal" | "final"
  match_order?: number | null
  participant_1_id: string | null
  participant_2_id: string | null
  winner_participant_id: string | null
  scheduled_date: string | null
  scheduled_time: string | null
  score: string | null
  status: string             // "pending" | "scheduled" | "played" | "walkover"
  observations?: string | null
  created_at?: string
  updated_at?: string
}

// ── Aggregated types for admin pages ─────────────────────────────────────────

export interface MmGroupWithData {
  group: DbMmGroup
  participants: DbMmParticipant[]
  matches: DbMmMatch[]
}

export interface MmCategoryAdminData {
  category: DbMmCategory
  groupA: MmGroupWithData
  groupB: MmGroupWithData
  knockoutMatches: DbMmMatch[]
  allParticipants: DbMmParticipant[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function normalizeType(raw: string): "singles" | "doubles" {
  if (raw === "single" || raw === "singles") return "singles"
  return "doubles"
}

export function getZoneSize(cat: DbMmCategory): 3 | 4 {
  const n = cat.group_size ?? 4
  return n === 3 ? 3 : 4
}

export function getDisplayOrder(cat: DbMmCategory): number {
  return cat.display_order ?? 999
}
