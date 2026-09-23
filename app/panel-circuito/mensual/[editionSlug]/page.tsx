import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { getCircuitoEditionBySlug } from "@/lib/data/circuito/editions"
import { getCircuitoCategoriesForEdition } from "@/lib/data/circuito/categories"

export const metadata: Metadata = { title: "Edición | Panel Circuito del Parque" }
export const dynamic = "force-dynamic"

export default async function CircuitoEditionPage({
  params,
}: {
  params: Promise<{ editionSlug: string }>
}) {
  const { editionSlug } = await params
  const edition = await getCircuitoEditionBySlug(editionSlug)
  if (!edition) notFound()

  const categories = await getCircuitoCategoriesForEdition(edition.id)
  const singles = categories.filter((c) => c.type === "single")
  const dobles = categories.filter((c) => c.type === "dobles")

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link href="/panel-circuito/mensual" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Circuito mensual
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-foreground">{edition.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Elegí una categoría para inscribir participantes y cargar resultados.</p>

      <CategoryGroup title="Single" categories={singles} editionSlug={editionSlug} />
      <CategoryGroup title="Dobles" categories={dobles} editionSlug={editionSlug} />
    </div>
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
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/panel-circuito/mensual/${editionSlug}/${cat.slug}`}
            className="group flex items-center justify-between bg-card px-4 py-3 transition-colors hover:bg-muted"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{cat.name}</p>
              <p className="text-xs text-muted-foreground">
                {cat.draw_size ? `Cuadro generado · ${cat.draw_size} inscriptos` : "Sin cuadro todavía"}
              </p>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
