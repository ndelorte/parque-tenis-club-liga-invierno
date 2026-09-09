import type { Metadata } from "next"
import Link from "next/link"
import { getAnnualCircuitRanking } from "@/lib/data/circuito/ranking"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/data/circuito/categories"
import { RankingTable } from "@/components/circuito/RankingTable"

export const metadata: Metadata = { title: "Ranking | Circuito del Parque" }

export default async function CircuitoRankingPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const year = new Date().getFullYear()
  const entries = await getAnnualCircuitRanking(year, categoria)

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-wider text-brand">Circuito del Parque</p>
      <h1 className="mt-1 mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">
        Ranking {year}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Suma los puntos de todos los torneos mensuales jugados en el año. Mid Master y Final
        Master no puntúan acá.
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href="/circuito-del-parque/ranking"
          className={`rounded-full border px-3 py-1 text-xs font-medium ${
            !categoria ? "border-brand bg-brand-light/40 text-brand" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          Todas
        </Link>
        {CIRCUITO_FIXED_CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/circuito-del-parque/ranking?categoria=${c.slug}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              categoria === c.slug ? "border-brand bg-brand-light/40 text-brand" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.name} {c.type === "dobles" ? "(dobles)" : ""}
          </Link>
        ))}
      </div>

      <RankingTable entries={entries} highlightTop={categoria ? 8 : undefined} />
    </main>
  )
}
