import Image from "next/image"
import Link from "next/link"

// Líneas de una cancha vista desde arriba; la red es vertical en el centro.
function CourtLines({ netClassName = "stroke-board" }: { netClassName?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 400 150" preserveAspectRatio="none" className="absolute inset-0 size-full">
      <g className="stroke-court-line" fill="none" strokeWidth="2">
        <rect x="30" y="18" width="340" height="114" />
        <line x1="30" y1="32" x2="370" y2="32" />
        <line x1="30" y1="118" x2="370" y2="118" />
        <line x1="110" y1="32" x2="110" y2="118" />
        <line x1="290" y1="32" x2="290" y2="118" />
        <line x1="110" y1="75" x2="290" y2="75" />
        <line x1="200" y1="8" x2="200" y2="142" className={netClassName} strokeWidth="3" />
      </g>
    </svg>
  )
}

type Competition = {
  title: string
  description: string
  href: string
  linkLabel: string
  court: React.ReactNode
}

const COMPETITIONS: Competition[] = [
  {
    title: "Liga Invierno/Verano",
    description: "Por equipos de dobles, con partidos semanales y categorías para todos los niveles.",
    href: "/ligas-invierno-verano",
    linkLabel: "Ver tablas y fixture",
    // Invierno y verano a cada lado de la red, como rivales.
    court: (
      <div className="relative grid h-full grid-cols-2 place-items-center bg-[linear-gradient(90deg,var(--court-winter)_50%,var(--court-summer)_50%)]">
        <CourtLines />
        <Image src="/images/logoligadeinvierno.png" alt="Liga de Invierno" width={80} height={80} className="relative size-20" />
        <Image src="/images/logoligaverano.png" alt="Liga de Verano" width={80} height={80} className="relative size-20" />
      </div>
    ),
  },
  {
    title: "Circuito del Parque",
    description: "Un torneo por categoría cada mes. Los puntos suman al ranking anual y los 8 mejores juegan la Final Master.",
    href: "/circuito-del-parque",
    linkLabel: "Ver cuadros y ranking",
    court: (
      <div className="relative grid h-full place-items-center bg-clay">
        <CourtLines netClassName="stroke-court-net" />
        <span className="relative grid size-24 place-items-center rounded-md border-2 border-court-net bg-white">
          <Image src="/images/logopngcdp.png" alt="Circuito del Parque" width={84} height={84} className="size-[84px]" />
        </span>
      </div>
    ),
  },
  {
    title: "Interparque",
    description: "Single para alumnos del club. Jugás contra rivales de tu nivel y cada game suma en la tabla.",
    href: "/interparque",
    linkLabel: "Ver la tabla",
    court: (
      <div className="relative grid h-full place-items-center bg-court-green">
        <CourtLines netClassName="stroke-court-line" />
        <span
          aria-hidden="true"
          className="relative grid size-24 place-items-center rounded-full border-[3px] border-ball bg-court-green font-heading text-[38px] font-extrabold text-ball"
        >
          IP
        </span>
      </div>
    ),
  },
]

export function Competitions() {
  return (
    <section id="competencias" className="scroll-mt-20 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <h2 className="font-heading text-[clamp(2.75rem,6vw,4.75rem)] font-extrabold uppercase leading-[0.9]">
            Competí todo el año
          </h2>
          <p className="max-w-md text-[17px] leading-relaxed text-muted-foreground">
            Tres formatos propios del club. La tabla, los cuadros y el ranking se actualizan después de cada fecha.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {COMPETITIONS.map((c) => (
            <article
              key={c.href}
              className="flex flex-col overflow-hidden rounded-md border-2 border-board bg-card text-card-foreground dark:border-border"
            >
              <div className="h-[150px] border-b-2 border-board dark:border-border">{c.court}</div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <h3 className="font-heading text-[34px] font-extrabold uppercase leading-none">{c.title}</h3>
                <p className="leading-relaxed text-muted-foreground">{c.description}</p>
                <Link
                  href={c.href}
                  className="mt-auto self-start rounded-sm pt-2 font-semibold text-accent underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {c.linkLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
