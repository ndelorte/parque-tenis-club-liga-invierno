import type { Metadata } from "next"
import { getAnnualCircuitRanking } from "@/lib/data/circuito/ranking"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/data/circuito/categories"
import { RankingTable } from "@/components/circuito/RankingTable"
import { CategoryFilterPills } from "@/components/circuito/CategoryFilterPills"

export const metadata: Metadata = { title: "Ranking | Circuito del Parque" }

export default async function CircuitoRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const selected = CIRCUITO_FIXED_CATEGORIES.some((c) => c.slug === categoria)
    ? categoria!
    : CIRCUITO_FIXED_CATEGORIES[0].slug
  const year = new Date().getFullYear()
  const entries = await getAnnualCircuitRanking(year, selected)

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wider text-brand">Circuito del Parque</p>
      <h1 className="mt-1 mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">
        Ranking {year}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Suma los puntos de todos los torneos mensuales jugados en el año, por categoría. Mid
        Master y Final Master no puntúan acá.
      </p>

      <div className="mb-4">
        <CategoryFilterPills basePath="/circuito-del-parque/ranking" selectedSlug={selected} />
      </div>

      <RankingTable entries={entries} highlightTop={8} />
    </main>
  )
}
