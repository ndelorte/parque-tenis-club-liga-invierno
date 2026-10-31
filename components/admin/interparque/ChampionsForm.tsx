"use client"

import { useState } from "react"
import { Crown } from "lucide-react"
import { setInterparqueChampion } from "@/app/actions/interparque"
import type { InterparquePlayerRow } from "@/lib/data/interparque"

// Marca de campeones: cada tilde se guarda al instante (puede haber varios).
export function ChampionsForm({ players }: { players: InterparquePlayerRow[] }) {
  const [champions, setChampions] = useState(() => new Set(players.filter((p) => p.is_champion).map((p) => p.id)))
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function toggle(playerId: string, checked: boolean) {
    setPendingId(playerId)
    setError("")
    const result = await setInterparqueChampion(playerId, checked)
    setPendingId(null)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setChampions((prev) => {
      const next = new Set(prev)
      if (checked) next.add(playerId)
      else next.delete(playerId)
      return next
    })
  }

  return (
    <div>
      <ul role="list" className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {players.map((player) => (
          <li key={player.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 text-foreground hover:bg-surface">
              <input
                type="checkbox"
                checked={champions.has(player.id)}
                disabled={pendingId === player.id}
                onChange={(e) => toggle(player.id, e.target.checked)}
                className="size-4 accent-[var(--color-accent)]"
              />
              <span className="flex-1 font-medium">
                {player.first_name} {player.last_name}
              </span>
              {champions.has(player.id) && <Crown aria-hidden="true" className="size-4 text-muted-foreground" />}
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 text-sm text-loss">{error}</p>}
    </div>
  )
}
