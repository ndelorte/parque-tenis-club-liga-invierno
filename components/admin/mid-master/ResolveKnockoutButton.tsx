"use client"

import { useState } from "react"
import { Swords } from "lucide-react"
import { resolveKnockoutParticipants } from "@/app/actions/mid-master"

interface Props {
  categoryId: string
}

export function ResolveKnockoutButton({ categoryId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleResolve() {
    setLoading(true)
    setError("")
    const result = await resolveKnockoutParticipants(categoryId)
    setLoading(false)
    if (!result.ok) setError(result.error)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleResolve}
        disabled={loading}
        className="flex items-center gap-1.5 rounded border border-mm-gold/50 px-3 py-1.5 text-xs font-medium text-mm-gold hover:border-mm-gold hover:bg-mm-gold/5 disabled:opacity-50"
      >
        <Swords className="size-3.5" />
        {loading ? "Asignando..." : "Asignar semifinalistas"}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
