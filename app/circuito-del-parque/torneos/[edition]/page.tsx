import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getCircuitoEditionBySlug } from "@/lib/data/circuito/editions"
import { getCircuitoCategoriesForEdition } from "@/lib/data/circuito/categories"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ edition: string }>
}): Promise<Metadata> {
  const { edition } = await params
  const ed = await getCircuitoEditionBySlug(edition)
  return { title: ed ? `${ed.name} | Circuito del Parque` : "Circuito del Parque" }
}

export default async function CircuitoTorneoPage({
  params,
}: {
  params: Promise<{ edition: string }>
}) {
  const { edition: editionSlug } = await params
  const edition = await getCircuitoEditionBySlug(editionSlug)
  if (!edition) notFound()

  const categories = await getCircuitoCategoriesForEdition(edition.id)
  const singles = categories.filter((c) => c.type === "single")
  const dobles = categories.filter((c) => c.type === "dobles")

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/circuito-del-parque" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Circuito del Parque
      </Link>

      <h1 className="mb-6 font-heading text-2xl font-bold text-foreground sm:text-3xl">{edition.name}</h1>

      <CategoryGroup title="Single" categories={singles} editionSlug={editionSlug} />
      <CategoryGroup title="Dobles" categories={dobles} editionSlug={editionSlug} />
    </main>
  )
}

function CategoryGroup({
  title,
  categories,
  editionSlug,
}: {
  title: string
  categories: Array<{ id: string; name: string; slug: string; draw_size: number | null }>
  editionSlug: string
}) {
  if (categories.length === 0) return null
  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-px overflow-hidden rounded-lg border border-border">
        {categories.map((cat) =>
          cat.draw_size ? (
            <Link
              key={cat.id}
              href={`/circuito-del-parque/torneos/${editionSlug}/${cat.slug}`}
              className="group flex items-center justify-between bg-card px-4 py-3 transition-colors hover:bg-muted"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.draw_size} inscriptos</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Link>
          ) : (
            <div key={cat.id} className="flex items-center justify-between bg-card px-4 py-3 opacity-60">
              <p className="text-sm text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">No se juega este mes</p>
            </div>
          ),
        )}
      </div>
    </div>
  )
}
