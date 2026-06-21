import { createClient } from "@/lib/supabase/server"
import type { Team, Player, TeamPlayer } from "@/lib/tournament/types"
import type { Database } from "@/lib/supabase/types"

type TeamRow = Database["public"]["Tables"]["teams"]["Row"]
type PlayerRow = Database["public"]["Tables"]["players"]["Row"]
type TeamPlayerRow = Database["public"]["Tables"]["team_players"]["Row"]

export async function getTeamsByCategory(categoryId: string): Promise<Team[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("category_id", categoryId)
    .eq("active", true)
    .order("name")

  if (error || !data) return []

  return (data as TeamRow[]).map((row) => ({
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    captain_name: row.captain_name ?? undefined,
    active: row.active,
  }))
}

type TeamWithPlayersRow = TeamRow & {
  team_players: (TeamPlayerRow & { players: PlayerRow | null })[]
}

export async function getTeamBySlug(
  slug: string,
): Promise<(Team & { players: (TeamPlayer & { player: Player })[] }) | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("teams")
    .select(`
      *,
      team_players(
        id,
        player_id,
        is_captain,
        active,
        players(id, first_name, last_name, display_name, active)
      )
    `)
    .eq("slug", slug)
    .eq("active", true)
    .single()

  if (error || !data) return null

  const row = data as unknown as TeamWithPlayersRow

  const players: (TeamPlayer & { player: Player })[] = row.team_players
    .filter((tp) => tp.active)
    .map((tp) => ({
      id: tp.id,
      team_id: row.id,
      player_id: tp.player_id,
      is_captain: tp.is_captain,
      active: tp.active,
      player: tp.players as Player,
    }))

  return {
    id: row.id,
    category_id: row.category_id,
    name: row.name,
    slug: row.slug,
    captain_name: row.captain_name ?? undefined,
    active: row.active,
    players,
  }
}
