"use server"

import { revalidatePath } from "next/cache"
import { isRequestFromAdmin } from "@/lib/auth/requireAdmin"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { parseInterparqueScore } from "@/lib/interparque/parseInterparqueScore"
import { calculateInterparqueMatchResult } from "@/lib/interparque/calculateInterparqueMatchResult"
import { isSunday } from "@/lib/interparque/editions"

type ActionResult = { ok: true } | { ok: false; error: string }
type ActionResultWithId = { ok: true; id: string } | { ok: false; error: string }

const UNAUTHORIZED = { ok: false, error: "No autorizado." } as const

// Layout: cubre /interparque, /interparque/[n], /panel-interparque y /panel-interparque/[n].
function revalidateInterparque() {
  revalidatePath("/interparque", "layout")
  revalidatePath("/panel-interparque", "layout")
  revalidatePath("/")
}

export async function signOutInterparque() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/panel-interparque/login")
}

// ── Ediciones ──────────────────────────────────────────────────

function validateEditionDates(startDate: string, sundaysCount: number): string | null {
  if (!isSunday(startDate)) return "La fecha de inicio tiene que ser un domingo."
  if (!Number.isInteger(sundaysCount) || sundaysCount < 1 || sundaysCount > 52) {
    return "La cantidad de domingos tiene que ser un número entre 1 y 52."
  }
  return null
}

export async function createInterparqueEdition(
  startDate: string,
  sundaysCount: number,
): Promise<{ ok: true; id: string; number: number } | { ok: false; error: string }> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const invalid = validateEditionDates(startDate, sundaysCount)
  if (invalid) return { ok: false, error: invalid }

  const supabase = createAdminClient()
  const { data: last, error: lastError } = await supabase
    .from("interparque_editions")
    .select("number")
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (lastError) return { ok: false, error: `Error al crear la edición: ${lastError.message}` }

  const number = (last?.number ?? 0) + 1
  const { data, error } = await supabase
    .from("interparque_editions")
    .insert({ number, start_date: startDate, sundays_count: sundaysCount })
    .select("id, number")
    .single()

  if (error || !data) {
    return { ok: false, error: `Error al crear la edición: ${error?.message ?? "sin datos"}` }
  }

  revalidateInterparque()
  return { ok: true, id: data.id, number: data.number }
}

export async function updateInterparqueEdition(
  editionId: string,
  startDate: string,
  sundaysCount: number,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const invalid = validateEditionDates(startDate, sundaysCount)
  if (invalid) return { ok: false, error: invalid }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("interparque_editions")
    .update({ start_date: startDate, sundays_count: sundaysCount, updated_at: new Date().toISOString() })
    .eq("id", editionId)

  if (error) return { ok: false, error: `Error al guardar la edición: ${error.message}` }

  revalidateInterparque()
  return { ok: true }
}

// ── Jugadores ──────────────────────────────────────────────────

export async function createInterparquePlayer(
  editionId: string,
  firstName: string,
  lastName: string,
): Promise<ActionResultWithId> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const first_name = firstName.trim()
  const last_name = lastName.trim()
  if (!first_name || !last_name) {
    return { ok: false, error: "Ingresá nombre y apellido." }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("interparque_players")
    .insert({ edition_id: editionId, first_name, last_name })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: `Error al agregar el jugador: ${error?.message ?? "sin datos"}` }
  }

  revalidateInterparque()
  return { ok: true, id: data.id }
}

export async function setInterparqueChampion(
  playerId: string,
  isChampion: boolean,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("interparque_players")
    .update({ is_champion: isChampion, updated_at: new Date().toISOString() })
    .eq("id", playerId)

  if (error) return { ok: false, error: `Error al guardar el campeón: ${error.message}` }

  revalidateInterparque()
  return { ok: true }
}

// ── Partidos ───────────────────────────────────────────────────

export async function createInterparqueMatch(
  editionId: string,
  playerAId: string,
  playerBId: string,
  matchDate: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  if (!playerAId || !playerBId) {
    return { ok: false, error: "Seleccioná los dos jugadores." }
  }
  if (playerAId === playerBId) {
    return { ok: false, error: "Los jugadores deben ser distintos." }
  }

  const supabase = createAdminClient()
  // Los dos jugadores tienen que ser de esta edición (cada edición arranca de cero).
  const { data: players, error: playersError } = await supabase
    .from("interparque_players")
    .select("id")
    .eq("edition_id", editionId)
    .in("id", [playerAId, playerBId])
  if (playersError) return { ok: false, error: `Error al crear el partido: ${playersError.message}` }
  if ((players ?? []).length !== 2) {
    return { ok: false, error: "Los dos jugadores tienen que ser de esta edición." }
  }

  const { error } = await supabase.from("interparque_matches").insert({
    edition_id: editionId,
    player_a_id: playerAId,
    player_b_id: playerBId,
    match_date: matchDate || null,
  })

  if (error) return { ok: false, error: `Error al crear el partido: ${error.message}` }

  revalidateInterparque()
  return { ok: true }
}

/**
 * Carga o corrige el resultado de un partido. Se usa tanto para la carga
 * inicial como para editar un resultado ya cargado (el club pidió poder
 * corregir errores de tipeo) — siempre recalcula todo desde el score, no
 * se editan puntos a mano (ver ADR-006).
 */
export async function updateInterparqueMatchResult(
  matchId: string,
  score: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  let result: ReturnType<typeof calculateInterparqueMatchResult>
  try {
    const parsed = parseInterparqueScore(score)
    result = calculateInterparqueMatchResult(parsed)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Score inválido." }
  }

  const supabase = createAdminClient()
  const { data: match, error: fetchError } = await supabase
    .from("interparque_matches")
    .select("player_a_id, player_b_id")
    .eq("id", matchId)
    .maybeSingle()

  if (fetchError || !match) return { ok: false, error: "Partido no encontrado." }

  const winnerPlayerId = result.winnerSide === "a" ? match.player_a_id : match.player_b_id

  const { error } = await supabase
    .from("interparque_matches")
    .update({
      score: score.trim(),
      status: "completed",
      winner_player_id: winnerPlayerId,
      games_a: result.gamesA,
      games_b: result.gamesB,
      points_a: result.pointsA,
      points_b: result.pointsB,
    })
    .eq("id", matchId)

  if (error) return { ok: false, error: `Error al guardar el resultado: ${error.message}` }

  revalidateInterparque()
  return { ok: true }
}

export async function deleteInterparqueMatch(matchId: string): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const supabase = createAdminClient()
  const { error } = await supabase.from("interparque_matches").delete().eq("id", matchId)

  if (error) return { ok: false, error: "Error al eliminar el partido." }

  revalidateInterparque()
  return { ok: true }
}
