"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineError, Notice } from "@/components/admin/states"
import { TextField } from "@/components/admin/registrations/field"
import { addTeamPlayer, checkPlayerToAdd, correctTeamPlayer, removeTeamPlayer, setTeamCaptain } from "@/app/actions/liga-registration-team"
import type { AddCandidate, AddCheck } from "@/app/actions/liga-registration-team"
import type { RosterPlayer } from "@/app/actions/liga-registrations"
import { isValidDni } from "@/lib/liga/registration/normalizeDni"
import { BIRTH_DATE_MIN, LIMITS, todayIsoDate } from "@/lib/liga/registration/schema"

const MATCH_LABEL: Record<AddCandidate["match"], string> = {
  dni: "Mismo DNI",
  same: "Mismo nombre",
  similar: "Nombre parecido",
}

// Corrección de un jugador del plantel. La ficha del jugador es una sola
// (Liga y Circuito): el aviso se ve antes de guardar.
function CorrectForm({ registrationId, player, onDone, onCancel }: { registrationId: string; player: RosterPlayer; onDone: () => void; onCancel: () => void }) {
  const [firstName, setFirstName] = useState(player.firstName)
  const [lastName, setLastName] = useState(player.lastName)
  const [dni, setDni] = useState(player.dni ?? "")
  // Si se carga una fecha, pisa la guardada; si queda vacía, no se toca.
  const [birthDate, setBirthDate] = useState(player.birthDate ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const idp = `corr-${player.playerId}`

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Record<string, string> = {}
    if (!firstName.trim()) next.firstName = "Completá el nombre"
    if (!lastName.trim()) next.lastName = "Completá el apellido"
    if (!isValidDni(dni)) next.dni = "El DNI tiene que tener 7 u 8 dígitos"
    if (birthDate && (birthDate < BIRTH_DATE_MIN || birthDate > todayIsoDate())) next.birthDate = "La fecha de nacimiento no es válida"
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    const result = await correctTeamPlayer(registrationId, player.playerId, { firstName, lastName, dni, birthDate })
    setBusy(false)
    if (!result.success) return setFormError(result.error ?? "No se pudo guardar")
    onDone()
  }

  return (
    <form onSubmit={save} noValidate className="mt-3 grid gap-3 rounded-lg bg-muted/40 p-3">
      <Notice variant="error" title="Esta ficha es una sola para Liga y Circuito">
        El cambio de nombre, DNI o fecha de nacimiento de {player.displayName} se ve en todos lados (Liga, Circuito y rankings). Un DNI que ya es de otro jugador no se puede pisar.
      </Notice>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <TextField id={`${idp}-first`} label="Nombre" value={firstName} onChange={setFirstName} error={errors.firstName} maxLength={LIMITS.personName} />
        <TextField id={`${idp}-last`} label="Apellido" value={lastName} onChange={setLastName} error={errors.lastName} maxLength={LIMITS.personName} />
        <TextField id={`${idp}-dni`} label="DNI" inputMode="numeric" value={dni} onChange={setDni} error={errors.dni} maxLength={12} />
        <TextField id={`${idp}-birth`} label="Fecha de nacimiento (opcional)" type="date" value={birthDate} onChange={setBirthDate} error={errors.birthDate} hint="Si la cargás, reemplaza la guardada." />
      </div>
      {formError && <InlineError>{formError}</InlineError>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy} className="min-h-11 px-5 font-bold">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          Entiendo, guardar el cambio
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy} className="min-h-11 px-5 font-bold">
          Cancelar
        </Button>
      </div>
    </form>
  )
}

