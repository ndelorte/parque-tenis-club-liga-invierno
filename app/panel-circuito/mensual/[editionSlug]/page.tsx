import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { getCircuitoEditionBySlug } from "@/lib/data/circuito/editions"
import { getCircuitoCategoriesForEdition } from "@/lib/data/circuito/categories"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"

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
    <AdminShell
      panel="circuito"
      context="Mid Master y torneos mensuales"
      currentSection="mensual"
      publicHref={`/circuito-del-parque/torneos/${editionSlug}`}
    >
      <AdminPageHeader
        crumbs={[{ label: "Circuito mensual", href: "/panel-circuito/mensual" }, { label: edition.name }]}
        title={edition.name}
        lede="Elegí una categoría para inscribir participantes y cargar resultados."
      />

      <CategoryGroup title="Single" categories={singles} editionSlug={editionSlug} />
      <CategoryGroup title="Dobles" categories={dobles} editionSlug={editionSlug} />
    </AdminShell>
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
    <section className="mb-8">
      <h2 className="mb-2 mt-[22px] font-heading text-xl font-bold uppercase">{title}</h2>
      <ul role="list" className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        {categories.map((cat) => (
          <li key={cat.id}>
            <Link
              href={`/panel-circuito/mensual/${editionSlug}/${cat.slug}`}
              className="press group flex min-h-14 items-center justify-between gap-3 bg-card px-4 py-2.5 text-foreground transition-colors hover:bg-surface focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-accent"
            >
              <span className="grid min-w-0">
                <span className="truncate font-bold">{cat.name}</span>
                <span className="text-sm text-muted-foreground">
                  {cat.draw_size ? `Cuadro generado · ${cat.draw_size} inscriptos` : "Sin cuadro todavía"}
                </span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
