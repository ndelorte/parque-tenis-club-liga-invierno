"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import {
  addFinalMasterEntryAction,
  drawFinalMasterCategoryAction,
  removeFinalMasterEntryAction,
  setFinalMasterPartnerAction,
} from "@/app/actions/final-master"
import { createCircuitoPlayerAction } from "@/app/actions/circuito"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/admin/states"
import { PlayerCombobox } from "@/components/admin/PlayerCombobox"
import { hasPendingPartner, PARTNER_TBD_LABEL, PENDING_PARTNER_MESSAGE } from "@/lib/final-master/partner"
import { serpentineZone, FINAL_MASTER_MAX_ENTRIES, FINAL_MASTER_MIN_ENTRIES } from "@/lib/final-master/draw"

interface Entry {
  id: string
  name: string
  playerId: string | null
  player2Id: string | null
  rankingPoints: number
}

interface Player {
  id: string
  displayName: string
}

interface Props {
  categoryId: string
  isDouble: boolean
  year: number
  // Ya ordenados por ranking (orderByRanking).
  entries: Entry[]
  players: Player[]
}

export function EntriesPanel({ categoryId, isDouble, year, entries, players: initialPlayers }: Props) {
  const router = useRouter()
  const [createdPlayers, setCreatedPlayers] = useState<Player[]>([])
  const players = [...initialPlayers, ...createdPlayers]
  const [playerId, setPlayerId] = useState("")
  const [player2Id, setPlayer2Id] = useState("")
  const [resetKey, setResetKey] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [partnerId, setPartnerId] = useState("")
  const [partnerError, setPartnerError] = useState("")

  const inscribedIds = entries.flatMap((e) => [e.playerId, e.player2Id]).filter((id): id is string => !!id)
  const full = entries.length >= FINAL_MASTER_MAX_ENTRIES
  const canAdd = !full && !!playerId && (!isDouble || !player2Id || player2Id !== playerId)
  const pending = isDouble && hasPendingPartner(entries.map((e) => ({ player_2_id: e.player2Id })))
  const canDraw = entries.length >= FINAL_MASTER_MIN_ENTRIES && entries.length <= FINAL_MASTER_MAX_ENTRIES && !pending

  async function handleAdd() {
    setLoading(true)
    setError("")
    const result = await addFinalMasterEntryAction(categoryId, playerId, isDouble ? player2Id : null)
    setLoading(false)
    if (result.ok) {
      setPlayerId("")
      setPlayer2Id("")
      setResetKey((k) => k + 1)
      router.refresh()
    } else setError(result.error)
  }

  async function handleSetPartner(participantId: string) {
    setLoading(true)
    setPartnerError("")
    const result = await setFinalMasterPartnerAction(participantId, partnerId)
    setLoading(false)
    if (result.ok) {
      setEditingId(null)
      setPartnerId("")
      router.refresh()
    } else setPartnerError(result.error)
  }

  function startEditing(id: string) {
    setEditingId(id)
    setPartnerId("")
    setError("")
    setPartnerError("")
  }

  function stopEditing() {
    setEditingId(null)
    setPartnerError("")
  }

  async function handleRemove(id: string) {
    setLoading(true)
    setError("")
    const result = await removeFinalMasterEntryAction(id)
    setLoading(false)
    if (result.ok) router.refresh()
    else setError(result.error)
  }

  async function handleDraw() {
    if (!confirm(`¿Armar los cuadros con ${entries.length} inscriptos?`)) return
    setLoading(true)
    setError("")
    const result = await drawFinalMasterCategoryAction(categoryId)
    setLoading(false)
    if (result.ok) router.refresh()
    else setError(result.error)
  }

  async function handleCreatePlayer(name: string, force = false) {
    const result = await createCircuitoPlayerAction(name, force)
    if (result.ok) setCreatedPlayers((prev) => [...prev, result.player])
    return result
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h2 className="font-heading text-xl font-bold uppercase">Inscriptos</h2>
        <p className="text-sm font-semibold tabular-nums text-muted-foreground">
          {entries.length}/{FINAL_MASTER_MAX_ENTRIES}
        </p>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">
        Se ordenan por el ranking anual {year}; los que no tienen puntos van al final, en el orden en que se cargaron.
        Zonas en serpentina: A = 1°, 4°, 5°, 8° · B = 2°, 3°, 6°, 7°.
      </p>

      {entries.length > 0 && !entries.some((e) => e.rankingPoints > 0) && (
        <p role="status" className="mb-3 text-sm font-semibold text-muted-foreground">
          Ningún inscripto tiene puntos en el ranking {year}: se ordenan por orden de carga.
        </p>
      )}

      {entries.length > 0 && (
        <ol data-testid="entries-list" className="mb-4 divide-y divide-border rounded-md border border-border">
          {entries.map((e, i) => (
            <li key={e.id} className="px-3 py-2">
              <div className="flex min-h-12 items-center gap-3">
                <span className="w-6 shrink-0 text-center font-bold tabular-nums text-muted-foreground">{i + 1}°</span>
                <span className="grid min-w-0 flex-1">
                  <span className="truncate font-semibold text-foreground">
                    {isDouble && !e.player2Id ? (
                      <>
                        {players.find((p) => p.id === e.playerId)?.displayName ?? e.name.replace(/ \/ A confirmar$/, "")} /{" "}
                        <span className="rounded bg-surface px-1.5 py-0.5 text-xs font-bold uppercase text-accent">
                          {PARTNER_TBD_LABEL}
                        </span>
                      </>
                    ) : (
                      e.name
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {e.rankingPoints > 0 ? `${e.rankingPoints} pts de ranking` : "Sin ranking"}
                  </span>
                </span>
                {isDouble && (
                  <button
                    type="button"
                    data-testid={e.player2Id ? "change-partner" : "choose-partner"}
                    onClick={() => (editingId === e.id ? stopEditing() : startEditing(e.id))}
                    disabled={loading}
                    aria-expanded={editingId === e.id}
                    className="press shrink-0 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-bold hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  >
                    {e.player2Id ? "Cambiar compañero" : "Elegir compañero"}
                  </button>
                )}
                <span
                  className="shrink-0 rounded-full border border-border-strong bg-surface px-2.5 py-0.5 text-xs font-bold"
                  title="Zona que le tocaría"
                >
                  Zona {serpentineZone(i + 1)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRemove(e.id)}
                  disabled={loading}
                  className="press flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-loss-soft hover:text-loss focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
                  aria-label={`Quitar a ${e.name}`}
                  title="Quitar"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              {editingId === e.id && (
                <div className="mt-2 flex flex-wrap items-start gap-2 pl-9">
                  <PlayerCombobox
                    key={`partner-${e.id}`}
                    players={players}
                    onCreate={handleCreatePlayer}
                    onChange={(id) => {
                      setPartnerId(id)
                      setPartnerError("")
                    }}
                    placeholder="Compañero/a — escribí nombre o apellido"
                    excludeIds={[...inscribedIds.filter((id) => id !== e.player2Id), e.playerId ?? ""].filter(Boolean)}
                  />
                  <Button
                    type="button"
                    data-testid="confirm-partner"
                    onClick={() => void handleSetPartner(e.id)}
                    disabled={loading || !partnerId}
                    size="sm"
                    className="press min-h-10"
                  >
                    Confirmar
                  </Button>
                  {partnerError && (
                    <p role="alert" className="w-full text-sm font-semibold text-loss">
                      {partnerError}
                    </p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {full ? (
        <p className="text-sm text-muted-foreground">La categoría ya tiene los {FINAL_MASTER_MAX_ENTRIES} inscriptos.</p>
      ) : (
        <div className="flex flex-wrap items-start gap-2">
          <PlayerCombobox
            key={`p1-${resetKey}`}
            players={players}
            onCreate={handleCreatePlayer}
            onChange={setPlayerId}
            placeholder={isDouble ? "Jugador/a 1 — escribí nombre o apellido" : "Escribí nombre o apellido"}
            excludeIds={[...inscribedIds, player2Id].filter(Boolean)}
          />
          {isDouble && (
            <PlayerCombobox
              key={`p2-${resetKey}`}
              players={players}
              onCreate={handleCreatePlayer}
              onChange={setPlayer2Id}
              placeholder="Jugador/a 2 — escribí nombre o apellido"
              excludeIds={[...inscribedIds, playerId].filter(Boolean)}
            />
          )}
          <Button type="button" onClick={handleAdd} disabled={loading || !canAdd} size="sm" className="press min-h-10">
            Agregar
          </Button>
        </div>
      )}
      {isDouble && !full && (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Si todavía no sabés el compañero, dejalo vacío: queda &quot;{PARTNER_TBD_LABEL}&quot;.
        </p>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <Button
          type="button"
          onClick={handleDraw}
          disabled={loading || !canDraw}
          className="press min-h-11 h-auto w-full px-4 text-[15px] font-bold"
        >
          {loading ? "Procesando..." : "Armar cuadros"}
        </Button>
        {pending && (
          <p role="status" className="mt-1.5 text-xs font-semibold text-muted-foreground">
            {PENDING_PARTNER_MESSAGE}
          </p>
        )}
        {entries.length < FINAL_MASTER_MIN_ENTRIES && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            Mínimo {FINAL_MASTER_MIN_ENTRIES} inscriptos para armar los cuadros (hay {entries.length}).
          </p>
        )}
      </div>

      {error && <InlineError className="mt-3">{error}</InlineError>}
    </div>
  )
}
