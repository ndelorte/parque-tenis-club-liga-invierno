"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import {
  addCircuitoParticipantAction,
  removeCircuitoParticipantAction,
  generateCircuitoBracketAction,
} from "@/app/actions/circuito"
import { Button } from "@/components/ui/button"

interface Participant {
  id: string
  display_name: string
}

interface Player {
  id: string
  displayName: string
}

interface Props {
  categoryId: string
  categoryType: "single" | "dobles"
  editionSlug: string
  categorySlug: string
  participants: Participant[]
  players: Player[]
  hasBracket: boolean
}

export function ParticipantsPanel({
  categoryId,
  categoryType,
  editionSlug,
  categorySlug,
  participants,
  players,
  hasBracket,
}: Props) {
  const [playerId, setPlayerId] = useState("")
  const [player2Id, setPlayer2Id] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isDobles = categoryType === "dobles"
  const canAdd = playerId && (!isDobles || (player2Id && player2Id !== playerId))

  async function handleAdd() {
    setLoading(true)
    setError("")
    const result = await addCircuitoParticipantAction(
      categoryId,
      playerId,
      isDobles ? player2Id : null,
      editionSlug,
      categorySlug,
    )
    setLoading(false)
    if (result.ok) {
      setPlayerId("")
      setPlayer2Id("")
    } else {
      setError(result.error)
    }
  }

  async function handleRemove(participantId: string) {
    setLoading(true)
    setError("")
    const result = await removeCircuitoParticipantAction(participantId, editionSlug, categorySlug)
    setLoading(false)
    if (!result.ok) setError(result.error)
  }

  async function handleGenerate() {
    if (!confirm(`¿Generar el cuadro con ${participants.length} inscriptos? No se puede deshacer.`)) return
    setLoading(true)
    setError("")
    const result = await generateCircuitoBracketAction(categoryId, editionSlug, categorySlug)
    setLoading(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">
        Participantes ({participants.length})
      </p>

      {participants.length > 0 && (
        <ul className="mb-3 divide-y divide-border">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">{p.display_name}</span>
              {!hasBracket && (
                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={loading}
                  className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                  title="Quitar"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!hasBracket && (
        <>
          <div className="flex flex-wrap gap-2">
            <select
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="flex h-9 min-w-[10rem] flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
            >
              <option value="">{isDobles ? "Jugador/a 1" : "Elegir jugador/a"}</option>
              {players.map((p) => (
                <option key={p.id} value={p.id} disabled={p.id === player2Id}>
                  {p.displayName}
                </option>
              ))}
            </select>
            {isDobles && (
              <select
                value={player2Id}
                onChange={(e) => setPlayer2Id(e.target.value)}
                className="flex h-9 min-w-[10rem] flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Jugador/a 2</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === playerId}>
                    {p.displayName}
                  </option>
                ))}
              </select>
            )}
            <Button onClick={handleAdd} disabled={loading || !canAdd} size="sm">
              Agregar
            </Button>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <Button onClick={handleGenerate} disabled={loading || participants.length < 4} className="w-full">
              {loading ? "Generando..." : "Generar cuadro"}
            </Button>
            {participants.length < 4 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Mínimo 4 inscriptos para que la categoría se juegue este mes.
              </p>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  )
}
