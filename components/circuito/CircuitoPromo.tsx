import Link from "next/link"
import { ArrowRight, Calendar } from "lucide-react"

export function CircuitoPromo() {
  return (
    <section
      className="relative isolate overflow-hidden bg-mm-bg py-20 sm:py-28"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(201,168,76,0.06) 0%, transparent 70%)",
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: brand */}
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-mm-gold">
              <Calendar className="size-3.5" />
              Torneo individual
            </span>
            <h2 className="mt-4 font-mm-display text-3xl font-bold text-mm-text sm:text-4xl lg:text-5xl">
              Circuito del Parque
            </h2>
            <div className="my-5 h-px w-16 bg-mm-gold opacity-50" />
            <p className="max-w-md text-pretty text-base leading-relaxed text-mm-text-muted">
              Un torneo por categoría cada mes del año. Los puntos que sumás
              en cada uno se acumulan a un ranking anual — los 8 primeros de
              cada categoría llegan a la Final Master. A mitad de año se juega
              el Mid Master, el torneo especial del circuito.
            </p>
            <Link
              href="/circuito-del-parque"
              className="mt-8 inline-flex items-center gap-2 border border-mm-gold/50 px-7 py-3 text-sm font-medium uppercase tracking-[0.1em] text-mm-gold transition-colors hover:border-mm-gold hover:bg-mm-gold/5"
            >
              Ver el circuito
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Right: how it works */}
          <div className="grid grid-cols-2 gap-px border border-mm-border lg:w-96">
            {PILLARS.map((p) => (
              <div key={p.title} className="border-l-2 border-l-mm-gold/30 bg-mm-surface px-4 py-4">
                <p className="text-sm font-medium text-mm-text">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-mm-text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const PILLARS = [
  { title: "Torneos mensuales", body: "Un torneo por categoría, todos los meses." },
  { title: "Ranking anual", body: "Los puntos de cada torneo se acumulan." },
  { title: "Final Master", body: "Clasifican los 8 mejores de cada categoría." },
  { title: "Mid Master", body: "El torneo especial de mitad de año." },
]
