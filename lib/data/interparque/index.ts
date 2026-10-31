import { createPublicClient } from "@/lib/supabase/public"
import { calculateInterparqueStandings } from "@/lib/interparque/calculateInterparqueStandings"
import type { InterparqueMatchRow, InterparqueStandingRow } from "@/lib/interparque/calculateInterparqueStandings"

export interface InterparqueEdition {
  id: string
  number: number
  start_date: string
  sundays_count: number
  created_at: string
  updated_at: string
}

export interface InterparquePlayerRow {
  id: string
  edition_id: string
  is_champion: boolean
  first_name: string
  last_name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface InterparqueMatch {
  id: string
  edition_id: string
  player_a_id: string
  player_b_id: string
  match_date: string | null
  score: string | null
  status: "scheduled" | "completed"
  winner_player_id: string | null
  games_a: number
  games_b: number
  points_a: number
  points_b: number
  notes: string | null
  created_at: string
  updated_at: string
}

function logError(fn: string, error: unknown) {
  console.error(`[interparque] ${fn}:`, JSON.stringify(error))
}

// ── Ediciones ──────────────────────────────────────────────────

export async function getInterparqueEditions(): Promise<InterparqueEdition[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("interparque_editions")
    .select("*")
    .order("number", { ascending: false })

  if (error) {
    logError("getInterparqueEditions", error)
    return []
  }
  return data ?? []
}

export async function getInterparqueEditionByNumber(number: number): Promise<InterparqueEdition | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("interparque_editions")
    .select("*")
    .eq("number", number)
    .maybeSingle()

  if (error) {
    logError("getInterparqueEditionByNumber", error)
    return null
  }
  return data
}

export async function getLatestInterparqueEdition(): Promise<InterparqueEdition | null> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("interparque_editions")
    .select("*")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logError("getLatestInterparqueEdition", error)
    return null
  }
  return data
}

/** Nombres de los campeones de cada edición, indexados por `edition_id` (una sola consulta). */
export async function getInterparqueChampionsByEdition(): Promise<Record<string, string[]>> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("interparque_players")
    .select("*")
    .eq("is_champion", true)
    .order("first_name", { ascending: true })

  if (error) {
    logError("getInterparqueChampionsByEdition", error)
    return {}
  }
  const byEdition: Record<string, string[]> = {}
  for (const row of (data ?? []) as InterparquePlayerRow[]) {
    ;(byEdition[row.edition_id] ??= []).push(`${row.first_name} ${row.last_name}`)
  }
  return byEdition
}

// ── Jugadores, partidos y tabla de una edición ─────────────────

export async function getInterparquePlayers(editionId: string): Promise<InterparquePlayerRow[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("interparque_players")
    .select("*")
    .eq("edition_id", editionId)
    .eq("active", true)
    .order("first_name", { ascending: true })

  if (error) {
    logError("getInterparquePlayers", error)
    return []
  }
  return data ?? []
}

export async function getInterparqueMatches(editionId: string): Promise<InterparqueMatch[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from("interparque_matches")
    .select("*")
    .eq("edition_id", editionId)
    .order("match_date", { ascending: true, nullsFirst: false })

  if (error) {
    logError("getInterparqueMatches", error)
    return []
  }
  return data ?? []
}

export async function getInterparqueStandings(editionId: string): Promise<InterparqueStandingRow[]> {
  const [players, matches] = await Promise.all([
    getInterparquePlayers(editionId),
    getInterparqueMatches(editionId),
  ])

  const matchRows: InterparqueMatchRow[] = matches.map((m) => ({
    status: m.status,
    player_a_id: m.player_a_id,
    player_b_id: m.player_b_id,
    points_a: m.points_a,
    points_b: m.points_b,
  }))

  return calculateInterparqueStandings(players, matchRows)
}
