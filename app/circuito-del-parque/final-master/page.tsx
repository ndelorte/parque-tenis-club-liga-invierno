import type { Metadata } from "next"
import Link from "next/link"
import { Hourglass } from "lucide-react"
import { getAnnualCircuitRanking } from "@/lib/data/circuito/ranking"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/data/circuito/categories"
import { RankingTable } from "@/components/circuito/RankingTable"

export const metadata: Metadata = { title: "Final Master | Circuito del Parque" }

// Clasifican los 8 mejores del ranking anual por categoría — reglas-circuito-del-parque.md.
const QUALIFIERS = 8

export default async function CircuitoFinalMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const selected = categoria ?? CIRCUITO_FIXED_CATEGORIES[0].slug
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

      <div className="mt-6 flex flex-wrap justify-center gap-1.5">
        {CIRCUITO_FIXED_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/circuito-del-parque/final-master?categoria=${c.slug}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              selected === c.slug ? "border-brand bg-brand-light/40 text-brand" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.name} {c.type === "dobles" ? "(dobles)" : ""}
          </Link>
        ))}
      </div>

      <div className="mt-6 text-left">
        <RankingTable entries={entries} />
      </div>
    </main>
  )
}
