import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { calculateCircuitoMatchResult } from "@/lib/circuito/calculateCircuitoMatchResult"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { selectDrawRule } from "@/lib/circuito/generateBracket"
import type { CircuitoParticipant, DrawFormatKind } from "@/lib/circuito/types"
import { canReorderBracket, computeSwapUpdates } from "@/lib/circuito/swapParticipants"
import { isPanelGeneratedBracket } from "@/lib/circuito/syncBracketSlots"
import { ensureRepechajeStructure, syncCircuitoBracketSlots, toBracketSlotMatch } from "./bracket"
import { recalculateAndPersistCircuitRanking } from "./ranking"
import type { CircuitoMatchRow } from "./types"

type AdminClient = ReturnType<typeof createAdminClient>

export async function getCircuitoMatches(categoryId: string): Promise<CircuitoMatchRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .order("round_number")
    .order("position")

  if (error || !data) return []
  return data
}

async function getTotalRounds(supabase: AdminClient, categoryId: string, bracket: "main" | "repechaje") {
  const { data } = await supabase
    .from("circuito_matches")
    .select("round_number")
    .eq("category_id", categoryId)
    .eq("bracket", bracket)
    .order("round_number", { ascending: false })
    .limit(1)
  return data?.[0]?.round_number ?? 0
}

// La final de cada categoría juega el 3er set con score real (excepción de
// reglas-circuito-del-parque.md); el repechaje nunca cuenta como "la final".
function isFinalRound(format: DrawFormatKind, bracket: "main" | "repechaje", roundNumber: number, totalRounds: number) {
  if (bracket === "repechaje") return false
  switch (format) {
    case "round_robin_pure":
      return false
    case "round_robin_with_final":
      return roundNumber === 2
    case "groups_then_knockout":
      return roundNumber === 3
    case "single_elimination":
      return roundNumber === totalRounds
  }
}

export async function submitCircuitoMatchResult(
  matchId: string,
  score: string,
  isWalkover: boolean,
): Promise<void> {
  const supabase = createAdminClient()

  const { data: match, error: matchError } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle()
  if (matchError || !match) throw new Error("Partido no encontrado.")
  if (!match.participant_a_id || !match.participant_b_id) {
    throw new Error("El partido todavía no tiene los dos participantes definidos.")
  }

  const { data: category, error: categoryError } = await supabase
    .from("circuito_categories")
    .select("draw_size")
    .eq("id", match.category_id)
    .maybeSingle()
  if (categoryError || !category?.draw_size) throw new Error("La categoría no tiene un cuadro generado.")

  const rule = selectDrawRule(category.draw_size, CIRCUITO_FORMAT_SPEC)
  if (!rule) throw new Error("No hay un formato válido para esta categoría.")

  await assertPanelGeneratedBracket(supabase, match.category_id)

  const totalRounds = await getTotalRounds(supabase, match.category_id, match.bracket)
  const isFinal = isFinalRound(rule.format, match.bracket, match.round_number, totalRounds)

  const result = calculateCircuitoMatchResult(score, isFinal, isWalkover)
  const winnerId = result.winnerSide === "A" ? match.participant_a_id : match.participant_b_id

  const { error: updateError } = await supabase
    .from("circuito_matches")
    .update({
      score,
      winner_id: winnerId,
      is_walkover: isWalkover,
      status: isWalkover ? "walkover" : "played",
    })
    .eq("id", matchId)
  if (updateError) throw new Error(`Error al guardar el resultado: ${updateError.message}`)

  // Todo lo que depende de este resultado se recalcula desde cero (no se
  // "avanza" solo este ganador): si se corrigió un resultado ya cargado, el
  // cambio se propaga en cascada — ver lib/circuito/syncBracketSlots.ts.
  if (rule.format === "single_elimination") await ensureRepechajeStructure(supabase, match.category_id)
  await syncCircuitoBracketSlots(supabase, match.category_id, rule.format)

  await recalculateAndPersistCircuitRanking(match.category_id)
}