// Alta de un jugador con la validación de la V1: DNI exacto → nombres
// parecidos → elegir uno o crear nuevo.
function AddPlayerForm({ registrationId, onDone }: { registrationId: string; onDone: () => void }) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [dni, setDni] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [check, setCheck] = useState<AddCheck | null>(null)
  // "new" o el id del jugador existente elegido.
  const [choice, setChoice] = useState<string>("new")
  const [busy, setBusy] = useState(false)
  const idp = `add-${registrationId}`

  function reset() {
    setCheck(null)
    setFormError(null)
  }

  async function search(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Record<string, string> = {}
    if (!firstName.trim()) next.firstName = "Completá el nombre"
    if (!lastName.trim()) next.lastName = "Completá el apellido"
    if (!isValidDni(dni)) next.dni = "El DNI tiene que tener 7 u 8 dígitos"
    if (birthDate && (birthDate < BIRTH_DATE_MIN || birthDate > todayIsoDate())) next.birthDate = "La fecha de nacimiento no es válida"
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    const result = await checkPlayerToAdd(registrationId, { firstName, lastName, dni, birthDate })
    setBusy(false)
    if (!result.success) return setFormError(result.error ?? "No se pudo validar")
    setCheck(result)
    setChoice(result.exact ? result.exact.id : "new")
  }

  async function confirm() {
    setBusy(true)
    setFormError(null)
    const result = await addTeamPlayer(registrationId, {
      firstName,
      lastName,
      dni,
      birthDate,
      mode: choice === "new" ? "new" : "existing",
      playerId: choice === "new" ? null : choice,
    })
    setBusy(false)
    if (!result.success) return setFormError(result.error ?? "No se pudo agregar")
    setFirstName("")
    setLastName("")
    setDni("")
    setBirthDate("")
    setCheck(null)
    onDone()
  }

  const options: AddCandidate[] = check ? [...(check.exact ? [check.exact] : []), ...check.candidates.filter((c) => c.id !== check.exact?.id)] : []
  const chosen = options.find((o) => o.id === choice)

  return (
    <div className="grid gap-3 rounded-lg border border-border p-3">
      <h4 className="font-bold">Agregar un jugador</h4>
      <form onSubmit={search} noValidate className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TextField id={`${idp}-first`} label="Nombre" value={firstName} onChange={(v) => { setFirstName(v); reset() }} error={errors.firstName} maxLength={LIMITS.personName} />
          <TextField id={`${idp}-last`} label="Apellido" value={lastName} onChange={(v) => { setLastName(v); reset() }} error={errors.lastName} maxLength={LIMITS.personName} />
          <TextField id={`${idp}-dni`} label="DNI" inputMode="numeric" value={dni} onChange={(v) => { setDni(v); reset() }} error={errors.dni} maxLength={12} />
          <TextField id={`${idp}-birth`} label="Fecha de nacimiento (opcional)" type="date" value={birthDate} onChange={(v) => { setBirthDate(v); reset() }} error={errors.birthDate} hint="Si el jugador ya existe y tiene fecha, no se pisa." />
        </div>
        {!check && (
          <div>
            <Button type="submit" variant="outline" disabled={busy} className="min-h-11 px-5 font-bold">
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Plus className="size-4" aria-hidden />}
              Validar jugador
            </Button>
          </div>
        )}
      </form>

      {check && (
        <fieldset className="grid gap-1" disabled={busy}>
          <legend className="sr-only">Con qué jugador coincide</legend>
          {check.exact && <p className="text-sm font-semibold">Ya existe: {check.exact.displayName} (coincide el DNI)</p>}
          {!check.exact && options.length > 0 && <p className="text-sm text-muted-foreground">¿Este jugador coincide con alguno de estos?</p>}
          {options.map((c) => (
            <label key={c.id} className="flex min-h-11 items-start gap-3 rounded-md px-1 py-1.5">
              <input type="radio" name={`${idp}-choice`} className="mt-1 size-5" checked={choice === c.id} onChange={() => setChoice(c.id)} />
              <span className="min-w-0 text-sm">
                <span className="font-bold">{c.displayName}</span> · {MATCH_LABEL[c.match]}
                {c.dniMismatch && (
                  <span className="mt-0.5 flex items-start gap-1.5 font-semibold text-loss">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    Ya tiene otro DNI guardado: puede ser otra persona. Si lo elegís, el DNI guardado no se modifica.
                  </span>
                )}
                {c.otherTeam && (
                  <span className="mt-0.5 flex items-start gap-1.5 font-semibold text-loss">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    Ya está activo en &quot;{c.otherTeam}&quot; en esta categoría.
                  </span>
                )}
                {c.inTeam && (
                  <span className="mt-0.5 flex items-start gap-1.5 font-semibold text-loss">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                    Ya está en el plantel de este equipo.
                  </span>
                )}
              </span>
            </label>
          ))}
          <label className="flex min-h-11 items-center gap-3 rounded-md px-1 py-1.5">
            <input type="radio" name={`${idp}-choice`} className="size-5" checked={choice === "new"} onChange={() => setChoice("new")} />
            <span className="text-sm font-bold">{options.length > 0 ? "Es otro jugador → crear nuevo" : "Es un jugador nuevo → crear"}</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button type="button" onClick={confirm} disabled={busy || !!chosen?.inTeam} className="min-h-11 px-5 font-bold">
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Agregar al plantel
            </Button>
            <Button type="button" variant="outline" onClick={reset} disabled={busy} className="min-h-11 px-5 font-bold">
              Cambiar datos
            </Button>
          </div>
        </fieldset>
      )}
      {formError && <InlineError>{formError}</InlineError>}
    </div>
  )
}

