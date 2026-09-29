"use client"

import { useId, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

// Diálogo compartido para "abrir el detalle de una serie/fecha": hoja desde
// abajo en celular, diálogo centrado en escritorio. Mismo patrón que
// components/liga/ResultCard.tsx (dialog nativo, sin dependencia de
// shadcn/ui: el proyecto no tiene components/ui/dialog.tsx).
export function DialogSheet({
  trigger,
  triggerClassName,
  title,
  description,
  children,
}: {
  trigger: ReactNode
  triggerClassName: string
  title: ReactNode
  description?: ReactNode
  children: ReactNode
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          dialog.current?.showModal()
          closeButton.current?.focus()
        }}
        className={triggerClassName}
      >
        {trigger}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current?.close()
        }}
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto overscroll-contain rounded-t-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-foreground/55 sm:inset-0 sm:m-auto sm:max-h-[85dvh] sm:max-w-2xl sm:rounded-xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background px-5 py-4">
          <div>
            <h2 id={titleId} className="font-heading text-xl font-bold text-balance">{title}</h2>
            {description && <p id={descriptionId} className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <button
            ref={closeButton}
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Cerrar detalle"
            className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
      </dialog>
    </>
  )
}