// Intercambia de lugar a dos participantes del cuadro recién generado (el
// organizador corrige a mano lo que armó el sorteo). Solo antes de que se
// cargue cualquier resultado.
export async function swapCircuitoParticipants(
  categoryId: string,
  participantAId: string,
  participantBId: string,
  bracket: "main" | "repechaje" = "main",
): Promise<void> {
  const supabase = createAdminClient()

  const { data: category, error: categoryError } = await supabase
    .from("circuito_categories")
    .select("draw_size")
    .eq("id", categoryId)
    .maybeSingle()
  if (categoryError || !category?.draw_size) throw new Error("La categoría no tiene un cuadro generado.")
  const rule = selectDrawRule(category.draw_size, CIRCUITO_FORMAT_SPEC)
  if (!rule) throw new Error("No hay un formato válido para esta categoría.")

  await assertPanelGeneratedBracket(supabase, categoryId)

  const { data: matchRows, error } = await supabase.from("circuito_matches").select("*").eq("category_id", categoryId)
  if (error) throw new Error(`Error al leer el cuadro: ${error.message}`)
  const rows = (matchRows ?? []) as CircuitoMatchRow[]
  const slotMatches = rows.map(toBracketSlotMatch)

  if (!canReorderBracket(slotMatches.filter((m) => m.bracket === bracket))) {
    throw new Error(
      bracket === "main"
        ? "Ya hay resultados cargados: el orden del cuadro no se puede cambiar."
        : "Ya hay resultados cargados en el repechaje: su orden no se puede cambiar.",
    )
  }

  const updates = computeSwapUpdates(slotMatches, participantAId, participantBId, bracket)
  const applied: typeof updates = []
  try {
    for (const u of updates) {
      const { error: updateError } = await supabase
        .from("circuito_matches")
        .update({ participant_a_id: u.participantAId, participant_b_id: u.participantBId })
        .eq("id", u.matchId)
      if (updateError) throw new Error(`Error al mover participantes: ${updateError.message}`)
      applied.push(u)
    }
    await syncCircuitoBracketSlots(supabase, categoryId, rule.format)
  } catch (e) {
    // Sin transacciones: se vuelve atrás lo ya escrito para no dejar un
    // participante repetido en el cuadro.
    for (const u of applied) {
      const original = rows.find((r) => r.id === u.matchId)
      if (original) {
        await supabase
          .from("circuito_matches")
          .update({ participant_a_id: original.participant_a_id, participant_b_id: original.participant_b_id })
          .eq("id", u.matchId)
      }
    }
    throw e
  }
}

// Los cuadros importados de Challonge no se editan desde el panel: su
// estructura no es la del motor y sus puntos vienen de la planilla del club
// (scripts/import-circuito-ranking-sheet.ts). Se chequea ANTES de escribir.
async function assertPanelGeneratedBracket(supabase: AdminClient, categoryId: string) {
  const [{ data: participantRows, error: participantsError }, { data: matchRows, error: matchesError }] =
    await Promise.all([
      supabase.from("circuito_participants").select("id, seed").eq("category_id", categoryId),
      supabase.from("circuito_matches").select("*").eq("category_id", categoryId),
    ])
  if (participantsError || matchesError) throw new Error("Error al leer el cuadro.")

  const participants: CircuitoParticipant[] = (participantRows ?? []).map((p) => ({ id: p.id, seed: p.seed }))
  const matches = ((matchRows ?? []) as CircuitoMatchRow[]).map(toBracketSlotMatch)
  if (!isPanelGeneratedBracket(participants, matches, CIRCUITO_FORMAT_SPEC)) {
    throw new Error(
      "Este cuadro no se generó desde el panel (es un import histórico): sus resultados y puntos " +
        "vienen de Challonge y de la planilla del club, no se editan desde acá.",
    )
  }
}
