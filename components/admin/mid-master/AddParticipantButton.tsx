"use client"

import { useState } from "react"
import { Plus, Check, X } from "lucide-react"
import { addMmParticipant } from "@/app/actions/mid-master"

interface Props {
  categoryId: string
  groupId: string
  groupName: string
}

export function AddParticipantButton({ categoryId, groupId, groupName }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    setError("")
    const result = await addMmParticipant(categoryId, groupId, groupName, name)
    setLoading(false)
    if (result.ok) {
      setName("")
      setOpen(false)
    } else {
      setError(result.error)
    }
  }

  function handleCancel() {
    setName("")
    setError("")
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-accent"
      >
        <Plus className="size-3.5" />
        Agregar jugadora
      </button>
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
          className="flex-1 rounded border border-border-strong bg-card px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
          placeholder="Nombre de la jugadora"
        />
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex size-7 items-center justify-center rounded bg-accent text-accent-foreground hover:bg-accent-dark disabled:opacity-50"
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
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  )
}
