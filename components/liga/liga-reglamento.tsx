import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

const RULES = [
  "El torneo es por equipos en modalidad dobles.",
  "Cada serie enfrenta a dos equipos y se juega en 3 canchas.",
  "Gana la serie el equipo que se impone en 2 de las 3 canchas.",
  "Se otorgan 2 puntos por serie ganada y 1 punto por serie perdida.",
  "En caso de igualdad de puntos, se define por diferencia de canchas.",
]

export function LigaReglamento() {
  return (
    <section
      id="reglamento"
      className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6 sm:pb-24"
    >
      <div className="rounded-3xl bg-secondary/60 p-6 ring-1 ring-border sm:p-10">
        <div className="flex items-center gap-2 text-primary">
          <FileText className="size-5" />
          <h2 className="font-heading text-xl font-bold">Reglamento</h2>
        </div>
        <ul className="mt-5 space-y-3">
          {RULES.map((r, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {i + 1}
              </span>
              {r}
            </li>
          ))}
        </ul>
        <Button
          asChild
          size="lg"
          className="mt-7 h-12 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <a
            href="/REGLAMENTO%20LIGA%20DE%20VERANO_INVIERNO.docx.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileText className="size-5" />
            Reglamento completo
          </a>
        </Button>
      </div>
    </section>
  )
}
