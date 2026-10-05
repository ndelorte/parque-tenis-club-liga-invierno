import type { SupabaseClient } from "@supabase/supabase-js"
import { mergeRankingPoints } from "@/lib/data/circuito/ranking"

// Cliente de servicio, tipado o no (lo usan la app y los scripts).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>

export interface MergeSummary {
  keepId: string
  dropId: string
  circuitoParticipants: number
  rankingRows: number
  teamPlayers: number
  courtMatches: number
}

async function must<T>(op: PromiseLike<{ data: T | null; error: { message: string } | null }>, what: string): Promise<T> {
  const { data, error } = await op
  if (error) throw new Error(`${what}: ${error.message}`)
  return (data ?? ([] as unknown)) as T
}

// Unifica dos fichas de la misma persona: todo lo que apuntaba a `dropId`
// pasa a `keepId` (inscripciones y puntos del Circuito, equipos y canchas de
// la Liga) y la ficha sobrante se desactiva (no se borra, por si hay que
// deshacer). Si `finalName` viene, `keepId` queda con ese nombre.
//
// Sin transacciones en el cliente de Supabase: cada paso es idempotente (se
// puede volver a correr si algo falla a mitad).
export async function mergePlayers(db: Db, keepId: string, dropId: string, finalName?: string): Promise<MergeSummary> {
  if (keepId === dropId) throw new Error("No se puede unificar un jugador consigo mismo.")
  const summary: MergeSummary = { keepId, dropId, circuitoParticipants: 0, rankingRows: 0, teamPlayers: 0, courtMatches: 0 }

  // Puntos de ranking (solo ranking.ts puede escribir esa tabla).
  summary.rankingRows = await mergeRankingPoints(db, keepId, dropId)

  // Inscripciones del Circuito (single: player_id; dobles: player_id o player_2_id).
  for (const column of ["player_id", "player_2_id"] as const) {
    const moved = await must<Array<{ id: string }>>(
      db.from("circuito_participants").update({ [column]: keepId }).eq(column, dropId).select("id"),
      "Moviendo inscripciones",
    )
    summary.circuitoParticipants += moved.length
  }

  // Equipos de la Liga: unique (team_id, player_id).
  const dropTeams = await must<Array<{ id: string; team_id: string }>>(
    db.from("team_players").select("id, team_id").eq("player_id", dropId),
    "Leyendo equipos",
  )
  const keepTeams = await must<Array<{ team_id: string }>>(
    db.from("team_players").select("team_id").eq("player_id", keepId),
    "Leyendo equipos",
  )
  for (const row of dropTeams) {
    if (keepTeams.some((k) => k.team_id === row.team_id)) {
      await must(db.from("team_players").delete().eq("id", row.id).select("id"), "Quitando duplicado de equipo")
    } else {
      await must(db.from("team_players").update({ player_id: keepId }).eq("id", row.id).select("id"), "Moviendo de equipo")
    }
    summary.teamPlayers++
  }

  for (const column of ["home_player_1_id", "home_player_2_id", "away_player_1_id", "away_player_2_id"] as const) {
    const moved = await must<Array<{ id: string }>>(
      db.from("court_matches").update({ [column]: keepId }).eq(column, dropId).select("id"),
      "Moviendo canchas",
    )
    summary.courtMatches += moved.length
  }

  const parts = finalName ? finalName.trim().replace(/\s+/g, " ") : null
  if (parts) {
    const [firstName, ...rest] = parts.split(" ")
    await must(
      db.from("players").update({ display_name: parts, first_name: firstName, last_name: rest.join(" ") }).eq("id", keepId).select("id"),
      "Guardando el nombre",
    )
  }
  await must(db.from("players").update({ active: false }).eq("id", dropId).select("id"), "Desactivando la ficha repetida")

  // El nombre de cada inscripción del Circuito es una copia: se recalcula.
  const affected = await must<Array<{ id: string; player_id: string | null; player_2_id: string | null }>>(
    db.from("circuito_participants").select("id, player_id, player_2_id").or(`player_id.eq.${keepId},player_2_id.eq.${keepId}`),
    "Leyendo inscripciones",
  )
  const ids = [...new Set(affected.flatMap((p) => [p.player_id, p.player_2_id]).filter((id): id is string => !!id))]
  const players = ids.length
    ? await must<Array<{ id: string; display_name: string }>>(db.from("players").select("id, display_name").in("id", ids), "Leyendo jugadores")
    : []
  const nameOf = (id: string) => players.find((p) => p.id === id)?.display_name ?? "?"
  for (const p of affected) {
    if (!p.player_id) continue
    const displayName = p.player_2_id ? `${nameOf(p.player_id)} / ${nameOf(p.player_2_id)}` : nameOf(p.player_id)
    await must(db.from("circuito_participants").update({ display_name: displayName }).eq("id", p.id).select("id"), "Actualizando nombres")
  }

  return summary
}
