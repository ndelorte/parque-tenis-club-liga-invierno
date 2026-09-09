"use server"

import { revalidatePath } from "next/cache"
import { createCircuitoEdition } from "@/lib/data/circuito/editions"
import { addCircuitoParticipant, removeCircuitoParticipant } from "@/lib/data/circuito/participants"
import { generateAndPersistCircuitoBracket } from "@/lib/data/circuito/bracket"
import { submitCircuitoMatchResult } from "@/lib/data/circuito/matches"

type ActionResult = { ok: true } | { ok: false; error: string }

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback
}

export async function createCircuitoEditionAction(
  slug: string,
  name: string,
  month: number,
  year: number,
): Promise<ActionResult> {
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
  if (!score.trim()) return { ok: false, error: "Ingresá el score." }

  try {
    await submitCircuitoMatchResult(matchId, score.trim(), isWalkover)
  } catch (e) {
    return { ok: false, error: errorMessage(e, "Error al guardar el resultado.") }
  }

  revalidatePath(`/panel-circuito/mensual/${editionSlug}/${categorySlug}`)
  return { ok: true }
}
