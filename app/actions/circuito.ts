"use server"

import { revalidatePath } from "next/cache"
import { SimilarPlayersError } from "@/lib/players/similarNames"
import { isRequestFromAdmin } from "@/lib/auth/requireAdmin"
import { addCategoryToEdition } from "@/lib/data/circuito/categories"
import { createCircuitoEdition } from "@/lib/data/circuito/editions"
import { addCircuitoParticipant, createPlayerByName, removeCircuitoParticipant, renameCircuitoParticipant, mergeParticipantIntoExistingPlayer } from "@/lib/data/circuito/participants"
import { generateAndPersistCircuitoBracket } from "@/lib/data/circuito/bracket"
import { rebuildCircuitoRepechaje, refreshRepechajeStructure, submitCircuitoMatchResult, swapCircuitoParticipants } from "@/lib/data/circuito/matches"

type ActionResult = { ok: true } | { ok: false; error: string }

const UNAUTHORIZED: ActionResult = { ok: false, error: "No autorizado." }

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback
}

export async function createCircuitoEditionAction(
  slug: string,
  name: string,
  month: number,
  year: number,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  if (!slug.trim() || !name.trim()) return { ok: false, error: "Slug y nombre son obligatorios." }
  if (month < 1 || month > 12) return { ok: false, error: "El mes debe estar entre 1 y 12." }

  try {
    await createCircuitoEdition({ slug: slug.trim(), name: name.trim(), month, year })
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al crear la edición.") }
  }

  revalidatePath("/panel-circuito/mensual")
  return { ok: true }
}

export async function addCircuitoParticipantAction(
  categoryId: string,
  playerId: string,
  player2Id: string | null,
  editionSlug: string,
  categorySlug: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  if (!playerId) return { ok: false, error: "Elegí un jugador." }

  try {
    await addCircuitoParticipant({ categoryId, playerId, player2Id })
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al agregar el participante.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  return { ok: true }
}

export async function removeCircuitoParticipantAction(
  participantId: string,
  editionSlug: string,
  categorySlug: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  try {
    await removeCircuitoParticipant(participantId)
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al borrar el participante.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  return { ok: true }
}

export async function generateCircuitoBracketAction(
  categoryId: string,
  editionSlug: string,
  categorySlug: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  try {
    await generateAndPersistCircuitoBracket(categoryId)
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al generar el cuadro.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  return { ok: true }
}

export async function submitCircuitoMatchResultAction(
  matchId: string,
  score: string,
  isWalkover: boolean,
  editionSlug: string,
  categorySlug: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  if (!score.trim()) return { ok: false, error: "Ingresá el score." }

  try {
    await submitCircuitoMatchResult(matchId, score.trim(), isWalkover)
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al guardar el resultado.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  // Páginas públicas: cuadro de la categoría, torneo y ranking (los puntos se
  // recalculan al guardar el resultado).
  revalidatePath(`/circuito-del-parque/torneos/${editionSlug}/${categorySlug}`)
  revalidatePath(`/circuito-del-parque/torneos/${editionSlug}`)
  revalidatePath("/circuito-del-parque/ranking")
  return { ok: true }
}

// Jugadores parecidos al nombre que se quiso cargar: la UI pregunta si es el mismo.
export type SimilarPlayer = { id: string; displayName: string; match: "same" | "similar"; slot?: number }
type ActionResultWithSimilar = ActionResult | { ok: false; error: string; similar: SimilarPlayer[] }

export async function createCircuitoPlayerAction(
  fullName: string,
  force = false,
): Promise<
  { ok: true; player: { id: string; displayName: string } } | { ok: false; error: string; similar?: SimilarPlayer[] }
> {
  if (!(await isRequestFromAdmin())) return { ok: false, error: "No autorizado." }
  try {
    const player = await createPlayerByName(fullName, force)
    return { ok: true, player }
  } catch (e) {
    if (e instanceof SimilarPlayersError) return { ok: false, error: e.message, similar: e.similar }
    return { ok: false, error: errorMessage(e, "Error al crear el jugador.") }
  }
}

export async function swapCircuitoParticipantsAction(
  categoryId: string,
  participantAId: string,
  participantBId: string,
  editionSlug: string,
  categorySlug: string,
  bracket: "main" | "repechaje" = "main",
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  try {
    await swapCircuitoParticipants(categoryId, participantAId, participantBId, bracket)
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al mover los participantes.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  return { ok: true }
}

export async function addCircuitoCategoryAction(
  editionId: string,
  editionSlug: string,
  name: string,
  type: "single" | "dobles",
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  if (type !== "single" && type !== "dobles") return { ok: false, error: "Elegí single o dobles." }
  try {
    await addCategoryToEdition({ editionId, name, type })
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al crear la categoría.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}`)
  revalidatePath(`/circuito-del-parque/torneos/${editionSlug}`)
  return { ok: true }
}

export async function renameCircuitoParticipantAction(
  participantId: string,
  names: string[],
  editionSlug: string,
  categorySlug: string,
  force = false,
): Promise<ActionResultWithSimilar> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  try {
    await renameCircuitoParticipant(participantId, names, force)
  } catch (e) {
    if (e instanceof SimilarPlayersError) return { ok: false, error: e.message, similar: e.similar }
    return { ok: false, error: errorMessage(e, "Error al guardar el nombre.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  revalidatePath(`/circuito-del-parque/torneos/${editionSlug}/${categorySlug}`)
  revalidatePath("/circuito-del-parque/ranking")
  return { ok: true }
}

export async function rebuildCircuitoRepechajeAction(
  categoryId: string,
  editionSlug: string,
  categorySlug: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  try {
    await rebuildCircuitoRepechaje(categoryId)
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al rehacer el repechaje.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  revalidatePath(`/circuito-del-parque/torneos/${editionSlug}/${categorySlug}`)
  return { ok: true }
}

// Recalcula los lugares del repechaje desde los resultados ya cargados (no
// borra nada). Devuelve el motivo si no pudo.
export async function refreshCircuitoRepechajeAction(
  categoryId: string,
  editionSlug: string,
  categorySlug: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  const result = await refreshRepechajeStructure(categoryId)
  if (!result.ok) return { ok: false, error: result.message ?? "No se pudo actualizar el repechaje." }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  revalidatePath(`/circuito-del-parque/torneos/${editionSlug}/${categorySlug}`)
  return { ok: true }
}

// "Es la misma persona" en el cartel de nombre repetido: la inscripción pasa a
// usar la ficha ya existente (se unifican, se suman sus puntos).
export async function mergeParticipantPlayerAction(
  participantId: string,
  slot: number,
  keepPlayerId: string,
  editionSlug: string,
  categorySlug: string,
): Promise<ActionResult> {
  if (!(await isRequestFromAdmin())) return UNAUTHORIZED
  try {
    await mergeParticipantIntoExistingPlayer(participantId, slot, keepPlayerId)
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al unificar las jugadoras.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  revalidatePath(`/circuito-del-parque/torneos/${editionSlug}/${categorySlug}`)
  revalidatePath("/circuito-del-parque/ranking")
  return { ok: true }
}
