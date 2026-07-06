import Link from "next/link"
import { ArrowRight, Star } from "lucide-react"

export function MidMasterPromo() {
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
              <Star className="size-3.5" />
              Torneo especial
            </span>
            <h2 className="mt-4 font-mm-display text-3xl font-bold text-mm-text sm:text-4xl lg:text-5xl">
              Mid Master 2026
            </h2>
            <div className="my-5 h-px w-16 bg-mm-gold opacity-50" />
            <p className="max-w-md text-pretty text-base leading-relaxed text-mm-text-muted">
              Los mejores clasificados de cada categoría se enfrentan en un
              torneo de zonas con semifinales y final. Formato individual,
              estilo grand slam.
            </p>
            <Link
              href="/mid-master"
              className="mt-8 inline-flex items-center gap-2 border border-mm-gold/50 px-7 py-3 text-sm font-medium uppercase tracking-[0.1em] text-mm-gold transition-colors hover:border-mm-gold hover:bg-mm-gold/5"
            >
              Ver torneo
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {/* Right: categories summary */}
          <div className="grid grid-cols-2 gap-px border border-mm-border lg:w-96">
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="border-l-2 border-l-mm-gold/30 bg-mm-surface px-4 py-3"
              >
                <p className="text-xs text-mm-text-muted">{cat}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const CATEGORIES = [
  "Single Cab. Primera",
  "Single Cab. Intermedia",
  "Single Cab. Segunda",
  "Single Cab. Tercera",
  "Single Cab. +50",
  "Single Damas Segunda",
  "Doble Cab. Segunda",
  "Doble Mixto Segunda",
]
