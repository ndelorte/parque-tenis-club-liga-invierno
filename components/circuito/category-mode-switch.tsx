"use client"

import { useState } from "react"
import { CategoryRow, type CategoryListItem } from "./category-list"

interface Props {
  single: CategoryListItem[]
  dobles: CategoryListItem[]
  editionSlug: string
}

// Selector Single | Dobles del celular (product/refactor-visual/maquetas/fase-2/MovilEdicion.dc.html).
// Cambia al instante, sin animación de entrada.
export function CategoryModeSwitch({ single, dobles, editionSlug }: Props) {
  const [mode, setMode] = useState<"single" | "dobles">(single.length > 0 ? "single" : "dobles")
  const items = mode === "single" ? single : dobles

  return (
    <div>
      <div role="group" aria-label="Modalidad" className="flex gap-1 rounded-md border-[1.5px] border-draw-line p-1">
        <button
          type="button"
          aria-pressed={mode === "single"}
          onClick={() => setMode("single")}
          className="press flex min-h-12 flex-1 items-center justify-center gap-2 rounded text-base font-semibold text-muted-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-court-net aria-pressed:text-board-foreground"
        >
          Single
          <span className="text-[13px] opacity-80">{single.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={mode === "dobles"}
          onClick={() => setMode("dobles")}
          className="press flex min-h-12 flex-1 items-center justify-center gap-2 rounded text-base font-semibold text-muted-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-court-net aria-pressed:text-board-foreground"
        >
          Dobles
          <span className="text-[13px] opacity-80">{dobles.length}</span>
        </button>
      </div>

      <ul className="m-0 mt-2 list-none p-0">
        {items.map((item) => (
          <CategoryRow key={item.slug} item={item} editionSlug={editionSlug} />
        ))}
      </ul>
    </div>
  )
}
