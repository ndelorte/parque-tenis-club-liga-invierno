"use client"

import { useState } from "react"
import { Pencil, Check, X } from "lucide-react"
import { updateMmParticipant } from "@/app/actions/mid-master"
import type { DbMmParticipant } from "@/lib/data/mid-master/types"

interface Props {
  participant: DbMmParticipant
}

export function ParticipantForm({ participant }: Props) {
  const [editing, setEditing] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentName = participant.display_name ?? (participant as any).name ?? (participant as any).full_name ?? ""
  const [name, setName] = useState(currentName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    setError("")
    const result = await updateMmParticipant(participant.id, name)
    setLoading(false)
    if (result.ok) {
      setEditing(false)
    } else {
      setError(result.error)
    }
  }

  function handleCancel() {
    setName(participant.display_name)
    setEditing(false)
    setError("")
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm text-foreground">{currentName || "—"}</span>
        <button
          onClick={() => setEditing(true)}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Editar nombre"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel() }}
          className="flex-1 rounded border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-mm-gold/30"
          placeholder="Nombre del participante"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex size-7 items-center justify-center rounded bg-mm-gold text-mm-bg hover:bg-mm-gold-light disabled:opacity-50"
        >
          <Check className="size-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:bg-muted"
        >
          <X className="size-3.5" />
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
