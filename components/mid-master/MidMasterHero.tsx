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
      {/* Court lines decoration */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="white" strokeWidth="1.2" opacity="0.04">
          {/* Outer court */}
          <rect x="80" y="60" width="640" height="480" />
          {/* Singles sidelines */}
          <line x1="160" y1="60" x2="160" y2="540" />
          <line x1="640" y1="60" x2="640" y2="540" />
          {/* Center net line */}
          <line x1="80" y1="300" x2="720" y2="300" />
          {/* Service lines */}
          <line x1="160" y1="180" x2="640" y2="180" />
          <line x1="160" y1="420" x2="640" y2="420" />
          {/* Center service line top half */}
          <line x1="400" y1="180" x2="400" y2="300" />
          {/* Center service line bottom half */}
          <line x1="400" y1="300" x2="400" y2="420" />
          {/* Center marks on baselines */}
          <line x1="396" y1="60" x2="404" y2="60" />
          <line x1="396" y1="540" x2="404" y2="540" />
        </g>
      </svg>

      <div className="relative mx-auto flex min-h-[88vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center sm:py-32">
        <div className="mm-fade-up mb-4" style={{ animationDelay: "0ms" }}>
          <Image
            src="/images/logopngcdp.png"
            alt="Circuito de Parque"
            width={400}
            height={400}
            className="size-64 object-contain sm:size-80"
            priority
          />
        </div>

        <p
          className="mm-fade-up mb-6 text-[11px] font-medium uppercase tracking-[0.22em] text-mm-text-muted"
          style={{ animationDelay: "150ms" }}
        >
          Parque Tenis Club · {year}
        </p>

        <h1
          className="mm-fade-up font-mm-display text-5xl font-bold text-mm-text sm:text-7xl"
          style={{ animationDelay: "300ms" }}
        >
          Mid Master
        </h1>

        <div
          className="mm-fade-up my-7 h-px w-24 bg-mm-gold opacity-60"
          style={{ animationDelay: "420ms" }}
        />

        <p
          className="mm-fade-up max-w-lg text-pretty text-base leading-relaxed text-mm-text-muted sm:text-lg"
          style={{ animationDelay: "520ms" }}
        >
          Torneo de mitad de temporada. Los mejores clasificados de cada
          categoría del circuito compiten por el título.
        </p>

        <Link
          href="#categorias"
          className="mm-fade-up mt-10 inline-flex items-center gap-2 border border-mm-gold/50 px-7 py-3 text-sm font-medium uppercase tracking-[0.12em] text-mm-gold transition-colors hover:border-mm-gold hover:bg-mm-gold/5"
          style={{ animationDelay: "660ms" }}
        >
          Ver categorías
          <ArrowDown className="size-4" />
        </Link>
      </div>
    </section>
  )
}
