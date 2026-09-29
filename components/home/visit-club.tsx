import { Clock, Mail, MapPin } from "lucide-react"
import { CLUB, waLink } from "@/lib/site"

export function VisitClub() {
  return (
    <section id="ubicacion" className="scroll-mt-20 px-4 pb-20 sm:px-6 lg:px-8 lg:pb-24">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-md bg-board text-board-foreground lg:grid-cols-2">
        <div id="contacto" className="flex scroll-mt-20 flex-col gap-5 p-8 sm:p-12">
          <h2 className="font-heading text-[clamp(2.75rem,5vw,3.75rem)] font-extrabold uppercase leading-[0.9]">Vení al club</h2>
          <address className="flex flex-col gap-3 text-[17px] not-italic">
            <span className="flex items-start gap-3">
              <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-clay-light" />
              {CLUB.address}
            </span>
            <span className="flex items-start gap-3">
              <Clock aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-clay-light" />
              {CLUB.hours}
            </span>
            <a
              href={`mailto:${CLUB.email}`}
              className="flex items-start gap-3 self-start rounded-sm underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground"
            >
              <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-clay-light" />
              {CLUB.email}
            </a>
          </address>
          <a
            href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
            target="_blank"
            rel="noopener noreferrer"
            className="press mt-auto inline-flex h-14 items-center self-start rounded-md bg-accent px-7 text-base font-semibold text-accent-foreground hover:brightness-110 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground"
          >
            Escribinos por WhatsApp
          </a>
        </div>
        <iframe
          title="Mapa de Parque Tenis Club"
          src={CLUB.mapsEmbed}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="aspect-[4/3] w-full border-0 lg:aspect-auto lg:h-full lg:min-h-[340px]"
        />
      </div>
    </section>
  )
}
