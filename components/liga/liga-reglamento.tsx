import { FileText } from "lucide-react"

const RULES = [
  "El torneo es por equipos en modalidad dobles.",
  "Cada serie enfrenta a dos equipos y se juega en 3 canchas.",
  "Gana la serie el equipo que se impone en 2 de las 3 canchas.",
  "Se otorgan 2 puntos por serie ganada y 1 punto por serie perdida.",
  "Los desempates siguen puntos, diferencia de canchas, sets y games; si persiste el empate se arma una mini-tabla solo con los equipos empatados.",
  "El WO de cancha es siempre la cancha 3: se juegan las canchas 1 y 2 y la 3 queda 6-0 6-0 para el rival. Si se avisa con menos de 24 hs, el equipo abona la fecha completa.",
  "Inscripción por equipo: $150.000. Cada fecha jugada: $110.000, a pagar el día del partido antes de comenzar.",
  "Liga de Verano 26/27: sorteo el 2 de diciembre de 2026; se juega del 9 de diciembre de 2026 al 14 de marzo de 2027.",
]

export function LigaReglamento() {
  return (
    <section
      id="reglamento"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-24"
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
