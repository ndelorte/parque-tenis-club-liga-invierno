import { createAdminClient } from "@/lib/supabase/admin"
import { generateBracket, selectDrawRule } from "@/lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import type { CircuitoBracket, CircuitoParticipant } from "@/lib/circuito/types"
import type { CircuitoMatchRow } from "./types"

type AdminClient = ReturnType<typeof createAdminClient>

// Vuelca un CircuitoBracket (lib/circuito/generateBracket.ts) a filas de
// circuito_matches. Los byes de la 1ª ronda ya tienen ganador conocido —
// se avanzan solos a la ronda siguiente, sin esperar carga de resultado.
export async function persistCircuitoBracket(
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

  const { data: round1 } = await supabase
    .from("circuito_matches")
    .select("*")
    .eq("category_id", categoryId)
    .eq("bracket", bracketType)
    .eq("round_number", 1)

  for (const row of (round1 ?? []) as CircuitoMatchRow[]) {
    // Bye: un solo participante, sin rival — avanza automático.
    if (row.participant_a_id && !row.participant_b_id) {
      await advanceWinnerInDb(supabase, row, row.participant_a_id)
    }
  }
}

// Propaga un ganador a su lugar en la ronda siguiente usando `position`
// (mismo criterio que lib/circuito/advanceWinner.ts, pero contra la DB en
// vez de contra el CircuitoBracket en memoria).
export async function advanceWinnerInDb(
  supabase: AdminClient,
  match: Pick<CircuitoMatchRow, "category_id" | "bracket" | "round_number" | "position">,
  winnerId: string,
): Promise<void> {
  const nextRound = match.round_number + 1
  const nextPosition = Math.floor(match.position / 2)
  const slot = match.position % 2 === 0 ? "participant_a_id" : "participant_b_id"

  await supabase
    .from("circuito_matches")
    .update({ [slot]: winnerId })
    .eq("category_id", match.category_id)
    .eq("bracket", match.bracket)
    .eq("round_number", nextRound)
    .eq("position", nextPosition)
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

  const { data: participantRows, error } = await supabase
    .from("circuito_participants")
    .select("id, seed")
    .eq("category_id", categoryId)

  if (error) throw new Error(`Error al leer participantes: ${error.message}`)

  const participants: CircuitoParticipant[] = (participantRows ?? []).map((p) => ({
    id: p.id,
    seed: p.seed,
  }))

  const bracket = generateBracket(participants, CIRCUITO_FORMAT_SPEC)

  const { error: updateError } = await supabase
    .from("circuito_categories")
    .update({ draw_size: participants.length })
    .eq("id", categoryId)
  if (updateError) throw new Error(`Error al fijar draw_size: ${updateError.message}`)

  await persistCircuitoBracket(supabase, categoryId, "main", bracket)
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
