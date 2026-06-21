import Image from "next/image"
import { MessageCircle, Trophy, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CLUB, waLink } from "@/lib/site"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/fondo3.jpeg"
        alt="Parque Tenis Club"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/60 to-foreground/30" />

      <div className="relative mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-24">
        <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-background/30 bg-background/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-background backdrop-blur-sm">
          <span className="size-2 rounded-full bg-accent" />
          {CLUB.tagline}
        </span>

        <h1 className="max-w-3xl text-balance font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-background sm:text-6xl lg:text-7xl">
          Viví el tenis en{" "}
          <span className="text-accent">Parque Tenis Club</span>
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-background/80">
          Canchas, entrenamientos, escuela y torneos durante todo el año. Vení a
          jugar y sumate a la comunidad.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-13 bg-accent px-7 text-base text-accent-foreground hover:bg-accent/90"
          >
            <a
              href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="size-5" />
              Consultar por WhatsApp
            </a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-13 border-background/40 bg-background/10 px-7 text-base text-background backdrop-blur-sm hover:bg-background/20 hover:text-background"
          >
            <a href="/liga-invierno">
              <Trophy className="size-5" />
              Liga de Invierno
              <ArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}
