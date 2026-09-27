import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getCircuitoEditions } from "@/lib/data/circuito/editions"
import { CreateEditionForm } from "@/components/admin/circuito/CreateEditionForm"

export const metadata: Metadata = { title: "Circuito mensual | Panel Circuito del Parque" }
export const dynamic = "force-dynamic"

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

export default async function CircuitoMensualPage() {
  const editions = await getCircuitoEditions()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/panel-circuito" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Panel Circuito del Parque
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-foreground">Circuito mensual</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Torneos mensuales por categoría. Cada edición crea automáticamente las 14 categorías fijas.
      </p>

      <div className="mb-8">
        <CreateEditionForm />
      </div>

      {editions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay ninguna edición creada.</p>
      ) : (
        <div className="space-y-px overflow-hidden rounded-lg border border-border">
          {editions.map((edition) => (
            <Link
              key={edition.id}
              href={`/panel-circuito/mensual/${edition.slug}`}
              className="group flex items-center justify-between bg-card px-4 py-3 transition-colors hover:bg-muted"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{edition.name}</p>
                <p className="text-xs text-muted-foreground">
                  {MONTHS[edition.month - 1]} {edition.year} · {edition.status}
                </p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
