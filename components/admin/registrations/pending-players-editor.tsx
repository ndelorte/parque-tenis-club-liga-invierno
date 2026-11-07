"use client"

import { useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineError, Notice } from "@/components/admin/states"
import { TextField } from "@/components/admin/registrations/field"
import { savePendingPlayers } from "@/app/actions/liga-registration-team"
import type { DetailPlayer } from "@/app/actions/liga-registrations"
import { isValidDni, normalizeDni } from "@/lib/liga/registration/normalizeDni"
import { BIRTH_DATE_MIN, LIMITS, todayIsoDate } from "@/lib/liga/registration/schema"

type Draft = { key: string; id: string | null; firstName: string; lastName: string; dni: string; birthDate: string; isCaptain: boolean }

let seq = 0
const newKey = () => `draft-${++seq}`

// Editor de los jugadores de una solicitud pendiente: agregar, quitar y
// corregir nombre, apellido o DNI, y cambiar el capitán. Un jugador corregido
// vuelve a "sin resolver" y hay que validarlo de nuevo.
export function PendingPlayersEditor({
  registrationId,
  players,
  onSaved,
  onCancel,
}: {
  registrationId: string
  players: DetailPlayer[]
  onSaved: () => void
  onCancel: () => void
}) {
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    players.map((p) => ({ key: newKey(), id: p.id, firstName: p.firstName, lastName: p.lastName, dni: p.dni, birthDate: p.birthDate ?? "", isCaptain: p.isCaptain })),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const patch = (key: string, changes: Partial<Draft>) => setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...changes } : d)))
  const setCaptain = (key: string) => setDrafts((list) => list.map((d) => ({ ...d, isCaptain: d.key === key })))
  // Si se quita al capitán, queda sin capitán y hay que elegir otro para guardar.
  const remove = (key: string) => setDrafts((list) => list.filter((d) => d.key !== key))

  function validate(): Record<string, string> {
    const next: Record<string, string> = {}
    const seen = new Set<string>()
    drafts.forEach((d, i) => {
      if (!d.firstName.trim()) next[`${i}.firstName`] = "Completá el nombre"
      if (!d.lastName.trim()) next[`${i}.lastName`] = "Completá el apellido"
      if (!isValidDni(d.dni)) next[`${i}.dni`] = "El DNI tiene que tener 7 u 8 dígitos"
      else if (seen.has(normalizeDni(d.dni))) next[`${i}.dni`] = "Este DNI está repetido en la inscripción"
      else seen.add(normalizeDni(d.dni))
      if (d.birthDate && (d.birthDate < BIRTH_DATE_MIN || d.birthDate > todayIsoDate())) next[`${i}.birthDate`] = "La fecha de nacimiento no es válida"
    })
    if (drafts.length === 0) next.list = "Cargá al menos un jugador"
    else if (drafts.filter((d) => d.isCaptain).length !== 1) next.captain = "Marcá quién es el capitán"
    return next
  }

  async function save() {
    setFormError(null)
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setBusy(true)
    const result = await savePendingPlayers(
      registrationId,
      drafts.map((d) => ({ id: d.id, firstName: d.firstName, lastName: d.lastName, dni: d.dni, birthDate: d.birthDate, isCaptain: d.isCaptain })),
    )
    setBusy(false)
    if (!result.success) {
      if (result.fieldErrors) setErrors(result.fieldErrors)
      return setFormError(result.error ?? "No se pudo guardar")
    }
    onSaved()
  }

  return (
    <div className="grid gap-3">
      <Notice variant="ok" title="Los jugadores corregidos se validan de nuevo">
        Si cambiás el nombre, el apellido o el DNI de un jugador, vuelve a &quot;Sin resolver&quot;. Cambiar la fecha de nacimiento no lo pide.
      </Notice>
      <ul className="grid gap-3">
        {drafts.map((d, i) => (
          <li key={d.key} className="grid gap-3 rounded-lg border border-border p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TextField id={`pe-${d.key}-first`} label="Nombre" value={d.firstName} onChange={(v) => patch(d.key, { firstName: v })} error={errors[`${i}.firstName`]} maxLength={LIMITS.personName} />
              <TextField id={`pe-${d.key}-last`} label="Apellido" value={d.lastName} onChange={(v) => patch(d.key, { lastName: v })} error={errors[`${i}.lastName`]} maxLength={LIMITS.personName} />
              <TextField id={`pe-${d.key}-dni`} label="DNI" inputMode="numeric" value={d.dni} onChange={(v) => patch(d.key, { dni: v })} error={errors[`${i}.dni`]} maxLength={12} />
              <TextField id={`pe-${d.key}-birth`} label="Fecha de nacimiento (opcional)" type="date" value={d.birthDate} onChange={(v) => patch(d.key, { birthDate: v })} error={errors[`${i}.birthDate`]} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex min-h-11 items-center gap-3">
                <input type="radio" name="pe-captain" className="size-5" checked={d.isCaptain} onChange={() => setCaptain(d.key)} />
                <span className="font-semibold">Es el capitán</span>
              </label>
              <button
                type="button"
                onClick={() => remove(d.key)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-bold text-loss focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label={`Quitar al jugador ${i + 1}${d.lastName ? ` (${d.lastName})` : ""}`}
              >
                <Trash2 className="size-4" aria-hidden /> Quitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      {errors.captain && <InlineError>{errors.captain}</InlineError>}
      {errors.list && <InlineError>{errors.list}</InlineError>}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDrafts((list) => [...list, { key: newKey(), id: null, firstName: "", lastName: "", dni: "", birthDate: "", isCaptain: false }])}
          className="min-h-11 px-4 font-bold"
        >
          <Plus className="size-4" aria-hidden /> Agregar jugador
        </Button>
      </div>
      {formError && <InlineError>{formError}</InlineError>}
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={save} disabled={busy} className="min-h-11 px-5 font-bold">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Guardar jugadores
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="min-h-11 px-5 font-bold">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
