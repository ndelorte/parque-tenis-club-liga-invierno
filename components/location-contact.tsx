import { MapPin, Clock, Phone, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CLUB, waLink } from "@/lib/site"

export function LocationContact() {
  return (
    <>
      <section id="ubicacion" className="bg-secondary/50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wide text-accent">
                Ubicación
              </span>
              <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Te esperamos en el club
              </h2>
              <ul className="mt-8 space-y-5">
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="leading-relaxed text-foreground">
                    {CLUB.address}
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="leading-relaxed text-foreground">
                    {CLUB.hours}
                  </span>
                </li>
              </ul>
            </div>

            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border shadow-sm">
              <iframe
                title="Mapa de ubicación de Parque Tenis Club"
                src={CLUB.mapsEmbed}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="text-sm font-semibold uppercase tracking-wide text-accent">
            Contacto
          </span>
          <h2 className="mt-3 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
            Escribinos y vení a jugar
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Respondemos tus consultas por WhatsApp de forma rápida. Te contamos
            horarios, valores y disponibilidad.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              asChild
              size="lg"
              className="h-13 bg-accent px-8 text-base text-accent-foreground hover:bg-accent/90"
            >
              <a
                href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="size-5" />
                Escribir por WhatsApp
              </a>
            </Button>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground sm:flex-row sm:gap-8">
            <a
              href={`tel:+${CLUB.whatsapp}`}
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Phone className="size-4 text-primary" />
              {CLUB.phoneDisplay}
            </a>
            <a
              href={`mailto:${CLUB.email}`}
              className="flex items-center gap-2 transition-colors hover:text-foreground"
            >
              <Mail className="size-4 text-primary" />
              {CLUB.email}
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
