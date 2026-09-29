import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CalendarDays } from "lucide-react"
import { getCircuitoEditions } from "@/lib/data/circuito/editions"
import { CreateEditionForm } from "@/components/admin/circuito/CreateEditionForm"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
import { EmptyState } from "@/components/admin/states"

export const metadata: Metadata = { title: "Circuito mensual | Panel Circuito del Parque" }
export const dynamic = "force-dynamic"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default async function CircuitoMensualPage() {
  const editions = await getCircuitoEditions()

  return (
    <AdminShell
      panel="circuito"
      context="Mid Master y torneos mensuales"
      currentSection="mensual"
      publicHref="/circuito-del-parque"
    >
      <AdminPageHeader
        title="Circuito mensual"
        lede="Torneos mensuales por categoría. Cada edición crea automáticamente las 14 categorías fijas."
      />

      <div className="mb-8">
        <CreateEditionForm />
      </div>

      {editions.length === 0 ? (
        <EmptyState title="Todavía no hay ninguna edición creada" icon={CalendarDays}>
          Cuando crees la primera aparece acá, con sus 14 categorías.
        </EmptyState>
      ) : (
        <ul role="list" className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {editions.map((edition) => (
            <li key={edition.id}>
              <Link
                href={`/panel-circuito/mensual/${edition.slug}`}
                className="press group flex min-h-14 items-center justify-between gap-3 bg-card px-4 py-2.5 text-foreground transition-colors hover:bg-surface focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-accent"
              >
                <span className="grid min-w-0">
                  <span className="truncate font-bold">{edition.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {MONTHS[edition.month - 1]} {edition.year} · {edition.status}
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
