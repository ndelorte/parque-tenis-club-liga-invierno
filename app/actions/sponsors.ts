"use server"

import { revalidatePath } from "next/cache"
import { isRequestFromAdmin } from "@/lib/auth/requireAdmin"
import {
  getTournamentSponsors,
  addTournamentSponsor,
  updateTournamentSponsor,
  deleteTournamentSponsor,
  reorderTournamentSponsors,
  type TournamentSponsor,
} from "@/lib/data/tournament-sponsors"

type ActionResult = { success: boolean; error?: string }

function refreshSponsors() {
  revalidatePath("/panel-liga")
  revalidatePath("/ligas-invierno-verano", "layout")
}

export async function getSponsorsForAdmin(tournamentId: string): Promise<TournamentSponsor[]> {
  if (!(await isRequestFromAdmin())) return []
  return getTournamentSponsors(tournamentId)
}

export async function createSponsor(formData: FormData): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return { success: false, error: "No autorizado" }
  const tournamentId = formData.get("tournamentId")
  const name = formData.get("name")
  const file = formData.get("file")
  if (typeof tournamentId !== "string" || !tournamentId || typeof name !== "string" ||
      !(file instanceof File)) return { success: false, error: "Completá la edición, el nombre y la imagen" }
  const result = await addTournamentSponsor({ tournamentId, name, file })
  if (result.success) refreshSponsors()
  return result
}

export async function editSponsor(formData: FormData): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return { success: false, error: "No autorizado" }
  const id = formData.get("id")
  const tournamentId = formData.get("tournamentId")
  const name = formData.get("name")
  const file = formData.get("file")
  if (typeof id !== "string" || !id || typeof tournamentId !== "string" || !tournamentId ||
      typeof name !== "string" || (file !== null && !(file instanceof File))) {
    return { success: false, error: "Datos incompletos" }
  }
  const result = await updateTournamentSponsor({
    id, tournamentId, name,
    file: file instanceof File && file.size > 0 ? file : undefined,
  })
  if (result.success) refreshSponsors()
  return result
}

export async function removeSponsor(id: string, tournamentId: string): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return { success: false, error: "No autorizado" }
  const result = await deleteTournamentSponsor(id, tournamentId)
  if (result.success) refreshSponsors()
  return result
}

export async function moveSponsors(tournamentId: string, orderedIds: string[]): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return { success: false, error: "No autorizado" }
  const result = await reorderTournamentSponsors(tournamentId, orderedIds)
  if (result.success) refreshSponsors()
  return result
}
