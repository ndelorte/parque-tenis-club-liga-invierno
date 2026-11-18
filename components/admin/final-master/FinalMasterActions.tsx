"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  createFinalMasterEditionAction,
  publishFinalMasterAction,
  unpublishFinalMasterAction,
  undoFinalMasterDrawAction,
} from "@/app/actions/final-master"
import { Button } from "@/components/ui/button"
import { InlineError } from "@/components/admin/states"

type Result = { ok: true } | { ok: false; error: string }

// Botón que corre una action, muestra el error y refresca la página.
function ActionButton({
  label,
  pendingLabel,
  run,
  confirmText,
  variant = "default",
  disabled = false,
}: {
  label: string
  pendingLabel: string
  run: () => Promise<Result>
  confirmText?: string
  variant?: "default" | "outline"
  disabled?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handle() {
    if (confirmText && !confirm(confirmText)) return
    setLoading(true)
    setError("")
    const result = await run()
    setLoading(false)
    if (result.ok) router.refresh()
    else setError(result.error)
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={variant}
        onClick={handle}
        disabled={loading || disabled}
        className="press min-h-11 h-auto px-4 text-[15px] font-bold"
      >
        {loading ? pendingLabel : label}
      </Button>
      {error && <InlineError>{error}</InlineError>}
    </div>
  )
}

export function CreateFinalMasterButton({ year }: { year: number }) {
  return (
    <ActionButton
      label={`Crear Final Master ${year}`}
      pendingLabel="Creando..."
      run={() => createFinalMasterEditionAction(year)}
    />
  )
}

export function PublishFinalMasterButton({ editionId, published }: { editionId: string; published: boolean }) {
  return published ? (
    <ActionButton
      label="Despublicar"
      pendingLabel="Despublicando..."
      variant="outline"
      confirmText="El torneo deja de verse en la web pública. ¿Despublicar?"
      run={() => unpublishFinalMasterAction(editionId)}
    />
  ) : (
    <ActionButton
      label="Publicar torneo"
      pendingLabel="Publicando..."
      confirmText="El torneo pasa a verse en la web pública. ¿Publicar?"
      run={() => publishFinalMasterAction(editionId)}
    />
  )
}

export function UndoDrawButton({ categoryId, disabled }: { categoryId: string; disabled?: boolean }) {
  return (
    <ActionButton
      label="Deshacer cuadros"
      pendingLabel="Deshaciendo..."
      variant="outline"
      disabled={disabled}
      confirmText="Se borran las zonas, el fixture y las semifinales. Los inscriptos se mantienen. ¿Deshacer los cuadros?"
      run={() => undoFinalMasterDrawAction(categoryId)}
    />
  )
}
