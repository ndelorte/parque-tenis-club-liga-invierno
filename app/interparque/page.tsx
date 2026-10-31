import type { Metadata } from "next"
import { CalendarDays } from "lucide-react"
import { EditionCard } from "@/components/interparque/EditionCard"
import { getInterparqueChampionsByEdition, getInterparqueEditions } from "@/lib/data/interparque"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Interparque | Parque Tenis Club",
  description:
    "Interparque: partidos de single entre alumnos del club, domingo a domingo. Elegí una edición para ver el calendario, la tabla de posiciones y los partidos jugados.",
}

export default async function InterparqueSelectorPage() {
  const [editions, championsByEdition] = await Promise.all([
    getInterparqueEditions(),
    getInterparqueChampionsByEdition(),
  ])

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
          <h1 className="relative inline-block pb-2.5 font-heading text-5xl leading-[0.88] font-extrabold uppercase tracking-[0.01em] text-foreground sm:text-7xl">
            Interparque
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2 w-18 bg-ball ring-1 ring-inset ring-ip-line" />
          </h1>
          <p className="mt-3 max-w-[52ch] text-base text-muted-foreground sm:text-lg">
            Partidos de single entre alumnos del club, domingo a domingo. Elegí una edición para
            ver sus fechas, la tabla de posiciones y los partidos jugados.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {editions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            <CalendarDays aria-hidden="true" className="mx-auto mb-2 size-6" />
            Todavía no hay ediciones de Interparque.
          </div>
        ) : (
          <ul role="list" className="grid gap-3">
            {editions.map((edition) => (
              <EditionCard key={edition.id} edition={edition} champions={championsByEdition[edition.id] ?? []} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
