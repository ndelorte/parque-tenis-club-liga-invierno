// DB row types — derivados de lib/supabase/types.ts (tablas circuito_*
// tipadas desde el día 1, ver ADR-005; no repetir el patrón `any` de
// mid_master_*).

import type { Database } from "@/lib/supabase/types"

export type CircuitoEditionRow = Database["public"]["Tables"]["circuito_editions"]["Row"]
export type CircuitoCategoryRow = Database["public"]["Tables"]["circuito_categories"]["Row"]
export type CircuitoParticipantRow = Database["public"]["Tables"]["circuito_participants"]["Row"]
export type CircuitoMatchRow = Database["public"]["Tables"]["circuito_matches"]["Row"]
export type CircuitoRankingPointsRow = Database["public"]["Tables"]["circuito_ranking_points"]["Row"]
