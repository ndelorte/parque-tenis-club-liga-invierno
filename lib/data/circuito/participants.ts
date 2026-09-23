import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"
import type { CircuitoParticipantRow } from "./types"

type PlayerRow = Database["public"]["Tables"]["players"]["Row"]

export interface SelectablePlayer {
  id: string
  displayName: string
}

// players es la tabla compartida con Liga (único dato compartido intencional
// entre módulos, ADR-002) — se necesita para vincular cada circuito_participant
// a un jugador real: el ranking (circuito_ranking_points) es por player_id.
export async function getPlayersForSelect(): Promise<SelectablePlayer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("active", true)
    .order("display_name")

  if (error || !data) return []
  return (data as PlayerRow[]).map((p) => ({ id: p.id, displayName: p.display_name }))
}

export async function getCircuitoParticipants(categoryId: string): Promise<CircuitoParticipantRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("circuito_participants")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at")

  if (error || !data) return []
  return data
}

// El participante se vincula a un jugador real de `players` — el ranking
// (circuito_ranking_points) se calcula por player_id, así que un
// circuito_participant sin jugador vinculado nunca puede sumar puntos.
// display_name se deriva automáticamente del/los jugador/es (queda como
// campo propio solo para poder sobrescribirlo en el import de Challonge,
// Sprint C7, cuando todavía no hay un player_id que matchee).
export async function addCircuitoParticipant(input: {
  categoryId: string
  playerId: string
  player2Id?: string | null
  seed?: number | null
}): Promise<CircuitoParticipantRow> {
  const supabase = createAdminClient()

  const playerIds = input.player2Id ? [input.playerId, input.player2Id] : [input.playerId]
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, display_name")
    .in("id", playerIds)
  if (playersError || !players?.length) throw new Error("No se encontró el jugador seleccionado.")

  const nameOf = (id: string) => players.find((p) => p.id === id)?.display_name ?? "?"
  const displayName = input.player2Id
    ? `${nameOf(input.playerId)} / ${nameOf(input.player2Id)}`
    : nameOf(input.playerId)

  const { data, error } = await supabase
    .from("circuito_participants")
    .insert({
      category_id: input.categoryId,
      display_name: displayName,
      player_id: input.playerId,
      player_2_id: input.player2Id ?? null,
      seed: input.seed ?? null,
    })
    .select("*")
    .single()

  if (error || !data) throw new Error(`Error al agregar participante: ${error?.message ?? "sin datos"}`)
  return data
}

export async function removeCircuitoParticipant(participantId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("circuito_participants").delete().eq("id", participantId)
  if (error) throw new Error(`Error al borrar participante: ${error.message}`)
}
