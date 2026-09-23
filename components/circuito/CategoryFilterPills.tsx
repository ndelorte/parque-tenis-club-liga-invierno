"use client"

import { useRouter } from "next/navigation"
import { CIRCUITO_FIXED_CATEGORIES } from "@/lib/circuito/fixedCategories"

interface Props {
  basePath: string
  selectedSlug: string
  className?: string
}

// Cambia el filtro sin saltar al principio de la página (scroll: false) ni
// perder el historial — volver atrás con el navegador va desfiltrando en el
// mismo orden en que se fue filtrando.
export function CategoryFilterPills({ basePath, selectedSlug, className }: Props) {
  const router = useRouter()

  return (
    <div className={`flex flex-wrap gap-1.5 ${className ?? ""}`}>
      {CIRCUITO_FIXED_CATEGORIES.map((c) => (
        <button
          key={c.slug}
          type="button"
          onClick={() => router.push(`${basePath}?categoria=${c.slug}`, { scroll: false })}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            selectedSlug === c.slug
              ? "border-brand bg-brand-light/40 text-brand"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {c.name} {c.type === "dobles" ? "(dobles)" : ""}
        </button>
      ))}
    </div>
  )
}
