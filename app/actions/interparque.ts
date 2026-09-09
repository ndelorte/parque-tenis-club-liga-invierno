"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { parseInterparqueScore } from "@/lib/interparque/parseInterparqueScore"
import { calculateInterparqueMatchResult } from "@/lib/interparque/calculateInterparqueMatchResult"

type ActionResult = { ok: true } | { ok: false; error: string }
type ActionResultWithId = { ok: true; id: string } | { ok: false; error: string }

function revalidateInterparque() {
  revalidatePath("/interparque")
  revalidatePath("/panel-interparque")
}

export async function signOutInterparque() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/panel-interparque/login")
}

// ── Jugadores ──────────────────────────────────────────────────

export async function createInterparquePlayer(
  firstName: string,
  lastName: string,
): Promise<ActionResultWithId> {
  const first_name = firstName.trim()
  const last_name = lastName.trim()
  if (!first_name || !last_name) {
    return { ok: false, error: "Ingresá nombre y apellido." }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("interparque_players")
    .insert({ first_name, last_name })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: `Error al agregar el jugador: ${error?.message ?? "sin datos"}` }
  }

  revalidateInterparque()
  return { ok: true, id: data.id }
}

// ── Partidos ───────────────────────────────────────────────────

export async function createInterparqueMatch(
  playerAId: string,
  playerBId: string,
  matchDate: string,
): Promise<ActionResult> {
  if (!playerAId || !playerBId) {
    return { ok: false, error: "Seleccioná los dos jugadores." }
  }
  if (playerAId === playerBId) {
    return { ok: false, error: "Los jugadores deben ser distintos." }
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("interparque_matches").insert({
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
  const supabase = createAdminClient()
  const { error } = await supabase.from("interparque_matches").delete().eq("id", matchId)

  if (error) return { ok: false, error: "Error al eliminar el partido." }

  revalidateInterparque()
  return { ok: true }
}
