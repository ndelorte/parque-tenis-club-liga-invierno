import { createAdminClient } from "@/lib/supabase/admin"
import { generateBracket, selectDrawRule } from "@/lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { repechajeLineCount, repechajeShape, repechajeSources } from "@/lib/circuito/repechajePlan"
import { computeSlotUpdates, type BracketSlotMatch } from "@/lib/circuito/syncBracketSlots"
import type { CircuitoBracket, CircuitoParticipant, DrawFormatKind } from "@/lib/circuito/types"
import { assignSeedsFromRanking } from "@/lib/circuito/assignSeedsFromRanking"
import type { CircuitoMatchRow } from "./types"
import { getAnnualCircuitRanking } from "./ranking"

type AdminClient = ReturnType<typeof createAdminClient>

export function toBracketSlotMatch(row: CircuitoMatchRow): BracketSlotMatch {
  return {
    id: row.id,
    bracket: row.bracket,
    round: row.round_number,
    position: row.position,
    zone: row.zone,
    participantAId: row.participant_a_id,
    participantBId: row.participant_b_id,
    winnerId: row.winner_id,
    score: row.score,
  }
}

// Vuelca un CircuitoBracket (lib/circuito/generateBracket.ts) a filas de
// circuito_matches. Solo inserta: los lugares derivados (byes que avanzan,
// ganadores, clasificados de zona) los completa syncCircuitoBracketSlots.
export async function insertCircuitoBracket(
  supabase: AdminClient,
  categoryId: string,
  bracketType: "main" | "repechaje",
  bracket: CircuitoBracket,
): Promise<void> {
  const rows = bracket.rounds.flatMap((roundMatches, roundIdx) =>
    roundMatches.map((m, position) => ({
      category_id: categoryId,
      bracket: bracketType,
      round_number: roundIdx + 1,
      position,
      zone: m.group,
      participant_a_id: m.participantA?.id ?? null,
      participant_b_id: m.participantB?.id ?? null,
      status: "pending" as const,
    })),
  )

  const { error } = await supabase.from("circuito_matches").insert(rows)
  if (error) throw new Error(`Error al generar el cuadro: ${error.message}`)
}

// Deja armado el cuadro de repechaje (eliminación simple, 8+): forma fija,
// con todos los lugares vacíos — los va llenando syncCircuitoBracketSlots a
// medida que alguien pierde su primer partido (lib/circuito/repechajePlan.ts).
// Idempotente; devuelve true si armó/rehízo filas. Un repechaje ya en juego con otra forma (armado con el
// criterio anterior: solo perdedores de 1ª ronda) se deja como está.
export async function ensureRepechajeStructure(supabase: AdminClient, categoryId: string): Promise<boolean> {
  const { data, error } = await supabase.from("circuito_matches").select("*").eq("category_id", categoryId)
  if (error) throw new Error(`Error al leer el cuadro: ${error.message}`)
  const rows = (data ?? []) as CircuitoMatchRow[]

  const shape = repechajeShape(repechajeLineCount(repechajeSources(rows.map(toBracketSlotMatch)).length))
  const existing = rows.filter((r) => r.bracket === "repechaje")
  const sameShape =
    existing.length === shape.reduce((a, b) => a + b, 0) &&
    shape.every((count, i) => existing.filter((r) => r.round_number === i + 1).length === count)
  if (sameShape) return false
  if (existing.some((r) => r.winner_id || r.score)) return false

  if (existing.length > 0) {
    const { error: deleteError } = await supabase
      .from("circuito_matches")
      .delete()
      .eq("category_id", categoryId)
      .eq("bracket", "repechaje")
    if (deleteError) throw new Error(`Error al rehacer el repechaje: ${deleteError.message}`)
  }

  const empty = shape.flatMap((count, roundIdx) =>
    Array.from({ length: count }, (_, position) => ({
      category_id: categoryId,
      bracket: "repechaje" as const,
      round_number: roundIdx + 1,
      position,
      zone: null,
      participant_a_id: null,
      participant_b_id: null,
      status: "pending" as const,
    })),
  )
  if (empty.length === 0) return false
  const { error: insertError } = await supabase.from("circuito_matches").insert(empty)
  if (insertError) throw new Error(`Error al armar el repechaje: ${insertError.message}`)
  return true
}

