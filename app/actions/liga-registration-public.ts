"use server"

// Server action PÚBLICA: la usa el formulario de inscripción sin sesión, así
// que NO puede tener guardia admin (por eso vive en su propio archivo y es la
// única excepción en app/actions/__tests__/admin-guard.test.ts).
// En su lugar se endurece: revalida todo con Zod en el servidor, vuelve a
// chequear abierta/fecha/min/max contra la base, usa un honeypot y limita el
// tamaño de los textos. Inserta con la service role; el teléfono y los DNI
// nunca vuelven al cliente.

import { createAdminClient } from "@/lib/supabase/admin"
import { getRegistrationAvailability } from "@/lib/liga/registration/availability"
import { buildRegistrationSchema } from "@/lib/liga/registration/schema"
import { insertRegistration } from "@/lib/liga/registration/insertRegistration"
import type { Tournament } from "@/lib/tournament/types"

export type SubmitRegistrationResult =
  | { success: true; teamName: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> }

export async function submitLigaRegistration(
  seasonSlug: string,
  input: unknown,
): Promise<SubmitRegistrationResult> {
  const generic = "No pudimos enviar la inscripción. Probá de nuevo en unos minutos."
  if (typeof seasonSlug !== "string" || seasonSlug.length > 100) return { success: false, error: generic }

  const supabase = createAdminClient()
  const { data: row } = await supabase
    .from("tournaments")
    .select(
      "id, status, registration_open, registration_deadline, registration_min_players, registration_max_players",
    )
    .eq("slug", seasonSlug)
    .maybeSingle()
  if (!row) return { success: false, error: "La inscripción está cerrada" }

  const availability = getRegistrationAvailability({
    status: row.status as Tournament["status"],
    registration_open: row.registration_open,
    registration_deadline: row.registration_deadline ?? undefined,
    registration_min_players: row.registration_min_players ?? undefined,
    registration_max_players: row.registration_max_players ?? undefined,
  })
  if (!availability.open) return { success: false, error: "La inscripción está cerrada" }

  const parsed = buildRegistrationSchema({ min: availability.min, max: availability.max }).safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".")
      if (!(key in fieldErrors)) fieldErrors[key] = issue.message
    }
    return { success: false, error: "Revisá los datos marcados en el formulario.", fieldErrors }
  }
  const data = parsed.data

  // Honeypot: a un bot le contestamos "ok" sin guardar nada.
  if (data.website && data.website.trim() !== "") return { success: true, teamName: data.teamName }

  // La categoría tiene que ser de esta edición.
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("id", data.categoryId)
    .eq("tournament_id", row.id)
    .maybeSingle()
  if (!category) {
    return { success: false, error: "Revisá los datos marcados en el formulario.", fieldErrors: { categoryId: "Elegí una categoría válida" } }
  }

  // Sin jugadores la solicitud no sirve: insertRegistration la borra si fallan.
  const registrationId = await insertRegistration(supabase, row.id, data, "Formulario público", "Llegó por el formulario de inscripción")
  if (!registrationId) return { success: false, error: generic }

  return { success: true, teamName: data.teamName }
}
