import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
import { EmptyState } from "@/components/admin/states"
import { CreateInterparqueEditionForm } from "@/components/admin/interparque/CreateInterparqueEditionForm"
import { getInterparqueEditions } from "@/lib/data/interparque"
import {
  EDITION_STATUS_LABEL,
  deriveEditionStatus,
  editionLabel,
  formatEditionRange,
} from "@/lib/interparque/editions"

// El panel debe mostrar siempre datos frescos (las lecturas ya no usan cookies).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Ediciones | Interparque",
  description: "Dashboard interno para crear y administrar las ediciones de Interparque.",
}

export default async function PanelInterparqueEditionsPage() {
  const editions = await getInterparqueEditions()
  const nextNumber = (editions[0]?.number ?? 0) + 1

  return (
    <AdminShell
      panel="interparque"
      context="Ediciones"
      currentSection="ediciones"
      publicHref="/interparque"
    >
      <AdminPageHeader
        title="Ediciones de Interparque"
        lede="Cada edición tiene su propio primer domingo, sus jugadores, sus partidos y su tabla. Creá la próxima o entrá a una para cargar partidos."
      />

      <div className="mb-8">
        <CreateInterparqueEditionForm nextNumber={nextNumber} />
      </div>

      {editions.length === 0 ? (
        <EmptyState title="Todavía no hay ninguna edición creada" icon={CalendarDays}>
          Cuando crees la primera aparece acá.
        </EmptyState>
      ) : (
        <ul role="list" className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {editions.map((edition) => (
            <li key={edition.id}>
              <Link
                href={`/panel-interparque/${edition.number}`}
                className="press group flex min-h-14 items-center justify-between gap-3 bg-card px-4 py-2.5 text-foreground transition-colors hover:bg-surface focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-accent"
              >
                <span className="grid min-w-0">
                  <span className="truncate font-bold">{editionLabel(edition.number)}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatEditionRange(edition)} · {EDITION_STATUS_LABEL[deriveEditionStatus(edition)]}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  )
}
