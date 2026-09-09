"use client"

import { useState } from "react"
import { Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { updateInterparqueMatchResult, deleteInterparqueMatch } from "@/app/actions/interparque"
import type { InterparqueMatch, InterparquePlayerRow } from "@/lib/data/interparque"

interface Props {
  match: InterparqueMatch
  players: InterparquePlayerRow[]
}

function playerName(players: InterparquePlayerRow[], id: string) {
  const player = players.find((p) => p.id === id)
  return player ? `${player.first_name} ${player.last_name}` : "—"
}

function fmtDate(d: string | null) {
  if (!d) return null
  const dt = new Date(d + "T12:00:00")
  return dt.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
}

export function MatchForm({ match, players }: Props) {
  const [open, setOpen] = useState(false)
  const [score, setScore] = useState(match.score ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const nameA = playerName(players, match.player_a_id)
  const nameB = playerName(players, match.player_b_id)
  const isCompleted = match.status === "completed"

  async function handleResult() {
    if (!score.trim()) { setError("Ingresá el score."); return }
    setLoading(true); setError(""); setSuccess("")
    const result = await updateInterparqueMatchResult(match.id, score.trim())
    setLoading(false)
    if (result.ok) { setSuccess("Resultado guardado."); setOpen(false) }
    else setError(result.error)
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar este partido?")) return
    setLoading(true); setError("")
    await deleteInterparqueMatch(match.id)
    setLoading(false)
  }

  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-2 px-4 py-3">
        <span
          className={`size-2 shrink-0 rounded-full ${isCompleted ? "bg-green-500" : "bg-muted-foreground/30"}`}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`truncate ${isCompleted && match.winner_player_id === match.player_a_id ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {nameA}
            </span>
            {isCompleted ? (
              <span className="shrink-0 font-mono text-xs font-semibold text-foreground">
                {match.score}
              </span>
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground">vs</span>
            )}
            <span
              className={`truncate text-right ${isCompleted && match.winner_player_id === match.player_b_id ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {nameB}
            </span>
          </div>
          {isCompleted && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {match.points_a} — {match.points_b} pts
              {match.match_date && ` · ${fmtDate(match.match_date)}`}
            </p>
          )}
          {!isCompleted && match.match_date && (
            <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(match.match_date)}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500"
            title="Eliminar partido"
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            onClick={() => { setOpen(!open); setError(""); setSuccess("") }}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-white px-4 py-4">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Score — ej: 6-4 6-2 (o 6-4 6-7 10-8 con super tie-break)
              </label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="6-4 6-2"
                className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 font-mono text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
              <p className="mt-1 text-xs text-gray-400">
                Super tie-break: gana quien llega a 10+ puntos con 2 de diferencia (ej. 10-8, 11-9).
              </p>
            </div>
            <button
              onClick={handleResult}
              disabled={loading}
              className="w-full rounded bg-brand py-2 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {loading ? "Guardando..." : isCompleted ? "Corregir resultado" : "Cargar resultado"}
            </button>
          </div>

          {(error || success) && (
            <p className={`mt-3 rounded px-3 py-2 text-xs ${error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
              {error || success}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
