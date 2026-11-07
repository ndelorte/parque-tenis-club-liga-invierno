import { getPreviewTournament } from "@/lib/liga/registration/preview"
import { createPublicClient } from "@/lib/supabase/public"
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
    registration_open: row.registration_open ?? false,
    registration_deadline: row.registration_deadline ?? undefined,
    registration_min_players: row.registration_min_players ?? undefined,
    registration_max_players: row.registration_max_players ?? undefined,
  }
}

export async function getAllTournaments(): Promise<Tournament[]> {
  const supabase = createPublicClient()

  const { data, error } = await supabase.from("tournaments").select("*")

  const preview = getPreviewTournament()
  const tournaments = error || !data ? [] : (data as TournamentRow[]).map(mapTournamentRow)
  return sortTournaments(preview ? [preview, ...tournaments.filter((t) => t.slug !== preview.slug)] : tournaments)
}

export async function getActiveTournament(): Promise<Tournament | null> {
  const preview = getPreviewTournament()
  if (preview) return preview
  const supabase = createPublicClient()

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
  const preview = getPreviewTournament()
  if (preview?.slug === slug) return preview
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error || !data) return null

  return mapTournamentRow(data as TournamentRow)
}