// Plantel real de un equipo aprobado (o dado de baja, solo lectura).
export function TeamRoster({ registrationId, roster, editable, onChanged }: { registrationId: string; roster: RosterPlayer[]; editable: boolean; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [correcting, setCorrecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(playerId: string, action: () => Promise<{ success: boolean; error?: string }>) {
    setBusyId(playerId)
    setError(null)
    const result = await action()
    setBusyId(null)
    if (!result.success) return setError(result.error ?? "No se pudo completar")
    onChanged()
  }

  return (
    <div className="grid gap-3">
      <ul className="grid gap-3">
        {roster.map((p) => (
          <li key={p.playerId} className="rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-bold">{p.displayName}</p>
              <p className="text-sm text-muted-foreground">{p.dni ? `DNI ${p.dni}` : "Sin DNI cargado"}</p>
              {p.birthDate && <p className="text-sm text-muted-foreground">Nacimiento {p.birthDate.split("-").reverse().join("/")}</p>}
              {p.isCaptain && <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand">Capitán</span>}
              {!p.active && <span className="text-xs font-bold text-muted-foreground">Fuera del plantel</span>}
            </div>
            {editable && p.active && (
              <div className="mt-1 flex flex-wrap gap-x-2">
                {!p.isCaptain && (
                  <Button type="button" variant="ghost" disabled={busyId === p.playerId} onClick={() => run(p.playerId, () => setTeamCaptain(registrationId, p.playerId))} className="min-h-11 px-3 font-bold">
                    Hacer capitán
                  </Button>
                )}
                <Button type="button" variant="ghost" disabled={busyId === p.playerId} onClick={() => setCorrecting(correcting === p.playerId ? null : p.playerId)} aria-expanded={correcting === p.playerId} className="min-h-11 px-3 font-bold">
                  Corregir datos
                </Button>
                {p.isCaptain ? (
                  <span className="flex min-h-11 items-center px-3 text-sm text-muted-foreground">Para quitarlo, primero elegí otro capitán.</span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busyId === p.playerId}
                    onClick={() => {
                      if (window.confirm(`¿Quitar a ${p.displayName} del plantel?`)) run(p.playerId, () => removeTeamPlayer(registrationId, p.playerId))
                    }}
                    className="min-h-11 px-3 font-bold text-loss"
                  >
                    Quitar del plantel
                  </Button>
                )}
              </div>
            )}
            {editable && correcting === p.playerId && (
              <CorrectForm
                registrationId={registrationId}
                player={p}
                onCancel={() => setCorrecting(null)}
                onDone={() => {
                  setCorrecting(null)
                  onChanged()
                }}
              />
            )}
          </li>
        ))}
      </ul>
      {error && <InlineError>{error}</InlineError>}
      {editable && <AddPlayerForm registrationId={registrationId} onDone={onChanged} />}
    </div>
  )
}
