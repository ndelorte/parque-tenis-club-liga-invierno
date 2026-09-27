import type { Metadata } from "next"
import { getAnnualCircuitRanking, getCircuitoCategorySlugsWithRanking } from "@/lib/data/circuito/ranking"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/data/circuito/categories"
import { RankingByTournamentTable } from "@/components/circuito/RankingByTournamentTable"
import { CategoryFilterPills } from "@/components/circuito/CategoryFilterPills"

export const metadata: Metadata = { title: "Ranking | Circuito del Parque" }

export default async function CircuitoRankingPage({
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
  const ranking = selected ? await getAnnualCircuitRanking(year, selected) : null

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wider text-brand">Circuito del Parque</p>
      <h1 className="mt-1 mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">
        Ranking {year}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Suma los puntos de todos los torneos mensuales jugados en el año, por categoría. Mid
        Master y Final Master no puntúan acá.
      </p>

      {selected ? (
        <>
          <div className="mb-4">
            <CategoryFilterPills
              basePath="/circuito-del-parque/ranking"
              selectedSlug={selected}
              categories={categories}
            />
          </div>

          {ranking && <RankingByTournamentTable ranking={ranking} highlightTop={8} />}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Todavía no hay puntos cargados en el ranking {year}.</p>
      )}
    </main>
  )
}
