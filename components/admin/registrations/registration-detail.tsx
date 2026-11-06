"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InlineError, Notice } from "@/components/admin/states"
import {
  approveRegistration,
  getRegistrationDetail,
  listMedalCandidates,
  rejectRegistration,
  saveTeamMedals,
  setPlayerResolution,
} from "@/app/actions/liga-registrations"
import type { DetailCandidate, DetailPlayer, MedalCandidates, MedalInput, RegistrationDetail } from "@/app/actions/liga-registrations"
import { MedalsStep } from "@/components/admin/registrations/medals-step"
import { PendingPlayersEditor } from "@/components/admin/registrations/pending-players-editor"
import { RegistrationInfoForm } from "@/components/admin/registrations/registration-info-form"
import { RegistrationHistory } from "@/components/admin/registrations/registration-history"
import { TeamRoster } from "@/components/admin/registrations/team-roster"
import { TextAreaField } from "@/components/admin/registrations/field"
import { reopenRegistration, withdrawTeam } from "@/app/actions/liga-registration-team"
import { DRAWN_WARNING } from "@/lib/liga/registration/isCategoryDrawn"

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
  // Podios anteriores: candidatos, lo tildado y lo que ya estaba guardado.
  const [medals, setMedals] = useState<MedalCandidates | null>(null)
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [editingPlayers, setEditingPlayers] = useState(false)
  // "reject" o "withdraw": confirmación inline con motivo opcional.
  const [confirming, setConfirming] = useState<"reject" | "withdraw" | null>(null)
  const [reason, setReason] = useState("")

  const loadMedals = useCallback(async () => {
    const data = await listMedalCandidates(registrationId)
    setMedals(data)
    setTicked(new Set(data?.selected ?? []))
  }, [registrationId])

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
      if (data && data.status !== "rejected" && data.status !== "withdrawn") {
        listMedalCandidates(registrationId).then((m) => {
          if (!current) return
          setMedals(m)
          setTicked(new Set(m?.selected ?? []))
        })
      }
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

  function toggleMedal(key: string) {
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function tickedMedals(): MedalInput[] {
    return (medals?.candidates ?? [])
      .filter((c) => ticked.has(`${c.categoryId}:${c.place}`))
      .map((c) => ({ categoryId: c.categoryId, place: c.place }))
  }

  // Equipo ya aprobado: se guardan solo las diferencias con lo que tenía.
  async function saveMedals() {
    if (!medals) return
    const initial = new Set(medals.selected)
    const add = tickedMedals().filter((m) => !initial.has(`${m.categoryId}:${m.place}`))
    const removeCategoryIds = medals.candidates
      .filter((c) => initial.has(`${c.categoryId}:${c.place}`) && !ticked.has(`${c.categoryId}:${c.place}`))
      .map((c) => c.categoryId)
    setBusy(true)
    setError(null)
    const result = await saveTeamMedals(registrationId, { add, removeCategoryIds })
    if (!result.success) setError(result.error ?? "No se pudieron guardar las medallas")
    await loadMedals()
    setBusy(false)
  }

  async function approve() {
    setBusy(true)
    setError(null)
    const result = await approveRegistration(registrationId, tickedMedals())
    if (!result.success) {
      setError(result.error ?? "No se pudo aprobar")
      setBusy(false)
      return
    }
    await Promise.all([load(), loadMedals()])
    setBusy(false)
    onChanged()
  }

  async function reject() {
    setBusy(true)
    setError(null)
    const result = await rejectRegistration(registrationId, reason)
    if (!result.success) setError(result.error ?? "No se pudo rechazar")
    await load()
    setBusy(false)
    if (result.success) {
      setConfirming(null)
      setReason("")
      onChanged()
    }
  }

  async function reopen() {
    setBusy(true)
    setError(null)
    const result = await reopenRegistration(registrationId)
    if (!result.success) setError(result.error ?? "No se pudo reabrir")
    await Promise.all([load(), loadMedals()])
    setBusy(false)
    if (result.success) onChanged()
  }

  async function withdraw() {
    setBusy(true)
    setError(null)
    const result = await withdrawTeam(registrationId, reason)
    if (!result.success) setError(result.error ?? "No se pudo dar de baja")
    await load()
    setBusy(false)
    if (result.success) {
      setConfirming(null)
      setReason("")
      onChanged()
    }
  }

  // Después de editar algo de la ficha: recarga el detalle y avisa al listado.
  async function refresh() {
    setEditingPlayers(false)
    await load()
    onChanged()
  }

  const status = detail.status
  const hasTeam = status === "approved" || status === "withdrawn"
  const reasonId = `reason-${detail.id}`

  return (
    <div className="grid gap-5">
      {detail.drawn && status !== "rejected" && (
        <Notice variant="error" title={DRAWN_WARNING}>
          La categoría ya tiene series. Podés seguir editando el equipo, pero no cambiarlo de categoría. Los partidos y la tabla no se tocan desde acá.
        </Notice>
      )}

      <section aria-label="Resumen" className="flex flex-wrap items-center gap-3">
        <p className="text-sm">
          <span className="font-bold">{detail.categoryName}</span> · Teléfono del capitán: {detail.captainPhone}
        </p>
        {detail.whatsappUrl && (
          <a
            href={detail.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border-[1.5px] border-border bg-background px-4 text-sm font-bold focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <MessageCircle className="size-4" aria-hidden /> WhatsApp al capitán
          </a>
        )}
        {status === "rejected" && detail.rejectionReason && (
          <p className="w-full text-sm">
            <span className="font-bold">Motivo del rechazo:</span> {detail.rejectionReason}
          </p>
        )}
      </section>

      {(status === "pending" || status === "approved") && (
        <section aria-labelledby={`datos-${detail.id}`} className="grid gap-3">
          <h3 id={`datos-${detail.id}`} className="font-heading text-xl font-extrabold uppercase">
            Datos del equipo
          </h3>
          <RegistrationInfoForm detail={detail} onChanged={refresh} />
        </section>
      )}
      {!(status === "pending" || status === "approved") && detail.notes && (
        <p className="whitespace-pre-wrap text-sm">
          <span className="font-bold">Observaciones:</span> {detail.notes}
        </p>
      )}

      <section aria-labelledby={`jugadores-${detail.id}`} className="grid gap-3">
        <h3 id={`jugadores-${detail.id}`} className="font-heading text-xl font-extrabold uppercase">
          Jugadores
        </h3>
        {hasTeam ? (
          <TeamRoster registrationId={detail.id} roster={detail.roster} editable={status === "approved"} onChanged={refresh} />
        ) : editingPlayers ? (
          <PendingPlayersEditor registrationId={detail.id} players={detail.players} onSaved={refresh} onCancel={() => setEditingPlayers(false)} />
        ) : (
          <>
            <ul className="grid gap-3">
              {detail.players.map((p) => (
                <PlayerRow key={p.id} player={p} editable={editable} busy={busy} onResolve={(res, pid) => resolve(p.id, res, pid)} />
              ))}
            </ul>
            {status === "pending" && (
              <div>
                <Button type="button" variant="outline" onClick={() => setEditingPlayers(true)} disabled={busy} className="min-h-11 px-5 font-bold">
                  Editar jugadores
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {medals && status !== "rejected" && status !== "withdrawn" && (
        <>
          <MedalsStep candidates={medals.candidates} selected={ticked} disabled={busy} onToggle={toggleMedal} />
          {status === "approved" && (
            <div>
              <Button onClick={saveMedals} disabled={busy} variant="outline" className="min-h-11 px-5 font-bold">
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Guardar medallas
              </Button>
            </div>
          )}
        </>
      )}

      {error && <Notice variant="error" title="No se pudo completar">{error}</Notice>}

      {confirming && (
        <div className="grid gap-3 rounded-lg border border-border p-3">
          <TextAreaField
            id={reasonId}
            label={confirming === "reject" ? "Motivo del rechazo (opcional, interno)" : "Motivo de la baja (opcional, interno)"}
            value={reason}
            onChange={setReason}
            maxLength={300}
            hint={confirming === "withdraw" ? "El equipo queda inactivo. Las series y la tabla no se tocan: qué pasa con los partidos lo define el reglamento." : "No se crea ningún equipo."}
          />
          <div className="flex flex-wrap gap-3">
            <Button onClick={confirming === "reject" ? reject : withdraw} disabled={busy} className="min-h-11 px-5 font-bold">
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {confirming === "reject" ? "Confirmar rechazo" : "Confirmar baja del equipo"}
            </Button>
            <Button variant="outline" onClick={() => setConfirming(null)} disabled={busy} className="min-h-11 px-5 font-bold">
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!confirming && (
        <div className="flex flex-wrap items-center gap-3">
          {status === "pending" && (
            <>
              <Button onClick={approve} disabled={!allResolved || busy || editingPlayers} className="min-h-11 px-5 font-bold">
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Aprobar y crear equipo
              </Button>
              <Button variant="outline" onClick={() => setConfirming("reject")} disabled={busy} className="min-h-11 px-5 font-bold">
                Rechazar
              </Button>
              {!allResolved && (
                <p className="text-sm text-muted-foreground">
                  Falta resolver {unresolved} {unresolved === 1 ? "jugador" : "jugadores"} para poder aprobar.
                </p>
              )}
            </>
          )}
          {status === "rejected" && (
            <>
              <Button onClick={reopen} disabled={busy} className="min-h-11 px-5 font-bold">
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                Reabrir (vuelve a pendiente)
              </Button>
              <p className="text-sm font-semibold">Inscripción rechazada.</p>
            </>
          )}
          {status === "approved" && (
            <>
              <p className="text-sm font-semibold">Inscripción aprobada: el equipo ya está creado.</p>
              <Button variant="outline" onClick={() => setConfirming("withdraw")} disabled={busy} className="min-h-11 px-5 font-bold text-loss">
                Dar de baja el equipo
              </Button>
            </>
          )}
          {status === "withdrawn" && <p className="text-sm font-semibold">Equipo dado de baja.</p>}
        </div>
      )}

      <section aria-labelledby={`historial-${detail.id}`} className="grid gap-2">
        <h3 id={`historial-${detail.id}`} className="font-heading text-xl font-extrabold uppercase">
          Historial
        </h3>
        <RegistrationHistory items={detail.history} />
      </section>
    </div>
  )
}
