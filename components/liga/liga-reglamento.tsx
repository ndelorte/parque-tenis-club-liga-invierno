import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const RULES = [
  "El torneo es por equipos en modalidad dobles.",
  "Cada serie enfrenta a dos equipos y se juega en 3 canchas.",
  "Se otorgan 2 puntos por serie ganada y 1 punto por serie perdida.",
  "Liga de Verano 26/27: sorteo el 2 de diciembre de 2026; se juega del 9 de diciembre de 2026 al 28 de febrero de 2027.",
  "Días y horarios de juego: lunes a viernes a las 21 hs; martes, jueves y viernes también a las 19:30 hs; sábados a las 14, 16 y 18 hs; domingos a las 9, 10:30, 15, 16:30 y 18 hs.",
]

// `className` ajusta el espaciado según dónde va: en la etapa de inscripción
// el resumen va arriba del formulario (padding arriba, no abajo).
export function LigaReglamento({ className = "pb-16 sm:pb-24" }: { className?: string }) {
  return (
    <section
      id="reglamento"
      className={cn("mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6", className)}
    >
      <div className="rounded-md border border-border border-t-4 border-t-accent bg-card p-6 sm:p-10">
        <div className="flex items-center gap-2 text-accent">
          <FileText aria-hidden="true" className="size-5" />
          <h2 className="font-heading text-xl font-bold text-foreground">Reglamento</h2>
        </div>
        <ul className="mt-5 space-y-3">
          {RULES.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold tabular-nums text-accent-foreground">
                {i + 1}
              </span>
              {r}
            </li>
          ))}
        </ul>
        <a
          href="/reglamento-liga.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-md bg-accent px-5 font-semibold text-accent-foreground hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <FileText aria-hidden="true" className="size-5" />
          Reglamento completo
          <span className="sr-only">(abre en una pestaña nueva)</span>
        </a>
      </div>
    </section>
  )
}
