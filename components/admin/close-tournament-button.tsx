"use client"

import { useState, useTransition } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { closeTournament } from "@/app/actions/admin"

interface Props {
  tournamentId: string
  tournamentName: string
  missingCategories: string[]
}

export function CloseTournamentButton({ tournamentId, tournamentName, missingCategories }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)

  const ready = missingCategories.length === 0

  function handleClick() {
    if (!ready) return
    const confirmed = window.confirm(
      `¿Cerrar ${tournamentName}? Se va a marcar como finalizada y se deshabilita la carga de resultados.`,
    )
    if (!confirmed) return

    setError(null)
    startTransition(async () => {
      const result = await closeTournament(tournamentId)
      if (!result.success) {
        setError(result.error ?? "No se pudo cerrar la temporada")
        return
      }
      setClosed(true)
    })
  }

  if (closed) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Temporada cerrada. Actualizá la página para ver el cambio reflejado.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">Cerrar temporada</p>
          <p className="text-sm text-gray-500">
            {ready
              ? "Todas las categorías tienen su final cargada. Se puede cerrar la edición."
              : `Faltan finales por cargar en: ${missingCategories.join(", ")}.`}
          </p>
        </div>
        <Button type="button" variant="outline" disabled={!ready || isPending} onClick={handleClick}>
          <Lock className="size-4" />
          {isPending ? "Cerrando…" : "Cerrar temporada"}
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
