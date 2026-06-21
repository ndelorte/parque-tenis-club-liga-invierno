import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { StandingsRow } from "@/lib/tournament/types"
import type { Database } from "@/lib/supabase/types"

type SnapshotRow = Database["public"]["Tables"]["standings_snapshot"]["Row"]
type TeamRow = Database["public"]["Tables"]["teams"]["Row"]

type SnapshotWithTeam = SnapshotRow & { teams: TeamRow }

export async function getStandingsSnapshot(categoryId: string): Promise<StandingsRow[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("standings_snapshot")
    .select("*, teams(*)")
    .eq("category_id", categoryId)
    .order("position")

  if (error || !data) return []

  return (data as unknown as SnapshotWithTeam[]).map((row) => ({
    team_id: row.team_id,
    team: {
      id: row.teams.id,
      category_id: row.teams.category_id,
      name: row.teams.name,
      slug: row.teams.slug,
      captain_name: row.teams.captain_name ?? undefined,
      active: row.teams.active,
    },
    played: row.played,
    won: row.won,
    lost: row.lost,
    points: row.points,
    courts_won: row.courts_won,
    courts_lost: row.courts_lost,
    courts_diff: row.courts_diff,
    sets_won: row.sets_won,
    sets_lost: row.sets_lost,
    sets_diff: row.sets_diff,
    games_won: row.games_won,
    games_lost: row.games_lost,
    games_diff: row.games_diff,
    position: row.position,
  }))
}

// Recalcula y persiste la tabla de posiciones para una categoría.
// Usa admin client para bypassear RLS (operación de sistema, no de usuario).
export async function upsertStandingsSnapshot(
  categoryId: string,
  rows: StandingsRow[],
): Promise<void> {
  const supabase = createAdminClient()

  const payload = rows.map((row) => ({
    category_id: categoryId,
    team_id: row.team_id,
    played: row.played,
    won: row.won,
    lost: row.lost,
    points: row.points,
    courts_won: row.courts_won,
    courts_lost: row.courts_lost,
    courts_diff: row.courts_diff,
    sets_won: row.sets_won,
    sets_lost: row.sets_lost,
    sets_diff: row.sets_diff,
    games_won: row.games_won,
    games_lost: row.games_lost,
    games_diff: row.games_diff,
    position: row.position,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("standings_snapshot")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(payload as any, { onConflict: "category_id,team_id" })

  if (error) throw new Error(`Error al actualizar standings: ${error.message}`)
}
