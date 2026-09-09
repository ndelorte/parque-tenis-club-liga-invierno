import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { calculateCircuitoMatchResult } from "@/lib/circuito/calculateCircuitoMatchResult"
import { calculateZoneStandings, type ZoneMatchResult } from "@/lib/circuito/calculateZoneStandings"
import { generateRepechaje } from "@/lib/circuito/generateRepechaje"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { selectDrawRule } from "@/lib/circuito/generateBracket"
import type { CircuitoParticipant, DrawFormatKind } from "@/lib/circuito/types"
import { advanceWinnerInDb, persistCircuitoBracket } from "./bracket"
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

  const totalRounds = await getTotalRounds(supabase, match.category_id, match.bracket)
  const isFinal = isFinalRound(rule.format, match.bracket, match.round_number, totalRounds)

  const result = calculateCircuitoMatchResult(score, isFinal)
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

  if (match.bracket === "main") {
    if (rule.format === "single_elimination") {
      await advanceWinnerInDb(supabase, match, winnerId)
      await maybeGenerateRepechaje(supabase, match.category_id)
    } else if (rule.format === "round_robin_with_final") {
      await maybeResolveRoundRobinFinal(supabase, match.category_id)
    } else if (rule.format === "groups_then_knockout") {
      await maybeResolveZonesToSemis(supabase, match.category_id)
      await maybeResolveSemisToFinal(supabase, match.category_id)
    }
  }

  await recalculateAndPersistCircuitRanking(match.category_id)
}

async function getParticipants(supabase: AdminClient, categoryId: string): Promise<CircuitoParticipant[]> {
  const { data } = await supabase.from("circuito_participants").select("id, seed").eq("category_id", categoryId)
  return (data ?? []).map((p) => ({ id: p.id, seed: p.seed }))
}

function toZoneMatchResults(matches: CircuitoMatchRow[]): ZoneMatchResult[] {
  return matches
    .filter((m) => m.winner_id && m.score && m.participant_a_id && m.participant_b_id)
    .map((m) => ({
      participantAId: m.participant_a_id!,
      participantBId: m.participant_b_id!,
      winnerId: m.winner_id!,
      score: m.score!,
    }))
}

// N=8+: cuando terminan de jugarse todos los partidos reales de la 1ª ronda
// (sin contar byes), se arma el repechaje una única vez.
async function maybeGenerateRepechaje(supabase: AdminClient, categoryId: string) {
  const { data: existingRepechaje } = await supabase
    .from("circuito_matches")
    .select("id")
    .eq("category_id", categoryId)
    .eq("bracket", "repechaje")
    .limit(1)
  if (existingRepechaje && existingRepechaje.length > 0) return

  const { data: round1 } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .eq("bracket", "main")
    .eq("round_number", 1)
  const round1Matches = (round1 ?? []) as CircuitoMatchRow[]
  const realMatches = round1Matches.filter((m) => m.participant_a_id && m.participant_b_id)
  if (realMatches.length === 0 || realMatches.some((m) => !m.winner_id)) return // todavía no terminó

  const loserIds = realMatches.map((m) => (m.winner_id === m.participant_a_id ? m.participant_b_id! : m.participant_a_id!))
  const { data: loserRows } = await supabase.from("circuito_participants").select("id, seed").in("id", loserIds)
  const losers: CircuitoParticipant[] = (loserRows ?? []).map((p) => ({ id: p.id, seed: p.seed }))

  const repechaje = generateRepechaje("single_elimination", losers, CIRCUITO_FORMAT_SPEC)
  if (repechaje) await persistCircuitoBracket(supabase, categoryId, "repechaje", repechaje)
}

// N=4: cuando termina la zona (todos contra todos), completa la final con
// los 2 primeros de la tabla.
async function maybeResolveRoundRobinFinal(supabase: AdminClient, categoryId: string) {
  const { data: finalMatch } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .eq("bracket", "main")
    .eq("round_number", 2)
    .maybeSingle()
  if (!finalMatch || finalMatch.participant_a_id) return // ya resuelta

  const participants = await getParticipants(supabase, categoryId)
  const { data: zoneRows } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .eq("bracket", "main")
    .eq("round_number", 1)
  const zoneMatches = toZoneMatchResults((zoneRows ?? []) as CircuitoMatchRow[])
  const totalPossible = (participants.length * (participants.length - 1)) / 2
  if (zoneMatches.length < totalPossible) return

  const standings = calculateZoneStandings(participants, zoneMatches)
  await supabase
    .from("circuito_matches")
    .update({ participant_a_id: standings[0].id, participant_b_id: standings[1].id })
    .eq("id", finalMatch.id)
}

// N=6-7: cuando las 2 zonas terminan, completa las semifinales cruzadas
// (1°A vs 2°B, 1°B vs 2°A).
async function maybeResolveZonesToSemis(supabase: AdminClient, categoryId: string) {
  const { data: semis } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .eq("bracket", "main")
    .eq("round_number", 2)
    .order("position")
  const semiRows = (semis ?? []) as CircuitoMatchRow[]
  if (semiRows.length !== 2 || semiRows[0].participant_a_id) return // ya resueltas o no existen

  const { data: zoneRows } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .eq("bracket", "main")
    .eq("round_number", 1)
  const allZoneMatches = (zoneRows ?? []) as CircuitoMatchRow[]

  const standingsByZone: Record<"A" | "B", CircuitoParticipant[]> = { A: [], B: [] }
  for (const zone of ["A", "B"] as const) {
    const zoneMatches = allZoneMatches.filter((m) => m.zone === zone)
    if (zoneMatches.length === 0) return
    const participantIds = new Set(zoneMatches.flatMap((m) => [m.participant_a_id, m.participant_b_id]))
    const { data: participantRows } = await supabase
      .from("circuito_participants")
      .select("id, seed")
      .in("id", [...participantIds].filter((id): id is string => !!id))
    const zoneParticipants: CircuitoParticipant[] = (participantRows ?? []).map((p) => ({ id: p.id, seed: p.seed }))
    const totalPossible = (zoneParticipants.length * (zoneParticipants.length - 1)) / 2
    const completed = toZoneMatchResults(zoneMatches)
    if (completed.length < totalPossible) return // esta zona no terminó
    standingsByZone[zone] = calculateZoneStandings(zoneParticipants, completed)
  }

  await supabase
    .from("circuito_matches")
    .update({ participant_a_id: standingsByZone.A[0].id, participant_b_id: standingsByZone.B[1].id })
    .eq("id", semiRows[0].id)
  await supabase
    .from("circuito_matches")
    .update({ participant_a_id: standingsByZone.B[0].id, participant_b_id: standingsByZone.A[1].id })
    .eq("id", semiRows[1].id)
}

// N=6-7: cuando las 2 semifinales terminan, completa la final con los ganadores.
async function maybeResolveSemisToFinal(supabase: AdminClient, categoryId: string) {
  const { data: finalMatch } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .eq("bracket", "main")
    .eq("round_number", 3)
    .maybeSingle()
  if (!finalMatch || finalMatch.participant_a_id) return

  const { data: semis } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .eq("bracket", "main")
    .eq("round_number", 2)
    .order("position")
  const semiRows = (semis ?? []) as CircuitoMatchRow[]
  if (semiRows.length !== 2 || semiRows.some((m) => !m.winner_id)) return

  await supabase
    .from("circuito_matches")
    .update({ participant_a_id: semiRows[0].winner_id, participant_b_id: semiRows[1].winner_id })
    .eq("id", finalMatch.id)
}
