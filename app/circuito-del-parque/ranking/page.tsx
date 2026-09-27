import type { Metadata } from "next"
import { getAnnualCircuitRanking, getCircuitoCategorySlugsWithRanking } from "@/lib/data/circuito/ranking"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/data/circuito/categories"
import { RankingByTournamentTable } from "@/components/circuito/RankingByTournamentTable"
import { CategoryFilterPills } from "@/components/circuito/CategoryFilterPills"

export const metadata: Metadata = { title: "Ranking | Circuito del Parque" }

const QUALIFIERS = 8

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
  const selectedCategory = categories.find((c) => c.slug === selected)
  const ranking = selected ? await getAnnualCircuitRanking(year, selected) : null

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 pb-2 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <h1 className="font-heading text-6xl font-extrabold uppercase leading-[0.9] text-foreground sm:text-7xl">
          Ranking {year}
        </h1>
        <p className="max-w-md text-base text-muted-foreground lg:pb-1.5 lg:text-right">
          Suma de todos los torneos del año. Mid Master y Final Master no suman puntos.
        </p>
      </div>

      {selected ? (
        <>
          <div className="mt-7 mb-7">
            <CategoryFilterPills basePath="/circuito-del-parque/ranking" selectedSlug={selected} categories={categories} />
          </div>

          {ranking && (
            <RankingByTournamentTable
              ranking={ranking}
              categoryLabel={selectedCategory?.name ?? ""}
              highlightTop={QUALIFIERS}
            />
          )}
          <p className="mt-3.5 text-xs text-muted-foreground">
            Desempate: menos torneos jugados, después más torneos ganados.
          </p>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Todavía no hay puntos cargados en el ranking {year}.</p>
      )}
    </main>
  )
}
