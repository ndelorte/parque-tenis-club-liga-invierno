"use client"

import { useId, useState } from "react"
import { useRouter } from "next/navigation"
import { setFinalMasterPartnerAction } from "@/app/actions/final-master"
import { Button } from "@/components/ui/button"
import { createCircuitoPlayerAction } from "@/app/actions/circuito"
import { PARTNER_TBD_LABEL } from "@/lib/final-master/partner"
import { PlayerCombobox, type ComboboxPlayer } from "@/components/admin/PlayerCombobox"

type CreateResult = Awaited<ReturnType<NonNullable<React.ComponentProps<typeof PlayerCombobox>["onCreate"]>>>

interface PickerProps {
  participantId: string
  players: ComboboxPlayer[]
  excludeIds: string[]
  onCreate: (name: string, force?: boolean) => Promise<CreateResult>
  // Se llama tras confirmar con éxito (ej. cerrar el editor).
  onDone?: () => void
  // Avisa si está guardando (el panel deshabilita sus demás botones).
  onBusy?: (busy: boolean) => void
}

// Combobox de compañero + "Confirmar" + error inline. Lo usa la lista de inscriptos
// (elegir/cambiar) y el bloque de parejas pendientes con los cuadros ya armados.
export function PartnerPicker({ participantId, players, excludeIds, onCreate, onDone, onBusy }: PickerProps) {
  const router = useRouter()
  const [partnerId, setPartnerId] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    onBusy?.(true)
    setError("")
    const result = await setFinalMasterPartnerAction(participantId, partnerId)
    setLoading(false)
    onBusy?.(false)
    if (result.ok) {
      setPartnerId("")
      onDone?.()
      router.refresh()
    } else setError(result.error)
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <PlayerCombobox
        players={players}
        onCreate={onCreate}
        onChange={(id) => {
          setPartnerId(id)
          setError("")
        }}
        placeholder="Compañero/a — escribí nombre o apellido"
        excludeIds={excludeIds}
      />
      <Button
        type="button"
        data-testid="confirm-partner"
        onClick={() => void handleConfirm()}
        disabled={loading || !partnerId}
        size="sm"
        className="press min-h-10"
      >
        Confirmar
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm font-semibold text-loss">
          {error}
        </p>
      )}
    </div>
  )
}

interface PendingEntry {
  id: string
  playerId: string | null
  // Nombre del jugador 1 (la pareja se muestra "Jugador 1 / A confirmar").
  name1: string
}

interface PendingProps {
  pending: PendingEntry[]
  players: ComboboxPlayer[]
  // Jugadores ya inscriptos en la categoría (no se pueden elegir de compañero).
  inscribedIds: string[]
}

// Con los cuadros armados: parejas con compañero "A confirmar". Confirmarlo no re-sortea:
// el puesto y la zona quedan como estaban.
export function PendingPartnersPanel({ pending, players: initialPlayers, inscribedIds }: PendingProps) {
  const [createdPlayers, setCreatedPlayers] = useState<ComboboxPlayer[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const baseId = useId()
  const players = [...initialPlayers, ...createdPlayers]

  async function handleCreatePlayer(name: string, force = false) {
    const result = await createCircuitoPlayerAction(name, force)
    if (result.ok) setCreatedPlayers((prev) => [...prev, result.player])
    return result
  }

  if (pending.length === 0) return null

  return (
    <section data-testid="pending-partners" className="mb-8 rounded-lg border border-border bg-card p-4">
      <h2 className="mb-1 font-heading text-xl font-bold uppercase">Parejas con compañero a confirmar</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Elegí el compañero cuando lo sepas: el puesto y la zona de la pareja no cambian.
      </p>
      <ul className="divide-y divide-border rounded-md border border-border">
        {pending.map((e) => (
          <li key={e.id} className="px-3 py-2">
            <div className="flex min-h-12 items-center gap-3">
              <span className="min-w-0 flex-1 truncate font-semibold text-foreground">
                {e.name1} /{" "}
                <span className="rounded bg-surface px-1.5 py-0.5 text-xs font-bold uppercase text-accent">
                  {PARTNER_TBD_LABEL}
                </span>
              </span>
              <button
                type="button"
                data-testid="choose-partner"
                onClick={() => setEditingId(editingId === e.id ? null : e.id)}
                aria-expanded={editingId === e.id}
                aria-controls={`${baseId}-${e.id}`}
                aria-label={`Elegir compañero de ${e.name1}`}
                className="press shrink-0 rounded-md border border-border-strong px-2.5 py-1.5 text-xs font-bold hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                Elegir compañero
              </button>
            </div>
            {editingId === e.id && (
              <div id={`${baseId}-${e.id}`} className="mt-2">
                <PartnerPicker
                  participantId={e.id}
                  players={players}
                  excludeIds={e.playerId ? [...inscribedIds, e.playerId] : inscribedIds}
                  onCreate={handleCreatePlayer}
                  onDone={() => setEditingId(null)}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
