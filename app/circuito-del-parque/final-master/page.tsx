import type { Metadata } from "next"
import { Hourglass } from "lucide-react"
import { getAnnualCircuitRanking, getCircuitoCategorySlugsWithRanking } from "@/lib/data/circuito/ranking"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/data/circuito/categories"
import { RankingTable } from "@/components/circuito/RankingTable"
import { CategoryFilterPills } from "@/components/circuito/CategoryFilterPills"

export const metadata: Metadata = { title: "Final Master | Circuito del Parque" }

// Clasifican los 8 mejores del ranking anual por categoría — reglas-circuito-del-parque.md.
const QUALIFIERS = 8

export default async function CircuitoFinalMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const year = new Date().getFullYear()
  // Solo las categorías con jugadores en el ranking del año; si la pedida
  // no tiene, se muestra la primera que sí.
  const rankedSlugs = await getCircuitoCategorySlugsWithRanking(year)
  const categories = CIRCUITO_FIXED_CATEGORIES.filter((c) => rankedSlugs.has(c.slug))
  const selected = categories.some((c) => c.slug === categoria) ? categoria! : categories[0]?.slug
  const entries = selected ? (await getAnnualCircuitRanking(year, selected)).slice(0, QUALIFIERS) : []

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-center sm:px-6">
      <Hourglass
        aria-hidden="true"
        className="mx-auto size-10 text-brand animate-hourglass motion-reduce:animate-none"
      />
      <p className="mt-6 text-xs font-medium uppercase tracking-wider text-brand">Circuito del Parque</p>
      <h1 className="mt-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">Final Master</h1>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        Próximamente. Clasifican los {QUALIFIERS} mejores del ranking anual de cada categoría — así
        va la clasificación provisoria hasta ahora.
      </p>

      {selected ? (
        <>
          <CategoryFilterPills
            basePath="/circuito-del-parque/final-master"
            selectedSlug={selected}
            categories={categories}
            className="mt-6 justify-center"
          />

          <div className="mt-6 text-left">
            <RankingTable entries={entries} />
          </div>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Todavía no hay puntos cargados en el ranking {year}.</p>
      )}
    </main>
  )
}
