"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { createInterparqueMatch } from "@/app/actions/interparque"
import { PlayerSelect } from "./PlayerSelect"
import type { InterparquePlayerRow } from "@/lib/data/interparque"

interface Props {
  initialPlayers: InterparquePlayerRow[]
}

export function NewMatchForm({ initialPlayers }: Props) {
  const [open, setOpen] = useState(false)
  const [players, setPlayers] = useState(initialPlayers)
  const [playerAId, setPlayerAId] = useState("")
  const [playerBId, setPlayerBId] = useState("")
  const [matchDate, setMatchDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function handlePlayerCreated(player: InterparquePlayerRow) {
    setPlayers((prev) => [...prev, player].sort((a, b) => a.first_name.localeCompare(b.first_name)))
  }

  async function handleCreate() {
    setLoading(true)
    setError("")
    const result = await createInterparqueMatch(playerAId, playerBId, matchDate)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPlayerAId("")
    setPlayerBId("")
    setMatchDate("")
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand/40 py-3 text-sm font-medium text-brand hover:bg-brand/5"
      >
        <Plus className="size-4" />
        Cargar partido nuevo
      </button>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <PlayerSelect
        label="Jugador A"
        players={players}
        value={playerAId}
        onChange={setPlayerAId}
        onPlayerCreated={handlePlayerCreated}
        excludeId={playerBId}
      />
      <PlayerSelect
        label="Jugador B"
        players={players}
        value={playerBId}
        onChange={setPlayerBId}
        onPlayerCreated={handlePlayerCreated}
        excludeId={playerAId}
      />
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha (opcional)</label>
        <input
          type="date"
          value={matchDate}
          onChange={(e) => setMatchDate(e.target.value)}
          className="w-full rounded border border-border-strong bg-card px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {error && (
        <p className="rounded bg-loss-soft px-3 py-2 text-xs text-loss">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCreate}
          disabled={loading || !playerAId || !playerBId || playerAId === playerBId}
          className="flex-1 rounded bg-brand py-2 text-xs font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Crear partido"}
        </button>
        <button
          onClick={() => { setOpen(false); setError("") }}
          className="rounded border border-border-strong px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
