import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/types"
import { findSimilarPlayers, SimilarPlayersError } from "@/lib/players/similarNames"
import { assertBracketResettable, regenerateCircuitoBracket } from "./bracket"
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

// Alta rápida de un jugador que todavía no existe en `players` desde el panel
// de inscripción. Con un solo texto: la primera palabra es el nombre y el resto
// el apellido; display_name queda tal cual se escribió.
export async function createPlayerByName(fullName: string, force = false): Promise<SelectablePlayer> {
  const displayName = fullName.trim().replace(/\s+/g, " ")
  if (!displayName) throw new Error("Escribí el nombre del jugador.")

  const supabase = createAdminClient()

  // Mismo nombre en otro orden, con otros acentos o con un error de tipeo:
  // se pregunta antes de crear una ficha repetida (partiría los puntos del
  // ranking de la misma persona en dos).
  if (!force) {
    const { data: all } = await supabase.from("players").select("id, display_name").eq("active", true)
    const similar = findSimilarPlayers(
      (all ?? []).map((p) => ({ id: p.id, displayName: p.display_name })),
      displayName,
    )
    if (similar.length > 0) {
      throw new SimilarPlayersError(similar.slice(0, 5).map((s) => ({ ...s.player, match: s.match })))
    }
  }

  const [firstName, ...rest] = displayName.split(" ")
  const { data, error } = await supabase
    .from("players")
    .insert({ first_name: firstName, last_name: rest.join(" "), display_name: displayName, active: true })
    .select("id, display_name")
    .single()
  if (error || !data) throw new Error(`Error al crear el jugador: ${error?.message ?? "sin datos"}`)
  return { id: data.id, displayName: data.display_name }
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

  // Con el cuadro ya armado (y sin resultados) se rehace el sorteo después de
  // inscribir; con resultados cargados no se puede.
  const hadBracket = await assertBracketResettable(supabase, input.categoryId)

  const playerIds = input.player2Id ? [input.playerId, input.player2Id] : [input.playerId]

  const { data: inscribed } = await supabase
    .from("circuito_participants")
    .select("player_id, player_2_id")
    .eq("category_id", input.categoryId)
  const alreadyIn = (inscribed ?? []).some(
    (p) => playerIds.includes(p.player_id ?? "") || playerIds.includes(p.player_2_id ?? ""),
  )
  if (alreadyIn) throw new Error("Ese jugador ya está inscripto en esta categoría.")
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
  if (hadBracket) await regenerateCircuitoBracket(input.categoryId)
  return data
}

export async function removeCircuitoParticipant(participantId: string): Promise<void> {
  const supabase = createAdminClient()
  const { data: participant } = await supabase
    .from("circuito_participants")
    .select("category_id")
    .eq("id", participantId)
    .maybeSingle()
  if (!participant) throw new Error("No se encontró el participante.")

  const hadBracket = await assertBracketResettable(supabase, participant.category_id)
  // Hay que soltar el cuadro antes: los partidos referencian al participante.
  if (hadBracket) {
    const { error: matchesError } = await supabase.from("circuito_matches").delete().eq("category_id", participant.category_id)
    if (matchesError) throw new Error(`Error al rehacer el cuadro: ${matchesError.message}`)
  }
  const { error } = await supabase.from("circuito_participants").delete().eq("id", participantId)
  if (error) throw new Error(`Error al borrar participante: ${error.message}`)
  if (hadBracket) await regenerateCircuitoBracket(participant.category_id)
}

function splitName(fullName: string): { displayName: string; firstName: string; lastName: string } {
  const displayName = fullName.trim().replace(/\s+/g, " ")
  const [firstName, ...rest] = displayName.split(" ")
  return { displayName, firstName, lastName: rest.join(" ") }
}

// Corrige un error de tipeo en el nombre de una inscripción ya hecha (con el
// cuadro armado o no). `names` va en el orden del participante: jugador 1 y,
// en dobles, jugador 2. Se corrige el JUGADOR (tabla compartida con Liga, así
// queda bien en todos lados) y se recalcula el nombre de cada inscripción
// donde aparece. Los participantes importados sin jugador vinculado
// (Challonge) solo tienen el texto: se edita ese.
export async function renameCircuitoParticipant(participantId: string, names: string[], force = false): Promise<void> {
  const supabase = createAdminClient()
  const { data: participant, error } = await supabase
    .from("circuito_participants")
    .select("*")
    .eq("id", participantId)
    .maybeSingle()
  if (error || !participant) throw new Error("No se encontró el participante.")

  const playerIds = [participant.player_id, participant.player_2_id].filter((id): id is string => !!id)

  if (playerIds.length === 0) {
    const { displayName } = splitName(names[0] ?? "")
    if (!displayName) throw new Error("Escribí el nombre.")
    const { error: updateError } = await supabase
      .from("circuito_participants")
      .update({ display_name: displayName })
      .eq("id", participantId)
    if (updateError) throw new Error(`Error al guardar el nombre: ${updateError.message}`)
    return
  }

  if (names.length < playerIds.length || names.slice(0, playerIds.length).some((n) => !n.trim())) {
    throw new Error("Completá el nombre de todos los jugadores.")
  }

  const { data: allPlayers } = await supabase.from("players").select("id, display_name").eq("active", true)
  const everyone = (allPlayers ?? []).map((p) => ({ id: p.id, displayName: p.display_name }))

  if (!force) {
    // Un nombre igual o parecido al de OTRO jugador: se pregunta antes de guardar.
    for (const [i, playerId] of playerIds.entries()) {
      const { displayName } = splitName(names[i])
      const similar = findSimilarPlayers(everyone, displayName, playerId).filter((s) => !playerIds.includes(s.player.id))
      if (similar.length > 0) {
        throw new SimilarPlayersError(similar.slice(0, 5).map((s) => ({ ...s.player, match: s.match })))
      }
    }
  }

  for (const [i, playerId] of playerIds.entries()) {
    const { displayName, firstName, lastName } = splitName(names[i])
    const { error: playerError } = await supabase
      .from("players")
      .update({ display_name: displayName, first_name: firstName, last_name: lastName })
      .eq("id", playerId)
    if (playerError) throw new Error(`Error al guardar el nombre: ${playerError.message}`)
  }

  // Recalcula el nombre de toda inscripción (de cualquier torneo) que incluya
  // a estos jugadores.
  const idList = playerIds.join(",")
  const { data: affected, error: affectedError } = await supabase
    .from("circuito_participants")
    .select("id, player_id, player_2_id")
    .or(`player_id.in.(${idList}),player_2_id.in.(${idList})`)
  if (affectedError) throw new Error(`Error al actualizar las inscripciones: ${affectedError.message}`)

  const allIds = [...new Set((affected ?? []).flatMap((p) => [p.player_id, p.player_2_id]).filter((id): id is string => !!id))]
  const { data: players } = await supabase.from("players").select("id, display_name").in("id", allIds)
  const nameOf = (id: string) => players?.find((p) => p.id === id)?.display_name ?? "?"

  for (const p of affected ?? []) {
    const displayName = p.player_id ? (p.player_2_id ? `${nameOf(p.player_id)} / ${nameOf(p.player_2_id)}` : nameOf(p.player_id)) : null
    if (!displayName) continue
    await supabase.from("circuito_participants").update({ display_name: displayName }).eq("id", p.id)
  }
}
