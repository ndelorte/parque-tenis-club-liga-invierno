import { createClient } from "@/lib/supabase/server"
import type { Tournament } from "@/lib/tournament/types"
import { sortTournaments } from "@/lib/tournament/sortTournaments"
import type { Database } from "@/lib/supabase/types"

type TournamentRow = Database["public"]["Tables"]["tournaments"]["Row"]

function mapTournamentRow(row: TournamentRow): Tournament {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    season: row.season,
    status: row.status,
    description: row.description ?? undefined,
    start_date: row.start_date ?? undefined,
    end_date: row.end_date ?? undefined,
  }
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("tournaments").select("*")

  if (error || !data) return []

  return sortTournaments((data as TournamentRow[]).map(mapTournamentRow))
}

export async function getActiveTournament(): Promise<Tournament | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("status", "active")
    .order("season", { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  return mapTournamentRow(data as TournamentRow)
}

export async function getTournamentBySlug(slug: string): Promise<Tournament | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error || !data) return null

  return mapTournamentRow(data as TournamentRow)
}
