// Cliente mínimo de la API pública de Challonge (v1, JSON). Documentación:
// https://api.challonge.com/v1
//
// Requiere CHALLONGE_API_KEY en .env.local (Settings → Developer API en
// challonge.com). Nunca commitear la key.

const BASE_URL = "https://api.challonge.com/v1"

export interface ChallongeTournament {
  id: number
  name: string
  url: string
  subdomain: string | null
  state: string // "pending" | "underway" | "complete" | "awaiting_review"
  tournament_type: string // "single elimination" | "double elimination" | "round robin" | ...
  started_at: string | null
  completed_at: string | null
  created_at: string
  participants_count: number
}

export interface ChallongeParticipant {
  id: number
  name: string
  seed: number | null
  final_rank: number | null
  misc: string | null
}

export interface ChallongeMatch {
  id: number
  round: number // negativo = losers bracket (doble eliminación)
  state: string // "open" | "pending" | "complete"
  player1_id: number | null
  player2_id: number | null
  winner_id: number | null
  loser_id: number | null
  scores_csv: string | null // ej: "6-4,3-6,10-8" — puede venir vacío
}

function apiKey(): string {
  const key = process.env.CHALLONGE_API_KEY
  if (!key) {
    throw new Error(
      "Falta CHALLONGE_API_KEY en .env.local (Settings → Developer API en challonge.com, cuenta elcircuitodelparque).",
    )
  }
  return key
}

async function challongeGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set("api_key", apiKey())
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Challonge API error ${res.status} en ${path}: ${body}`)
  }
  return res.json() as Promise<T>
}

// Lista los torneos de la cuenta (opcionalmente de una "community"/subdomain
// puntual). No pagina explícitamente — Challonge devuelve hasta 25 por
// default; se pide el máximo permitido (1000) para traer todo en una pasada.
export async function listTournaments(subdomain?: string): Promise<ChallongeTournament[]> {
  const params: Record<string, string> = { per_page: "1000" }
  if (subdomain) params.subdomain = subdomain
  const data = await challongeGet<Array<{ tournament: ChallongeTournament }>>("/tournaments.json", params)
  return data.map((d) => d.tournament)
}

export async function getTournamentDetail(idOrUrl: string | number): Promise<{
  tournament: ChallongeTournament
  participants: ChallongeParticipant[]
  matches: ChallongeMatch[]
}> {
  type RawTournament = ChallongeTournament & {
    participants: Array<{ participant: ChallongeParticipant }>
    matches: Array<{ match: ChallongeMatch }>
  }
  const data = await challongeGet<{ tournament: RawTournament }>(`/tournaments/${idOrUrl}.json`, {
    include_participants: "1",
    include_matches: "1",
  })
  const t = data.tournament
  return {
    tournament: t,
    participants: (t.participants ?? []).map((p) => p.participant),
    matches: (t.matches ?? []).map((m) => m.match),
  }
}

// Convierte "6-4,3-6,10-8" (formato Challonge) a "6-4 3-6 10-8" (formato del
// club — ver lib/circuito/parseCircuitoScore.ts). Devuelve null si no hay
// nada que convertir (scores_csv vacío) o si no tiene forma de sets de
// tenis (ej. "1-0", usado por otros deportes en Challonge) — nunca inventa
// un score.
export function convertScoresCsv(scoresCsv: string | null): string | null {
  if (!scoresCsv || !scoresCsv.trim()) return null
  const sets = scoresCsv.split(",").map((s) => s.trim())
  const looksLikeTennis = sets.every((s) => {
    const m = s.match(/^(\d{1,2})-(\d{1,2})$/)
    if (!m) return false
    const a = parseInt(m[1], 10)
    const b = parseInt(m[2], 10)
    return Math.max(a, b) >= 4 // un "1-0" de mejor-de-N no pasa este filtro
  })
  if (!looksLikeTennis) return null
  return sets.join(" ")
}
