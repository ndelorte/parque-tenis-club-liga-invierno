import { createClient } from "@/lib/supabase/server"
import { calculateInterparqueStandings } from "@/lib/interparque/calculateInterparqueStandings"
import type { InterparqueMatchRow, InterparqueStandingRow } from "@/lib/interparque/calculateInterparqueStandings"

export interface InterparquePlayerRow {
  id: string
  first_name: string
  last_name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface InterparqueMatch {
  id: string
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

export async function getInterparquePlayers(): Promise<InterparquePlayerRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("interparque_players")
    .select("*")
    .eq("active", true)
    .order("first_name", { ascending: true })

  if (error) {
    logError("getInterparquePlayers", error)
    return []
  }
  return data ?? []
}

export async function getInterparqueMatches(): Promise<InterparqueMatch[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("interparque_matches")
    .select("*")
    .order("match_date", { ascending: true, nullsFirst: false })

  if (error) {
    logError("getInterparqueMatches", error)
    return []
  }
  return data ?? []
}

export async function getInterparqueStandings(): Promise<InterparqueStandingRow[]> {
  const [players, matches] = await Promise.all([
    getInterparquePlayers(),
    getInterparqueMatches(),
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
