"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/admin/states"
import { TextAreaField, TextField } from "@/components/admin/registrations/field"
import { changeRegistrationCategory, updateRegistrationInfo } from "@/app/actions/liga-registration-team"
import type { RegistrationDetail } from "@/app/actions/liga-registrations"
import { captainPhoneSchema, LIMITS, notesSchema, teamNameSchema } from "@/lib/liga/registration/schema"
import { DRAWN_WARNING } from "@/lib/liga/registration/isCategoryDrawn"

// Datos generales de la ficha: equipo, teléfono, observaciones y categoría.
// Con el cuadro sorteado la categoría queda bloqueada (el servidor también lo
// chequea); el resto se puede editar.
export function RegistrationInfoForm({ detail, onChanged }: { detail: RegistrationDetail; onChanged: () => void }) {
  const [teamName, setTeamName] = useState(detail.teamName)
  const [phone, setPhone] = useState(detail.captainPhone)
  const [notes, setNotes] = useState(detail.notes ?? "")
  const [categoryId, setCategoryId] = useState(detail.categoryId)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  const approved = detail.status === "approved"
  const categoryLocked = approved && detail.drawn
  const idp = `info-${detail.id}`

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault()
    setSaved(null)
    setFormError(null)
    const next: Record<string, string> = {}
    const t = teamNameSchema.safeParse(teamName)
    if (!t.success) next.teamName = t.error.issues[0].message
    const p = captainPhoneSchema.safeParse(phone)
    if (!p.success) next.phone = p.error.issues[0].message
    const n = notesSchema.safeParse(notes)
    if (!n.success) next.notes = n.error.issues[0].message
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setBusy(true)
    const result = await updateRegistrationInfo(detail.id, { teamName, captainPhone: phone, notes })
    setBusy(false)
    if (!result.success) return setFormError(result.error ?? "No se pudo guardar")
    setSaved("Datos guardados")
    onChanged()
  }

  async function saveCategory() {
    setSaved(null)
    setFormError(null)
    setBusy(true)
    const result = await changeRegistrationCategory(detail.id, categoryId)
    setBusy(false)
    if (!result.success) return setFormError(result.error ?? "No se pudo cambiar la categoría")
    setSaved("Categoría cambiada")
    onChanged()
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={saveInfo} noValidate className="grid gap-3 sm:grid-cols-2">
        <TextField id={`${idp}-team`} label="Nombre del equipo" value={teamName} onChange={setTeamName} error={errors.teamName} maxLength={LIMITS.teamName} hint={approved ? "El link del equipo no cambia al renombrarlo." : undefined} />
        <TextField id={`${idp}-phone`} label="Teléfono del capitán" type="tel" inputMode="tel" value={phone} onChange={setPhone} error={errors.phone} maxLength={LIMITS.phone} />
        <div className="sm:col-span-2">
          <TextAreaField id={`${idp}-notes`} label="Observaciones" value={notes} onChange={setNotes} error={errors.notes} maxLength={LIMITS.notes} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <Button type="submit" disabled={busy} variant="outline" className="min-h-11 px-5 font-bold">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Guardar datos
          </Button>
        </div>
      </form>

      <div className="grid gap-1.5">
        <label htmlFor={`${idp}-category`} className="text-sm font-medium">
          Categoría
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <select
            id={`${idp}-category`}
            value={categoryId}
            disabled={categoryLocked || busy}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-describedby={categoryLocked ? `${idp}-category-hint` : undefined}
            className="min-h-11 min-w-48 rounded-lg border border-input bg-background px-2.5 text-base focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
          >
            {detail.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Button type="button" variant="outline" onClick={saveCategory} disabled={categoryLocked || busy || categoryId === detail.categoryId} className="min-h-11 px-5 font-bold">
            Cambiar categoría
          </Button>
        </div>
        {categoryLocked && (
          <p id={`${idp}-category-hint`} className="text-sm font-semibold text-loss">
            {DRAWN_WARNING}. Por eso la categoría no se puede cambiar.
          </p>
        )}
      </div>

      {saved && (
        <p role="status" className="text-sm font-semibold">
          {saved}
        </p>
      )}
      {formError && <InlineError>{formError}</InlineError>}
    </div>
  )
}
