"use client"

import { useState } from "react"
import { createInterparquePlayer } from "@/app/actions/interparque"
import type { InterparquePlayerRow } from "@/lib/data/interparque"

interface Props {
  players: InterparquePlayerRow[]
  value: string
  onChange: (playerId: string) => void
  onPlayerCreated: (player: InterparquePlayerRow) => void
  excludeId?: string
  label: string
}

export function PlayerSelect({ players, value, onChange, onPlayerCreated, excludeId, label }: Props) {
  const [adding, setAdding] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleAdd() {
    setLoading(true)
    setError("")
    const result = await createInterparquePlayer(firstName, lastName)
    setLoading(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onPlayerCreated({
      id: result.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    onChange(result.id)
    setFirstName("")
    setLastName("")
    setAdding(false)
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500">{label}</label>
      {!adding ? (
        <div className="flex gap-2">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
          >
            <option value="">— Seleccionar jugador —</option>
            {players.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === excludeId}>
                {p.first_name} {p.last_name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="shrink-0 rounded border border-brand/40 px-2.5 py-1.5 text-xs font-medium text-brand hover:bg-brand/5"
          >
            + Nuevo
          </button>
        </div>
      ) : (
        <div className="space-y-2 rounded border border-gray-200 bg-gray-50 p-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Nombre"
              className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Apellido"
              className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={loading || !firstName.trim() || !lastName.trim()}
              className="flex-1 rounded bg-brand py-1.5 text-xs font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Agregar jugador"}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setError("") }}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
