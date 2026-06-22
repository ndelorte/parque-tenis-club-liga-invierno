import Image from "next/image"
import { Layers, Swords, Medal, FileText, Snowflake } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Snowfall } from "@/components/decorations/snowfall"

const FORMAT = [
  {
    icon: Layers,
    title: "Por equipos de dobles",
    text: "Cada equipo juega de a parejas a lo largo de toda la liga.",
  },
  {
    icon: Swords,
    title: "3 canchas por serie",
    text: "Cada serie enfrenta a dos equipos en simultáneo en 3 canchas.",
  },
  {
    icon: Medal,
    title: "Gana 2 de 3",
    text: "El equipo que gana 2 de las 3 canchas se lleva la serie.",
  },
]

export function LigaHeader() {
  return (
    <header className="relative isolate overflow-hidden bg-primary text-primary-foreground">
      <Snowfall />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-winter/30 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/images/logoligadeinvierno.png"
              alt="Logo Liga de Invierno"
              width={128}
              height={128}
              priority
              className="size-24 shrink-0 rounded-3xl object-contain shadow-lg ring-4 ring-primary-foreground/10 sm:size-32"
            />
            <div>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-winter-foreground">
                <Snowflake className="size-4 text-winter" />
                Temporada de invierno
              </p>
              <h1 className="text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Liga de Invierno 2026
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/70">
                Parque Tenis Club · ¡el frío no para el tenis!
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="secondary"
            size="lg"
            className="h-12 w-full rounded-2xl bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:w-auto"
          >
            <a href="#reglamento">
              <FileText className="size-5" />
              Ver reglamento
            </a>
          </Button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FORMAT.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl bg-primary-foreground/10 p-5 ring-1 ring-primary-foreground/15 transition-transform duration-300 hover:-translate-y-1 hover:bg-primary-foreground/15"
            >
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/20 text-accent ring-1 ring-accent/30">
                <f.icon className="size-6" />
              </div>
              <h2 className="mt-3 font-heading text-lg font-bold">{f.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-primary-foreground/80">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
