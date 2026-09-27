"use client"

import { useRouter } from "next/navigation"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/circuito/fixedCategories"

interface Props {
  basePath: string
  selectedSlug: string
  // Categorías a mostrar (por defecto, las 14 fijas). El ranking y la Final
  // Master pasan solo las que tienen jugadores con puntos en el año.
  categories?: typeof CIRCUITO_FIXED_CATEGORIES
  className?: string
}

// Filtro de categoría agrupado en dos filas, "Single" y "Dobles" — ver
// product/refactor-visual/maquetas/fase-2/Ranking.dc.html. Cambia el filtro
// sin saltar al principio de la página (scroll: false) ni perder el
// historial — volver atrás con el navegador va desfiltrando en el mismo
// orden en que se fue filtrando.
export function CategoryFilterPills({ basePath, selectedSlug, categories = CIRCUITO_FIXED_CATEGORIES, className }: Props) {
  const router = useRouter()

  const singles = categories.filter((c) => c.type === "single")
  const dobles = categories.filter((c) => c.type === "dobles")

  return (
    <nav aria-label="Categoría" className={`flex flex-col gap-2.5 ${className ?? ""}`}>
      <CategoryRow label="Single" items={singles} selectedSlug={selectedSlug} onSelect={(slug) => router.push(`${basePath}?categoria=${slug}`, { scroll: false })} />
      <CategoryRow label="Dobles" items={dobles} selectedSlug={selectedSlug} onSelect={(slug) => router.push(`${basePath}?categoria=${slug}`, { scroll: false })} />
    </nav>
  )
}

function CategoryRow({
  label,
  items,
  selectedSlug,
  onSelect,
}: {
  label: string
  items: typeof CIRCUITO_FIXED_CATEGORIES
  selectedSlug: string
  onSelect: (slug: string) => void
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 text-sm font-semibold text-muted-foreground">{label}</span>
      {items.map((c) => {
        const current = selectedSlug === c.slug
        return (
          <button
            key={c.slug}
            type="button"
            aria-current={current ? "page" : undefined}
            onClick={() => onSelect(c.slug)}
            className="press inline-flex min-h-11 items-center whitespace-nowrap rounded border-[1.5px] border-input px-3.5 text-sm font-semibold text-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-[current=page]:border-court-net aria-[current=page]:bg-court-net aria-[current=page]:text-board-foreground"
          >
            {c.name}
          </button>
        )
      })}
    </div>
  )
}
