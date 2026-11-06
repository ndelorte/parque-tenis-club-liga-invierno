import { toDisplayName } from "./suggestPlayerMatches"

// Textos legibles del historial de una inscripción ("Se agregó a Pérez Juan").
// Los arma la app y los guarda la RPC en la misma transacción que el cambio.

export type HistoryEvent = { kind: string; summary: string }

type NamePart = { firstName: string; lastName: string }

export type EditablePlayer = NamePart & { id: string | null; dni: string; isCaptain: boolean }

export const name = (p: NamePart) => toDisplayName(p)

export const playerAdded = (p: NamePart): HistoryEvent => ({ kind: "player_added", summary: `Se agregó a ${name(p)}` })
export const playerRemoved = (p: NamePart): HistoryEvent => ({ kind: "player_removed", summary: `Se quitó a ${name(p)}` })

export const captainChanged = (from: string | null, to: string): HistoryEvent => ({
  kind: "captain",
  summary: `Capitán: ${from || "sin definir"} → ${to}`,
})

export const categoryChanged = (from: string, to: string): HistoryEvent => ({
  kind: "category",
  summary: `Categoría: ${from} → ${to}`,
})

export function playerCorrected(before: NamePart & { dni: string }, after: NamePart & { dni: string }): HistoryEvent | null {
  const parts: string[] = []
  if (name(before) !== name(after)) parts.push(`nombre ${name(before)} → ${name(after)}`)
  if (before.dni !== after.dni) parts.push(`DNI ${before.dni} → ${after.dni}`)
  if (parts.length === 0) return null
  return { kind: "player_corrected", summary: `Se corrigió a ${name(before)}: ${parts.join(", ")}` }
}

export const registrationCreated = (source: string): HistoryEvent => ({ kind: "created", summary: source })
export const registrationApproved = (teamName: string): HistoryEvent => ({
  kind: "approved",
  summary: `Se aprobó la inscripción y se creó el equipo ${teamName}`,
})
export const registrationRejected = (reason: string | null): HistoryEvent => ({
  kind: "rejected",
  summary: reason ? `Se rechazó la inscripción. Motivo: ${reason}` : "Se rechazó la inscripción",
})
export const registrationReopened = (): HistoryEvent => ({ kind: "reopened", summary: "Se reabrió la inscripción: vuelve a pendiente" })
export const teamWithdrawn = (): HistoryEvent => ({ kind: "withdrawn", summary: "Se dio de baja al equipo" })

type InfoFields = { teamName: string; captainPhone: string; notes: string | null }

function notesChange(before: string | null, after: string | null): string {
  if (!before && after) return "Observaciones: se agregaron"
  if (before && !after) return "Observaciones: se borraron"
  return "Observaciones: se modificaron"
}

export function describeInfoChanges(before: InfoFields, after: InfoFields): HistoryEvent[] {
  const events: HistoryEvent[] = []
  if (before.teamName !== after.teamName) {
    events.push({ kind: "info", summary: `Equipo: ${before.teamName} → ${after.teamName}` })
  }
  if (before.captainPhone !== after.captainPhone) {
    events.push({ kind: "info", summary: `Teléfono del capitán: ${before.captainPhone} → ${after.captainPhone}` })
  }
  if ((before.notes ?? "") !== (after.notes ?? "")) {
    events.push({ kind: "info", summary: notesChange(before.notes, after.notes) })
  }
  return events
}

// Diferencias entre la lista guardada y la que manda el admin (solicitud pendiente).
export function describePlayerListChanges(before: EditablePlayer[], after: EditablePlayer[]): HistoryEvent[] {
  const events: HistoryEvent[] = []
  const afterIds = new Set(after.filter((p) => p.id).map((p) => p.id))
  const beforeById = new Map(before.map((p) => [p.id, p]))

  for (const p of before) if (!afterIds.has(p.id)) events.push(playerRemoved(p))
  for (const p of after) {
    const old = p.id ? beforeById.get(p.id) : undefined
    if (!old) {
      events.push(playerAdded(p))
      continue
    }
    const corrected = playerCorrected(old, p)
    if (corrected) events.push(corrected)
  }

  const oldCaptain = before.find((p) => p.isCaptain)
  const newCaptain = after.find((p) => p.isCaptain)
  if (newCaptain && (!oldCaptain || oldCaptain.id !== newCaptain.id)) {
    events.push(captainChanged(oldCaptain ? name(oldCaptain) : null, name(newCaptain)))
  }
  return events
}
