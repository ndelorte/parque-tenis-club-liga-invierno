"use client"

import { useRouter } from "next/navigation"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/circuito/fixedCategories"
import { cn } from "@/lib/utils"

interface Props {
  basePath: string
  selectedSlug: string
  // Categorías a mostrar (por defecto, las 14 fijas). El ranking y la Final
  // Master pasan solo las que tienen jugadores con puntos en el año.
  categories?: typeof CIRCUITO_FIXED_CATEGORIES
  className?: string
  // "especiales": piel dorado/negro de Final Master (identidad Especiales,
  // ver components/mid-master/). Reusa este mismo componente en vez de
  // duplicarlo — Final Master no tiene su propio selector de categoría.
  variant?: "circuito" | "especiales"
}

// Filtro de categoría agrupado en dos filas, "Single" y "Dobles" — ver
// product/refactor-visual/maquetas/fase-2/Ranking.dc.html. Cambia el filtro
// sin saltar al principio de la página (scroll: false) ni perder el
// historial — volver atrás con el navegador va desfiltrando en el mismo
// orden en que se fue filtrando.
export function CategoryFilterPills({
  basePath,
  selectedSlug,
  categories = CIRCUITO_FIXED_CATEGORIES,
  className,
  variant = "circuito",
}: Props) {
  const router = useRouter()

  const singles = categories.filter((c) => c.type === "single")
  const dobles = categories.filter((c) => c.type === "dobles")

  return (
    <nav aria-label="Categoría" className={`flex flex-col gap-2.5 ${className ?? ""}`}>
      <CategoryRow
        label="Single"
        items={singles}
        selectedSlug={selectedSlug}
        variant={variant}
        onSelect={(slug) => router.push(`${basePath}?categoria=${slug}`, { scroll: false })}
      />
      <CategoryRow
        label="Dobles"
        items={dobles}
        selectedSlug={selectedSlug}
        variant={variant}
        onSelect={(slug) => router.push(`${basePath}?categoria=${slug}`, { scroll: false })}
      />
    </nav>
  )
}

function CategoryRow({
  label,
  items,
  selectedSlug,
  variant,
  onSelect,
}: {
  label: string
  items: typeof CIRCUITO_FIXED_CATEGORIES
  selectedSlug: string
  variant: "circuito" | "especiales"
  onSelect: (slug: string) => void
}) {
  if (items.length === 0) return null
  const isEspeciales = variant === "especiales"
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn("w-16 shrink-0 text-sm font-semibold", isEspeciales ? "text-mm-text-muted" : "text-muted-foreground")}>
        {label}
      </span>
      {items.map((c) => {
        const current = selectedSlug === c.slug
        return (
          <button
            key={c.slug}
            type="button"
            aria-current={current ? "page" : undefined}
            onClick={() => onSelect(c.slug)}
            className={cn(
              "press inline-flex min-h-11 items-center whitespace-nowrap border-[1.5px] px-3.5 text-sm font-semibold focus-visible:outline-3 focus-visible:outline-offset-2",
              isEspeciales
                ? // border-mm-border-strong (no border-mm-border): el botón se apoya
                  // sobre bg-mm-bg, casi idéntico a --color-mm-border (contraste ~1.4:1);
                  // border-strong llega a ~3:1, mínimo para el borde de un control (WCAG 1.4.11).
                  "rounded-sm border-mm-border-strong text-mm-text focus-visible:outline-mm-gold-light aria-[current=page]:border-mm-gold aria-[current=page]:bg-mm-gold-wash aria-[current=page]:font-bold aria-[current=page]:text-mm-gold-light"
                : "rounded border-input text-foreground focus-visible:outline-ring aria-[current=page]:border-court-net aria-[current=page]:bg-court-net aria-[current=page]:text-board-foreground",
            )}
          >
            {c.name}
          </button>
        )
      })}
    </div>
  )
}
