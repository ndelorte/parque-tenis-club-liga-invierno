"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import {
  addCircuitoParticipantAction,
  removeCircuitoParticipantAction,
  generateCircuitoBracketAction,
  createCircuitoPlayerAction,
} from "@/app/actions/circuito"
import { Button } from "@/components/ui/button"
import { PlayerCombobox } from "@/components/admin/PlayerCombobox"

interface Participant {
  id: string
  display_name: string
  player_id: string | null
  player_2_id: string | null
  seed: number | null
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
  players: initialPlayers,
  hasBracket,
}: Props) {
  // Los jugadores creados desde acá se suman a la lista sin recargar.
  const [createdPlayers, setCreatedPlayers] = useState<Player[]>([])
  const players = [...initialPlayers, ...createdPlayers]
  const [playerId, setPlayerId] = useState("")
  const [player2Id, setPlayer2Id] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  // Se incrementa para vaciar los autocompletar después de agregar.
  const [resetKey, setResetKey] = useState(0)

  // Quien ya está inscripto en la categoría no se sugiere de nuevo.
  const inscribedIds = participants.flatMap((p) => [p.player_id, p.player_2_id]).filter((id): id is string => !!id)

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
      setResetKey((k) => k + 1)
    } else {
      setError(result.error)
    }
  }

  async function handleCreatePlayer(name: string) {
    const result = await createCircuitoPlayerAction(name)
    if (result.ok) setCreatedPlayers((prev) => [...prev, result.player])
    return result
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
              <span className="text-sm text-foreground">
                {p.seed !== null && (
                  <span className="mr-2 font-mono text-xs text-muted-foreground" title="Cabeza de serie">
                    [{p.seed}]
                  </span>
                )}
                {p.display_name}
              </span>
              {!hasBracket && (
                <button
                  onClick={() => handleRemove(p.id)}
                  disabled={loading}
                  className="rounded p-1 text-muted-foreground hover:bg-loss-soft hover:text-loss"
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
            <PlayerCombobox
              key={`p1-${resetKey}`}
              players={players}
              onCreate={handleCreatePlayer}
              onChange={setPlayerId}
              placeholder={isDobles ? "Jugador/a 1 — escribí nombre o apellido" : "Escribí nombre o apellido"}
              excludeIds={[...inscribedIds, player2Id].filter(Boolean)}
            />
            {isDobles && (
              <PlayerCombobox
                key={`p2-${resetKey}`}
                players={players}
                onCreate={handleCreatePlayer}
                onChange={setPlayer2Id}
                placeholder="Jugador/a 2 — escribí nombre o apellido"
                excludeIds={[...inscribedIds, playerId].filter(Boolean)}
              />
            )}
            <Button onClick={handleAdd} disabled={loading || !canAdd} size="sm">
              Agregar
            </Button>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <Button onClick={handleGenerate} disabled={loading || participants.length < 4} className="w-full">
              {loading ? "Generando..." : "Generar cuadro"}
            </Button>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Los cabezas de serie se asignan solos desde el ranking de la categoría al generar el cuadro.
            </p>
            {participants.length < 4 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Mínimo 4 inscriptos para que la categoría se juegue este mes.
              </p>
            )}
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-loss">{error}</p>}
    </div>
  )
}
