import type { SupabaseClient } from "@supabase/supabase-js"
import { normalizeDni } from "./normalizeDni"
import type { RegistrationInput } from "./schema"

// Inserta una solicitud pendiente (con sus jugadores) ya validada con Zod.
// La usan la inscripción pública y la carga manual del panel. Si fallan los
// jugadores, borra la solicitud para no dejar basura. Devuelve el id o null.
export async function insertRegistration(
  supabase: SupabaseClient,
  tournamentId: string,
  data: RegistrationInput,
  actor: string,
  createdSummary: string,
): Promise<string | null> {
  const { data: registration, error: regError } = await supabase
    .from("liga_registrations")
    .insert({
      tournament_id: tournamentId,
      category_id: data.categoryId,
      team_name: data.teamName.replace(/\s+/g, " "),
      captain_phone: data.captainPhone,
      notes: data.notes ? data.notes : null,
    })
    .select("id")
    .single()
  if (regError || !registration) return null

  const { error: playersError } = await supabase.from("liga_registration_players").insert(
    data.players.map((player, index) => ({
      registration_id: registration.id,
      first_name: player.firstName.replace(/\s+/g, " "),
      last_name: player.lastName.replace(/\s+/g, " "),
      dni: normalizeDni(player.dni),
      is_captain: index === data.captainIndex,
      sort_order: index,
    })),
  )
  if (playersError) {
    await supabase.from("liga_registrations").delete().eq("id", registration.id)
    return null
  }

  // El historial no puede frenar una inscripción ya guardada.
  await supabase
    .from("liga_registration_events")
    .insert({ registration_id: registration.id, actor, kind: "created", summary: createdSummary })
  return registration.id as string
}
