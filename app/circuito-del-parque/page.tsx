import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Award, Trophy } from "lucide-react"
import { getCircuitoEditions } from "@/lib/data/circuito/editions"
import { getMmActiveEdition } from "@/lib/data/mid-master"
import { EditionCard } from "@/components/circuito/EditionCard"

export const metadata: Metadata = {
  title: "Circuito del Parque | Parque Tenis Club",
  description: "Torneos mensuales por categoría, ranking anual y Final Master del Circuito del Parque.",
}

export default async function CircuitoDelParquePage() {
  const editions = await getCircuitoEditions()
  const midMaster = await getMmActiveEdition()

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wider text-brand">Circuito del Parque</p>
      <h1 className="mt-1 font-heading text-3xl font-bold text-foreground">Torneos mensuales</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        Cada mes se juega un torneo por categoría. Los puntos que se suman en cada uno acumulan al
        ranking anual — los 8 mejores de cada categoría clasifican a la Final Master.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/circuito-del-parque/ranking"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-brand/40"
        >
          <Award className="size-4" />
          Ranking anual
        </Link>
        <Link
          href="/circuito-del-parque/final-master"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-brand/40"
        >
          <Trophy className="size-4" />
          Final Master
        </Link>
        {midMaster && (
          <Link
            href={`/circuito-del-parque/especiales/${midMaster.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-brand/40"
          >
            {midMaster.name}
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      <div className="mt-8 space-y-3">
        {editions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay torneos mensuales cargados.</p>
        ) : (
          editions.map((e) => (
            <EditionCard key={e.id} slug={e.slug} name={e.name} month={e.month} year={e.year} status={e.status} />
          ))
        )}
      </div>
    </main>
  )
}
