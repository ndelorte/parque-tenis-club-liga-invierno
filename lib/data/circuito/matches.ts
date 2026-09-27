import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { calculateCircuitoMatchResult } from "@/lib/circuito/calculateCircuitoMatchResult"
import { generateRepechaje } from "@/lib/circuito/generateRepechaje"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { selectDrawRule } from "@/lib/circuito/generateBracket"
import type { CircuitoParticipant, DrawFormatKind } from "@/lib/circuito/types"
import { isPanelGeneratedBracket, round1LosersIfComplete } from "@/lib/circuito/syncBracketSlots"
import { insertCircuitoBracket, syncCircuitoBracketSlots, toBracketSlotMatch } from "./bracket"
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
  if (rule.format === "single_elimination") await syncRepechaje(supabase, match.category_id)
  await syncCircuitoBracketSlots(supabase, match.category_id, rule.format)

  await recalculateAndPersistCircuitRanking(match.category_id)
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

// N=8+: cuando terminan de jugarse todos los partidos reales de la 1ª ronda
// (sin contar byes), se arma el repechaje con sus perdedores. Si después se
// corrige un resultado de 1ª ronda y cambia quién perdió, el repechaje ya
// no corresponde y se vuelve a armar (el repechaje no da puntos, así que
// rehacerlo no toca el ranking).
async function syncRepechaje(supabase: AdminClient, categoryId: string) {
  const { data, error } = await supabase.from("circuito_matches").select("*").eq("category_id", categoryId)
  if (error) throw new Error(`Error al leer el cuadro: ${error.message}`)
  const rows = (data ?? []) as CircuitoMatchRow[]

  const loserIds = round1LosersIfComplete(rows.map(toBracketSlotMatch))
  if (!loserIds) return // la 1ª ronda todavía no terminó

  const repechajeRows = rows.filter((r) => r.bracket === "repechaje")
  if (repechajeRows.length > 0) {
    const currentIds = repechajeRows
      .filter((r) => r.round_number === 1)
      .flatMap((r) => [r.participant_a_id, r.participant_b_id])
      .filter((id): id is string => !!id)
    if (sameIdSet(currentIds, loserIds)) return

    const { error: deleteError } = await supabase
      .from("circuito_matches")
      .delete()
      .eq("category_id", categoryId)
      .eq("bracket", "repechaje")
    if (deleteError) throw new Error(`Error al rehacer el repechaje: ${deleteError.message}`)
  }

  const { data: loserRows, error: losersError } = await supabase
    .from("circuito_participants")
    .select("id, seed")
    .in("id", loserIds)
  if (losersError) throw new Error(`Error al leer participantes: ${losersError.message}`)
  const losers: CircuitoParticipant[] = (loserRows ?? []).map((p) => ({ id: p.id, seed: p.seed }))

  const repechaje = generateRepechaje("single_elimination", losers, CIRCUITO_FORMAT_SPEC)
  if (repechaje) await insertCircuitoBracket(supabase, categoryId, "repechaje", repechaje)
}

function sameIdSet(a: string[], b: string[]): boolean {
  const setA = new Set(a)
  return setA.size === new Set(b).size && b.every((id) => setA.has(id))
}
