import { AlertCircle, CheckCircle2, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

// Estados comunes de los paneles (maqueta Fase 5, "Estados comunes"):
// vacío y avisos de error / confirmación. Solo tokens semánticos.

export function EmptyState({
  title,
  children,
  action,
  icon: Icon = Inbox,
  className,
}: {
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3.5 rounded-lg border-[1.5px] border-dashed border-border-strong bg-card p-4 sm:p-5",
        className,
      )}
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h3 className="font-heading text-[22px] font-extrabold uppercase leading-[1.05]">{title}</h3>
        {children && <div className="mb-3 mt-1.5 max-w-[52ch] text-muted-foreground">{children}</div>}
        {action}
      </div>
    </div>
  )
}

export function Notice({
  variant,
  title,
  children,
  className,
}: {
  variant: "error" | "ok"
  title: string
  children?: React.ReactNode
  className?: string
}) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border-l-4 px-4 py-3.5 text-foreground",
        variant === "error" ? "border-loss bg-loss-soft" : "border-win bg-win-soft",
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 size-5 shrink-0", variant === "error" ? "text-loss" : "text-win")}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        {children && <div className="text-sm">{children}</div>}
      </div>
    </div>
  )
}

// Aviso corto de una línea (errores de campo o de acción dentro de un form).
export function InlineError({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn("flex items-start gap-1.5 text-sm font-semibold text-loss", className)}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
