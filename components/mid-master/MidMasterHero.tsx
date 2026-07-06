import Image from "next/image"
import Link from "next/link"
import { ArrowDown } from "lucide-react"

interface Props {
  year?: number
}

export function MidMasterHero({ year = 2026 }: Props) {
  return (
    <section
      className="relative isolate overflow-hidden bg-mm-bg"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(201,168,76,0.07) 0%, transparent 70%), radial-gradient(ellipse 60% 60% at 0% 100%, rgba(26,46,31,0.5) 0%, transparent 70%)",
      }}
    >
      <div className="relative mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center sm:py-32">
        <div className="mb-8">
          <Image
            src="/images/logopngcdp.png"
            alt="Circuito de Parque"
            width={240}
            height={240}
            className="size-40 object-contain sm:size-56"
            priority
          />
        </div>

        <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.22em] text-mm-text-muted">
          Parque Tenis Club · {year}
        </p>

        <h1 className="font-mm-display text-5xl font-bold text-mm-text sm:text-7xl">
          Mid Master
        </h1>

        <div className="my-7 h-px w-24 bg-mm-gold opacity-60" />

        <p className="max-w-lg text-pretty text-base leading-relaxed text-mm-text-muted sm:text-lg">
          Torneo de mitad de temporada. Los mejores clasificados de cada
          categoría del circuito compiten por el título.
        </p>

        <Link
          href="#categorias"
          className="mt-10 inline-flex items-center gap-2 border border-mm-gold/50 px-7 py-3 text-sm font-medium uppercase tracking-[0.12em] text-mm-gold transition-colors hover:border-mm-gold hover:bg-mm-gold/5"
        >
          Ver categorías
          <ArrowDown className="size-4" />
        </Link>
      </div>
    </section>
  )
}
