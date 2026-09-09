import Link from "next/link"
import { ArrowRight, Swords } from "lucide-react"

const HIGHLIGHTS = [
  "Single, mejor de 3 sets",
  "Domingos de septiembre a octubre",
  "Bonus por partido ganado",
  "Tabla de posiciones en vivo",
]

export function InterparquePromo() {
  return (
    <section className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              <Swords className="size-3.5" />
              Interparque
            </span>
            <h2 className="mt-5 text-balance font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Sumá puntos, game a game
            </h2>
            <p className="mt-4 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
              La modalidad de single exclusiva para alumnos del club. Jugás
              contra rivales de tu nivel, cada game suma y podés seguir la
              tabla de posiciones semana a semana.
            </p>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {HIGHLIGHTS.map((h) => (
                <li
                  key={h}
                  className="flex items-center gap-2 font-medium text-foreground"
                >
                  <span className="size-1.5 rounded-full bg-brand" />
                  {h}
                </li>
              ))}
            </ul>

            <Link
              href="/interparque"
              className="mt-9 inline-flex h-13 items-center gap-2 rounded-lg bg-brand px-7 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Ver Interparque
              <ArrowRight className="size-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-px border border-border lg:w-96">
            {INFO.map((item) => (
              <div key={item.label} className="bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const INFO = [
  { label: "Formato", value: "Single, mejor de 3 sets" },
  { label: "Frecuencia", value: "Todos los domingos" },
  { label: "Puntaje", value: "1 punto por game" },
  { label: "Bonus", value: "+3 pts al ganador" },
]
