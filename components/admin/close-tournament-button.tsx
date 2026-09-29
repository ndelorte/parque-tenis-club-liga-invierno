"use client"

import { useRef, useState, useTransition } from "react"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { closeTournament } from "@/app/actions/admin"
import { InlineError, Notice } from "@/components/admin/states"

interface Props {
  tournamentId: string
  tournamentName: string
  missingCategories: string[]
}

export function CloseTournamentButton({ tournamentId, tournamentName, missingCategories }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [closed, setClosed] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const ready = missingCategories.length === 0

  function handleClick() {
    if (!ready) return
    dialogRef.current?.showModal()
  }

  function confirmClose() {
    dialogRef.current?.close()
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
      <Notice variant="ok" title="Temporada cerrada.">
        Actualizá la página para ver el cambio reflejado.
      </Notice>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-foreground">Cerrar temporada</p>
          <p className="text-muted-foreground">
            {ready
              ? "Todas las categorías tienen su final cargada. Se puede cerrar la edición."
              : `Faltan finales por cargar en: ${missingCategories.join(", ")}.`}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 border-[1.5px] border-border-strong bg-card px-4 text-[15px] font-bold"
          disabled={!ready || isPending}
          onClick={handleClick}
        >
          <Lock className="size-[18px]" />
          {isPending ? "Cerrando…" : "Cerrar temporada"}
        </Button>
      </div>
      {error && <InlineError className="mt-2">{error}</InlineError>}

      <dialog
        ref={dialogRef}
        aria-labelledby="cerrar-temporada-titulo"
        className="m-auto max-w-[min(420px,calc(100vw-32px))] overscroll-contain bg-transparent p-0 backdrop:bg-foreground/45"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close()
        }}
      >
        <div className="grid w-full gap-2 rounded-lg border-t-4 border-t-destructive bg-card p-5 text-foreground">
          <h3
            id="cerrar-temporada-titulo"
            className="font-heading text-2xl font-extrabold uppercase leading-[1.05]"
          >
            ¿Cerrar {tournamentName}?
          </h3>
          <p className="text-muted-foreground">
            Se va a marcar como finalizada y se deshabilita la carga de resultados.
          </p>
          <div className="mt-2.5 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              autoFocus
              className="min-h-11 px-4 text-[15px] font-bold"
              onClick={() => dialogRef.current?.close()}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="min-h-11 bg-destructive px-4 text-[15px] font-bold text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmClose}
            >
              Cerrar temporada
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
