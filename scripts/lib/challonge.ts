// Cliente de la API de Challonge v2.1 (JSON:API, OAuth2 client_credentials).
// Documentación real (no la v1 que asumía el diseño original de este
// archivo): https://challonge.apidog.io — base https://api.challonge.com/v2.1,
// headers Content-Type/Accept + `Authorization-Type: v2` además del Bearer.
//
// Requiere CHALLONGE_CLIENT_ID y CHALLONGE_CLIENT_SECRET en .env.local
// (Settings → Developer API en challonge.com, cuenta del club). Nunca
// commitear esos valores.

const BASE_URL = "https://api.challonge.com/v2.1"

interface TokenResponse {
  access_token: string
  expires_in: number
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token

  const clientId = process.env.CHALLONGE_CLIENT_ID
  const clientSecret = process.env.CHALLONGE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("Faltan CHALLONGE_CLIENT_ID / CHALLONGE_CLIENT_SECRET en .env.local.")
  }

  const res = await fetch("https://api.challonge.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
  if (!res.ok) throw new Error(`Error obteniendo token de Challonge: HTTP ${res.status}`)
  const data = (await res.json()) as TokenResponse
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cachedToken.token
}

async function challongeGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = await getAccessToken()
  const url = new URL(`${BASE_URL}${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/vnd.api+json",
      Accept: "application/json",
      "Authorization-Type": "v2",
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Challonge API error ${res.status} en ${path}: ${body}`)
  }
  return res.json() as Promise<T>
}

export interface ChallongeTournament {
  id: string
  attributes: {
    name: string
    state: string // "pending" | "underway" | "complete" | ...
    tournament_type: string
    participants_count: number
    starts_at: string | null
  }
}

export interface ChallongeParticipant {
  id: string
  attributes: {
    name: string
    seed: number | null
    final_rank: number | null
  }
}

export interface ChallongeMatch {
  id: string
  attributes: {
    state: string // "complete" | "open" | "pending"
    round: number
    scores: string | null // "2 - 0"
    score_in_sets: [number, number][] | null
    points_by_participant: Array<{ participant_id: number; scores: number[] }>
    winner_id: number | null
  }
}

export async function listAllTournaments(): Promise<ChallongeTournament[]> {
  const all: ChallongeTournament[] = []
  let page = 1
  for (;;) {
    const data = await challongeGet<{ data: ChallongeTournament[]; meta: { count: number } }>("/tournaments", {
      page: String(page),
      per_page: "100",
    })
    all.push(...data.data)
    if (all.length >= data.meta.count || data.data.length === 0) break
    page++
  }
  return all
}

// Bug encontrado corriendo el import real: sin paginar, un torneo con más
// participantes/partidos que el page size por default de Challonge perdía
// silenciosamente el resto (participantes de la ronda de clasificación
// quedaban afuera, dejando partidos sin participant_a_id/b_id). Mismo
// patrón de paginación que listAllTournaments.
async function getAllPages<T>(path: string): Promise<T[]> {
  const all: T[] = []
  let page = 1
  for (;;) {
    const data = await challongeGet<{ data: T[]; meta?: { count: number } }>(path, {
      page: String(page),
      per_page: "100",
    })
    all.push(...data.data)
    if (data.data.length === 0) break
    if (data.meta && all.length >= data.meta.count) break
    if (!data.meta && data.data.length < 100) break // algunos sub-recursos no traen meta.count
    page++
  }
  return all
}

export async function getTournamentParticipants(tournamentId: string): Promise<ChallongeParticipant[]> {
  return getAllPages<ChallongeParticipant>(`/tournaments/${tournamentId}/participants.json`)
}

export async function getTournamentMatches(tournamentId: string): Promise<ChallongeMatch[]> {
  return getAllPages<ChallongeMatch>(`/tournaments/${tournamentId}/matches.json`)
}

// "score_in_sets" ya viene como [participanteA, participanteB] por set en el
// mismo orden que "points_by_participant" — se arma directo el formato del
// club ("6-4 3-6 7-6"), sin parsear el string "scores" (formato agregado,
// ej. "2 - 0", que no sirve para esto).
export function scoreInSetsToClubFormat(scoreInSets: [number, number][] | null): string | null {
  if (!scoreInSets || scoreInSets.length === 0) return null
  return scoreInSets.map(([a, b]) => `${a}-${b}`).join(" ")
}