// Aplica contra la DB lo que calcula lib/circuito/syncBracketSlots.ts:
// recalcula todos los lugares derivados del cuadro (main + repechaje) desde
// los resultados cargados. Idempotente — ver comentario en computeSlotUpdates.
export async function syncCircuitoBracketSlots(
  supabase: AdminClient,
  categoryId: string,
  format: DrawFormatKind,
): Promise<void> {
  const [{ data: participantRows, error: participantsError }, { data: matchRows, error: matchesError }] =
    await Promise.all([
      supabase.from("circuito_participants").select("id, seed").eq("category_id", categoryId),
      supabase.from("circuito_matches").select("*").eq("category_id", categoryId),
    ])
  if (participantsError) throw new Error(`Error al leer participantes: ${participantsError.message}`)
  if (matchesError) throw new Error(`Error al leer el cuadro: ${matchesError.message}`)

  const participants: CircuitoParticipant[] = (participantRows ?? []).map((p) => ({ id: p.id, seed: p.seed }))
  const rows = (matchRows ?? []) as CircuitoMatchRow[]
  const rowsById = new Map(rows.map((r) => [r.id, r]))

  for (const update of computeSlotUpdates(format, participants, rows.map(toBracketSlotMatch))) {
    const row = rowsById.get(update.matchId)
    const resultReset = update.clearResult
      ? {
          score: null,
          winner_id: null,
          is_walkover: false,
          status: row?.scheduled_date ? ("scheduled" as const) : ("pending" as const),
        }
      : {}
    const { error } = await supabase
      .from("circuito_matches")
      .update({ participant_a_id: update.participantAId, participant_b_id: update.participantBId, ...resultReset })
      .eq("id", update.matchId)
    if (error) throw new Error(`Error al actualizar el cuadro: ${error.message}`)
  }
}

// Cabezas de serie desde el ranking vigente de la categoría
// (reglas-circuito-del-parque.md, "Seeding"): el ranking del año de la
// edición; si todavía no hay ranking de ese año, el final del año anterior.
// Se guardan en circuito_participants.seed antes de armar el cuadro.
async function assignSeedsForCategory(supabase: AdminClient, categoryId: string): Promise<void> {
  const { data: category, error: categoryError } = await supabase
    .from("circuito_categories")
    .select("slug, circuito_editions!inner(year)")
    .eq("id", categoryId)
    .maybeSingle()
  if (categoryError || !category) throw new Error("No se encontró la categoría.")
  const year = (category as unknown as { circuito_editions: { year: number } }).circuito_editions.year

  let ranking = await getAnnualCircuitRanking(year, category.slug)
  if (ranking.entries.length === 0) ranking = await getAnnualCircuitRanking(year - 1, category.slug)

  const { data: participantRows, error } = await supabase
    .from("circuito_participants")
    .select("id, player_id, player_2_id")
    .eq("category_id", categoryId)
  if (error) throw new Error(`Error al leer participantes: ${error.message}`)

  const seeds = assignSeedsFromRanking(
    (participantRows ?? []).map((p) => ({ id: p.id, playerId: p.player_id, player2Id: p.player_2_id })),
    ranking.entries.map((e) => e.playerId),
    CIRCUITO_FORMAT_SPEC.seededCount,
  )
  for (const [participantId, seed] of seeds) {
    const { error: seedError } = await supabase.from("circuito_participants").update({ seed }).eq("id", participantId)
    if (seedError) throw new Error(`Error al asignar cabezas de serie: ${seedError.message}`)
  }
}

export async function generateAndPersistCircuitoBracket(categoryId: string): Promise<void> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("circuito_matches")
    .select("id")
    .eq("category_id", categoryId)
    .limit(1)
  if (existing && existing.length > 0) {
    throw new Error("El cuadro de esta categoría ya fue generado.")
  }

  await assignSeedsForCategory(supabase, categoryId)

  const { data: participantRows, error } = await supabase
    .from("circuito_participants")
    .select("id, seed")
    .eq("category_id", categoryId)

  if (error) throw new Error(`Error al leer participantes: ${error.message}`)

  const participants: CircuitoParticipant[] = (participantRows ?? []).map((p) => ({
    id: p.id,
    seed: p.seed,
  }))

  const bracket = generateBracket(participants, CIRCUITO_FORMAT_SPEC, Math.random)

  // Si esto falla (ej. otro admin generó el mismo cuadro en paralelo y chocó
  // con el índice único de position) no hay nada propio que deshacer.
  await insertCircuitoBracket(supabase, categoryId, "main", bracket)

  // Supabase JS no tiene transacciones: si falla algún paso posterior, se
  // deshace a mano lo insertado para no dejar un cuadro a medio armar (que
  // además bloquearía volver a generarlo).
  try {
    const { error: updateError } = await supabase
      .from("circuito_categories")
      .update({ draw_size: participants.length })
      .eq("id", categoryId)
    if (updateError) throw new Error(`Error al fijar draw_size: ${updateError.message}`)

    if (bracket.format === "single_elimination") await ensureRepechajeStructure(supabase, categoryId)
    await syncCircuitoBracketSlots(supabase, categoryId, bracket.format)
  } catch (e) {
    await supabase.from("circuito_matches").delete().eq("category_id", categoryId)
    await supabase.from("circuito_categories").update({ draw_size: null }).eq("id", categoryId)
    throw e
  }
}

export async function getCircuitoDrawFormat(categoryId: string) {
  const supabase = createAdminClient()
  const { data: category, error } = await supabase
    .from("circuito_categories")
    .select("draw_size")
    .eq("id", categoryId)
    .maybeSingle()

  if (error || !category?.draw_size) return null
  return selectDrawRule(category.draw_size, CIRCUITO_FORMAT_SPEC)
}
