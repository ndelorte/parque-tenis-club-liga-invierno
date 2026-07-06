import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { MmCategory } from "@/lib/mid-master/types"
import { MmReveal } from "./MmReveal"

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
          <CategoryGroup label="Singles" categories={singles} baseDelay={0} />
        )}
        {doubles.length > 0 && (
          <CategoryGroup label="Dobles" categories={doubles} className="mt-12" baseDelay={singles.length} />
        )}
      </div>
    </section>
  )
}

function CategoryGroup({
  label,
  categories,
  className,
  baseDelay,
}: {
  label: string
  categories: MmCategory[]
  className?: string
  baseDelay: number
}) {
  return (
    <div className={className}>
      <MmReveal>
        <p className="mb-5 text-[10px] font-medium uppercase tracking-[0.22em] text-mm-text-faint">
          {label}
        </p>
      </MmReveal>
      <div className="grid gap-3 sm:grid-cols-2">
        {categories.map((cat, i) => (
          <MmReveal key={cat.id} delay={(baseDelay + i) * 80}>
            <CategoryCard category={cat} />
          </MmReveal>
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
      className="group relative flex flex-col overflow-hidden border border-mm-border bg-mm-surface px-6 py-6 transition-colors hover:border-mm-gold/40 hover:bg-mm-surface-2"
    >
      {/* Gold gradient top border */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-mm-gold via-mm-gold/50 to-transparent opacity-50 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-mm-text-faint">
          {category.type === "singles" ? "Singles" : "Dobles"}
        </p>
        <p className="mt-2 text-lg font-semibold text-mm-text">{category.name}</p>
        <p className="mt-1.5 text-xs text-mm-text-muted">{formatLabel}</p>
      </div>

      <div className="mt-6 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-mm-text-faint transition-colors group-hover:text-mm-gold">
        Ver zona
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
