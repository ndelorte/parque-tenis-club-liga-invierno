"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineError, Notice } from "@/components/admin/states"
import {
  approveRegistration,
  getRegistrationDetail,
  rejectRegistration,
  setPlayerResolution,
} from "@/app/actions/liga-registrations"
import type { DetailCandidate, DetailPlayer, RegistrationDetail } from "@/app/actions/liga-registrations"

const MATCH_LABEL: Record<DetailCandidate["match"], string> = {
  dni: "Mismo DNI",
  same: "Mismo nombre",
  similar: "Nombre parecido",
}

function PlayerRow({
  player,
  editable,
  busy,
  onResolve,
}: {
  player: DetailPlayer
  editable: boolean
  busy: boolean
  onResolve: (resolution: "existing" | "new" | "pending", playerId: string | null) => void
}) {
  const options: DetailCandidate[] = []
  if (player.exact) options.push(player.exact)
  player.candidates.forEach((c) => {
    if (!options.some((o) => o.id === c.id)) options.push(c)
  })
  const groupName = `res-${player.id}`

  return (
    <li className="rounded-lg border border-border p-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-bold">{player.displayName}</p>
        <p className="text-sm text-muted-foreground">DNI {player.dni}</p>
        {player.isCaptain && <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-bold text-brand">Capitán</span>}
        <span className="ml-auto text-xs font-bold">
          {player.resolution === "pending" && "Sin resolver"}
          {player.resolution === "existing" && `Jugador existente: ${player.resolved?.displayName ?? ""}`}
          {player.resolution === "new" && "Jugador nuevo"}
        </span>
      </div>

      {player.exact && (
        <p className="mt-1 text-sm font-semibold">Ya existe: {player.exact.displayName} (coincide el DNI)</p>
      )}

      {editable && (
        <fieldset className="mt-2 grid gap-1" disabled={busy}>
          <legend className="sr-only">Resolver a {player.displayName}</legend>
          {options.length > 0 && <p className="text-sm text-muted-foreground">¿Este jugador coincide con alguno de estos?</p>}
          {options.map((c) => (
            <label key={c.id} className="flex min-h-11 items-start gap-3 rounded-md px-1 py-1.5">
              <input
                type="radio"
                name={groupName}
                className="mt-1 size-5"
                checked={player.resolution === "existing" && player.resolved?.id === c.id}
                onChange={() => onResolve("existing", c.id)}
              />
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
              </span>
            </label>
          ))}
          <label className="flex min-h-11 items-center gap-3 rounded-md px-1 py-1.5">
            <input
              type="radio"
              name={groupName}
              className="size-5"
              checked={player.resolution === "new"}
              onChange={() => onResolve("new", null)}
            />
            <span className="text-sm font-bold">{options.length > 0 ? "Es otro jugador → crear nuevo" : "Es un jugador nuevo → crear"}</span>
          </label>
        </fieldset>
      )}
    </li>
  )
}

export function RegistrationDetailView({
  registrationId,
  onChanged,
}: {
  registrationId: string
  onChanged: () => void
}) {
  const [detail, setDetail] = useState<RegistrationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const data = await getRegistrationDetail(registrationId)
    setDetail(data)
    setLoading(false)
  }, [registrationId])

  useEffect(() => {
    let current = true
    getRegistrationDetail(registrationId).then((data) => {
      if (!current) return
      setDetail(data)
      setLoading(false)
    })
    return () => {
      current = false
    }
  }, [registrationId])

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando solicitud…
      </p>
    )
  }
  if (!detail) return <InlineError>No se pudo cargar la solicitud.</InlineError>

  const editable = detail.status === "pending"
  const allResolved = detail.players.every((p) => p.resolution !== "pending")
  const unresolved = detail.players.filter((p) => p.resolution === "pending").length

  async function resolve(playerRowId: string, resolution: "existing" | "new" | "pending", playerId: string | null) {
    setBusy(true)
    setError(null)
    const result = await setPlayerResolution(playerRowId, resolution, playerId)
    if (!result.success) setError(result.error ?? "No se pudo guardar")
    await load()
    setBusy(false)
  }

  async function approve() {
    setBusy(true)
    setError(null)
    const result = await approveRegistration(registrationId)
    if (!result.success) {
      setError(result.error ?? "No se pudo aprobar")
      setBusy(false)
      return
    }
    await load()
    setBusy(false)
    onChanged()
  }

  async function reject() {
    if (!window.confirm("¿Rechazar esta inscripción? No se crea ningún equipo.")) return
    setBusy(true)
    setError(null)
    const result = await rejectRegistration(registrationId)
    if (!result.success) setError(result.error ?? "No se pudo rechazar")
    await load()
    setBusy(false)
    if (result.success) onChanged()
  }

  return (
    <div className="grid gap-3">
      <dl className="grid gap-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-bold">Teléfono del capitán</dt>
          <dd>{detail.captainPhone}</dd>
        </div>
        <div>
          <dt className="font-bold">Categoría</dt>
          <dd>{detail.categoryName}</dd>
        </div>
        {detail.notes && (
          <div className="sm:col-span-2">
            <dt className="font-bold">Observaciones</dt>
            <dd className="whitespace-pre-wrap">{detail.notes}</dd>
          </div>
        )}
      </dl>

      <ul className="grid gap-3">
        {detail.players.map((p) => (
          <PlayerRow key={p.id} player={p} editable={editable} busy={busy} onResolve={(res, pid) => resolve(p.id, res, pid)} />
        ))}
      </ul>

      {error && <Notice variant="error" title="No se pudo completar">{error}</Notice>}

      {editable ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={approve} disabled={!allResolved || busy} className="min-h-11 px-5 font-bold">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Aprobar y crear equipo
          </Button>
          <Button variant="outline" onClick={reject} disabled={busy} className="min-h-11 px-5 font-bold">
            Rechazar
          </Button>
          {!allResolved && (
            <p className="text-sm text-muted-foreground">
              Falta resolver {unresolved} {unresolved === 1 ? "jugador" : "jugadores"} para poder aprobar.
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm font-semibold">
          {detail.status === "approved" ? "Inscripción aprobada: el equipo ya está creado." : "Inscripción rechazada."}
        </p>
      )}
    </div>
  )
}
