import type { Metadata } from "next"
import { Hourglass } from "lucide-react"
import { getAnnualCircuitRanking } from "@/lib/data/circuito/ranking"
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
  const selected = CIRCUITO_FIXED_CATEGORIES.some((c) => c.slug === categoria)
    ? categoria!
    : CIRCUITO_FIXED_CATEGORIES[0].slug
  const year = new Date().getFullYear()
  const entries = (await getAnnualCircuitRanking(year, selected)).slice(0, QUALIFIERS)

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

      <CategoryFilterPills
        basePath="/circuito-del-parque/final-master"
        selectedSlug={selected}
        className="mt-6 justify-center"
      />

      <div className="mt-6 text-left">
        <RankingTable entries={entries} />
      </div>
    </main>
  )
}
