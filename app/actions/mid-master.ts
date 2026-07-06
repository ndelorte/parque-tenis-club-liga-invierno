"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { parseMmScore, determineWinner } from "@/lib/mid-master/parseMmScore"

type ActionResult = { ok: true } | { ok: false; error: string }

// Helper: Supabase sin tipado estricto para tablas mid_master_*
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db() { return createAdminClient() as any }

// ── Auth ──────────────────────────────────────────────────────

export async function signOutMaster() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/panel-master/login")
}

// ── Match: schedule ───────────────────────────────────────────

export async function updateMmMatchSchedule(
  matchId: string,
  scheduledDate: string,
  scheduledTime: string,
): Promise<ActionResult> {
  const status = scheduledDate ? "scheduled" : "pending"
  const { error } = await db()
    .from("mid_master_matches")
    .update({
      scheduled_date: scheduledDate || null,
      scheduled_time: scheduledTime || null,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)

  if (error) return { ok: false, error: "Error al guardar la fecha." }
  revalidatePath("/panel-master")
  revalidatePath("/mid-master")
  return { ok: true }
}

// ── Match: result ─────────────────────────────────────────────

export async function updateMmMatchResult(
  matchId: string,
  score: string,
  isFinal: boolean,
): Promise<ActionResult> {
  let setsA: number, setsB: number, gamesA: number, gamesB: number
  try {
    const parsed = parseMmScore(score, isFinal)
    setsA = parsed.setsA; setsB = parsed.setsB
    gamesA = parsed.gamesA; gamesB = parsed.gamesB
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Score inválido." }
  }

  const { data: match, error: fetchError } = await db()
    .from("mid_master_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle()

  if (fetchError || !match) return { ok: false, error: "Partido no encontrado." }
  if (!match.participant_a_id || !match.participant_b_id) {
    return { ok: false, error: "El partido no tiene participantes asignados." }
  }

  let winnerId: string
  try {
    winnerId = determineWinner(setsA, setsB, match.participant_a_id, match.participant_b_id)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error al determinar ganador." }
  }

  // Intentar con todos los campos; si falla por columnas inexistentes, usar solo los básicos
  const { error } = await db()
    .from("mid_master_matches")
    .update({
      score,
      winner_id: winnerId,
      sets_a: setsA, sets_b: setsB,
      games_a: gamesA, games_b: gamesB,
      status: "completed",
    })
    .eq("id", matchId)

  if (error) {
    // Retry sin columnas opcionales
    const { error: e2 } = await db()
      .from("mid_master_matches")
      .update({ score, winner_id: winnerId, status: "completed" })
      .eq("id", matchId)
    if (e2) return { ok: false, error: `Error al guardar el resultado: ${e2.message}` }
  }

  revalidatePath("/panel-master")
  revalidatePath("/mid-master")
  return { ok: true }
}

// ── Match: clear result ───────────────────────────────────────

export async function clearMmMatchResult(matchId: string): Promise<ActionResult> {
  const { error } = await db()
    .from("mid_master_matches")
    .update({ score: null, winner_id: null, sets_a: 0, sets_b: 0, games_a: 0, games_b: 0, status: "pending" })
    .eq("id", matchId)

  if (error) {
    const { error: e2 } = await db()
      .from("mid_master_matches")
      .update({ score: null, winner_id: null, status: "pending" })
      .eq("id", matchId)
    if (e2) return { ok: false, error: "Error al borrar el resultado." }
  }
  revalidatePath("/panel-master")
  revalidatePath("/mid-master")
  return { ok: true }
}

// ── Participant: update name ──────────────────────────────────

export async function updateMmParticipant(
  participantId: string,
  displayName: string,
): Promise<ActionResult> {
  const name = displayName.trim()
  if (!name) return { ok: false, error: "El nombre no puede estar vacío." }

  // Detectar la columna real intentando primero con "name" (patrón del usuario)
  // y haciendo fallback a "display_name" (patrón del migration)
  const candidateCols = ["name", "display_name", "full_name", "player_name"]
  let updated = false
  for (const col of candidateCols) {
    const { error } = await db()
      .from("mid_master_participants")
      .update({ [col]: name })
      .eq("id", participantId)
    if (!error) { updated = true; break }
  }
  if (!updated) return { ok: false, error: "Error al actualizar el nombre." }

  // Actualizar etiquetas en partidos pendientes (ignorar errores si esas columnas no existen)
  await Promise.allSettled([
    db().from("mid_master_matches")
      .update({ participant_a_label: name })
      .eq("participant_a_id", participantId)
      .in("status", ["pending", "scheduled"]),
    db().from("mid_master_matches")
      .update({ participant_b_label: name })
      .eq("participant_b_id", participantId)
      .in("status", ["pending", "scheduled"]),
  ])

  revalidatePath("/panel-master")
  revalidatePath("/mid-master")
  return { ok: true }
}

// ── Knockout: asignar clasificados desde standings ────────────

export async function resolveKnockoutParticipants(
  categoryId: string,
): Promise<ActionResult> {
  const supabase = db()

  // Fetch groups
  const { data: groups } = await supabase
    .from("mid_master_groups")
    .select("id, name")
    .eq("category_id", categoryId)
    .order("name", { ascending: true })

  if (!groups || groups.length < 2) {
    return { ok: false, error: "No se encontraron las zonas." }
  }

  const groupA = groups.find((g: { name: string }) => g.name.toUpperCase().includes("A")) ?? groups[0]
  const groupB = groups.find((g: { name: string }) => g.name.toUpperCase().includes("B")) ?? groups[1]

  // Fetch matches and participants for standings
  const { data: matches } = await supabase
    .from("mid_master_matches")
    .select("*")
    .eq("category_id", categoryId)

  const { data: partsA } = await supabase
    .from("mid_master_participants")
    .select("*")
    .eq("group_id", groupA.id)

  const { data: partsB } = await supabase
    .from("mid_master_participants")
    .select("*")
    .eq("group_id", groupB.id)

  if (!matches || !partsA || !partsB) {
    return { ok: false, error: "Error al obtener datos." }
  }

  const { calculateZoneStandings } = await import("@/lib/mid-master/calculateZoneStandings")

  const standingsA = calculateZoneStandings(
    partsA,
    matches.filter((m: { group_id: string }) => m.group_id === groupA.id),
  )
  const standingsB = calculateZoneStandings(
    partsB,
    matches.filter((m: { group_id: string }) => m.group_id === groupB.id),
  )

  if (standingsA.length < 2 || standingsB.length < 2) {
    return { ok: false, error: "Faltan participantes en las zonas." }
  }

  const first_A = partsA.find((p: { id: string }) => p.id === standingsA[0].participantId)
  const second_A = partsA.find((p: { id: string }) => p.id === standingsA[1].participantId)
  const first_B = partsB.find((p: { id: string }) => p.id === standingsB[0].participantId)
  const second_B = partsB.find((p: { id: string }) => p.id === standingsB[1].participantId)

  if (!first_A || !second_A || !first_B || !second_B) {
    return { ok: false, error: "No hay clasificados suficientes." }
  }

  // Fetch knockout matches
  const { data: koMatches } = await supabase
    .from("mid_master_matches")
    .select("id, phase")
    .eq("category_id", categoryId)
    .is("group_id", null)
    .order("created_at", { ascending: true })

  if (!koMatches || koMatches.length < 2) {
    return { ok: false, error: "No se encontraron partidos de cuadro final." }
  }

  const sfMatches = koMatches.filter((m: { phase: string }) => m.phase === "semifinal")
  if (sfMatches.length < 2) {
    return { ok: false, error: "No hay suficientes partidos de semifinal." }
  }

  await Promise.all([
    supabase.from("mid_master_matches").update({
      participant_a_id: first_A.id,
      participant_b_id: second_B.id,
      participant_a_label: first_A.display_name,
      participant_b_label: second_B.display_name,
    }).eq("id", sfMatches[0].id),

    supabase.from("mid_master_matches").update({
      participant_a_id: first_B.id,
      participant_b_id: second_A.id,
      participant_a_label: first_B.display_name,
      participant_b_label: second_A.display_name,
    }).eq("id", sfMatches[1].id),
  ])

  revalidatePath("/panel-master")
  revalidatePath("/mid-master")
  return { ok: true }
}

// ── Trigger revalidation (standings computed on-the-fly) ──────

export async function revalidateMmCategory(slug: string): Promise<void> {
  revalidatePath(`/panel-master/categorias/${slug}`)
  revalidatePath(`/mid-master/categorias/${slug}`)
}
