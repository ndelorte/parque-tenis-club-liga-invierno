// ── DB row types — mapean exactamente las columnas de Supabase ────────────────

export interface DbMmCategory {
  id: string
  name: string
  slug: string
  // El usuario cargó "single" / "double" (sin la s)
  type: string
  // Columnas de orden: el usuario usa display_order
  display_order?: number | null
  sort_order?: number | null
  // Tamaño de zona: el usuario usa group_size
  group_size?: number | null
  zone_size?: number | null
  short_name?: string | null
  is_active?: boolean | null
  status?: string | null
  created_at?: string
  updated_at?: string
}

export interface DbMmGroup {
  id: string
  category_id: string
  // El usuario cargó "A" / "B" (sin el prefijo "Zona ")
  name: string
  display_order?: number | null
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

// Helper: normaliza el campo type a "singles" | "doubles"
export function normalizeType(raw: string): "singles" | "doubles" {
  if (raw === "single" || raw === "singles") return "singles"
  return "doubles"
}

// Helper: devuelve el tamaño de zona (3 o 4)
export function getZoneSize(cat: DbMmCategory): 3 | 4 {
  const n = cat.group_size ?? cat.zone_size ?? 4
  return n === 3 ? 3 : 4
}

// Helper: devuelve el orden de visualización
export function getDisplayOrder(cat: DbMmCategory): number {
  return cat.display_order ?? cat.sort_order ?? 999
}
