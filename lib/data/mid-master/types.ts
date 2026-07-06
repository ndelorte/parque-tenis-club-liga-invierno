// ── DB row types — mapean exactamente las columnas de Supabase ────────────────

export interface DbMmCategory {
  id: string
  name: string
  slug: string
  type: "singles" | "doubles"
  // El usuario puede haber usado zone_size o group_size; ambos se soportan.
  zone_size?: number | null
  group_size?: number | null
  short_name?: string | null
  sort_order?: number | null
  status?: string | null
  created_at?: string
  updated_at?: string
}

export interface DbMmGroup {
  id: string
  category_id: string
  name: string  // "Zona A" | "Zona B" (o "A" | "B")
  created_at?: string
}

export interface DbMmParticipant {
  id: string
  group_id: string
  display_name: string
  seed?: number | null
  active?: boolean | null
  created_at?: string
  updated_at?: string
}

export interface DbMmMatch {
  id: string
  category_id: string
  group_id: string | null    // null = partido de knockout (semifinal / final)
  phase: string              // "group" | "zone" | "semifinal" | "final"
  participant_a_id: string | null
  participant_b_id: string | null
  participant_a_label: string
  participant_b_label: string
  scheduled_date: string | null
  scheduled_time: string | null
  score: string | null
  winner_id: string | null
  status: string             // "pending" | "scheduled" | "completed"
  sets_a: number
  sets_b: number
  games_a: number
  games_b: number
  created_at?: string
  updated_at?: string
}

// ── Aggregated types for UI ───────────────────────────────────────────────────

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

// Helper: effective zone_size fallback
export function getZoneSize(cat: DbMmCategory): 3 | 4 {
  const n = cat.zone_size ?? cat.group_size ?? 4
  return n === 3 ? 3 : 4
}
