"use client"

import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type ReglamentoSection = { id: string; title: string }

// Índice lateral con scroll-spy (IntersectionObserver): marca la sección
// visible con aria-current, y trae el botón de descarga del PDF al lado del
// índice en vez de dejarlo al final del contenido.
export function ReglamentoNav({ sections }: { sections: ReglamentoSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b))
        setActiveId(topMost.target.id)
      },
      { rootMargin: "-112px 0px -65% 0px", threshold: 0 },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [sections])

  return (
    <>
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">En esta página</p>
      <ol className="flex gap-1 overflow-x-auto pb-2 lg:block lg:space-y-1">
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={activeId === section.id ? "true" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-md px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary",
                activeId === section.id ? "bg-secondary text-foreground" : "text-foreground hover:bg-secondary",
              )}
            >
              <span className="tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </a>
          </li>
        ))}
      </ol>
      <a
        href="/REGLAMENTO%20LIGA%20DE%20VERANO_INVIERNO.docx.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <FileText aria-hidden="true" className="size-4" /> Reglamento completo en PDF
        <span className="sr-only">(abre en una pestaña nueva)</span>
      </a>
    </>
  )
}
