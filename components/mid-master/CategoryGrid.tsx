import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { MmCategory } from "@/lib/mid-master/types"

interface Props {
  categories: MmCategory[]
}

export function CategoryGrid({ categories }: Props) {
  if (categories.length === 0) {
    return (
      <section className="bg-mm-bg px-4 pb-20 pt-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm text-mm-text-muted">
            Las categorías aún no fueron cargadas.
          </p>
        </div>
      </section>
    )
  }

  const singles = categories.filter((c) => c.type === "singles")
  const doubles = categories.filter((c) => c.type === "doubles")

  return (
    <section id="categorias" className="bg-mm-bg px-4 pb-20 pt-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {singles.length > 0 && (
          <CategoryGroup label="Singles" categories={singles} />
        )}
        {doubles.length > 0 && (
          <CategoryGroup label="Dobles" categories={doubles} className="mt-12" />
        )}
      </div>
    </section>
  )
}

function CategoryGroup({
  label,
  categories,
  className,
}: {
  label: string
  categories: MmCategory[]
  className?: string
}) {
  return (
    <div className={className}>
      <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.22em] text-mm-text-faint">
        {label}
      </p>
      <div className="grid gap-px border border-mm-border sm:grid-cols-2">
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </div>
  )
}

function CategoryCard({ category }: { category: MmCategory }) {
  const formatLabel =
    category.zoneSize === 3
      ? "2 zonas de 3 · Semifinal · Final"
      : "2 zonas de 4 · Semifinal · Final"

  return (
    <Link
      href={`/mid-master/categorias/${category.slug}`}
      className="group flex items-center justify-between border-l-2 border-l-mm-gold/40 bg-mm-surface px-5 py-5 transition-colors hover:border-l-mm-gold hover:bg-mm-surface-2"
    >
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-mm-text-faint">
          {category.type === "singles" ? "Singles" : "Dobles"}
        </p>
        <p className="mt-0.5 text-sm font-medium text-mm-text">{category.name}</p>
        <p className="mt-1 text-xs text-mm-text-muted">{formatLabel}</p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-mm-text-faint transition-colors group-hover:text-mm-gold" />
    </Link>
  )
}
