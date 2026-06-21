import Image from "next/image"
import { Trophy, Calendar, Users, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const FEATURES = [
  { icon: Calendar, label: "Junio a Agosto" },
  { icon: Users, label: "Categorías por nivel" },
  { icon: Trophy, label: "Grandes premios" },
]

export function WinterLeague() {
  return (
    <section id="liga" className="bg-primary py-20 text-primary-foreground sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-foreground">
            <Trophy className="size-3.5" />
            Liga de Invierno
          </span>
          <h2 className="mt-5 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Competí todo el invierno
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-lg leading-relaxed text-primary-foreground/80">
            La liga más esperada del club. Partidos semanales, categorías para
            todos los niveles y mucho tenis aunque haga frío. Sumate y seguí compitiendo.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {FEATURES.map((f) => (
              <li key={f.label} className="flex items-center gap-2 font-medium">
                <f.icon className="size-5 text-accent" />
                {f.label}
              </li>
            ))}
          </ul>

          <Button
            asChild
            size="lg"
            className="mt-9 h-13 bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90"
          >
            <a href="/liga-invierno">
              Más info
              <ArrowRight className="size-5" />
            </a>
          </Button>
        </div>

        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-primary-foreground/20">
          <Image
            src="/images/logoligadeinvierno.png"
            alt="Liga de Invierno"
            fill
            className="object-cover"
          />
        </div>
      </div>
    </section>
  )
}
