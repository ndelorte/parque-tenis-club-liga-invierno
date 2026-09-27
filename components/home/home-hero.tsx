import Image from "next/image"
import Link from "next/link"
import { EnJuegoBoard } from "@/components/home/en-juego-board"
import type { EnJuego } from "@/lib/data/home"
import { waLink } from "@/lib/site"

// Foto del hero: se reemplaza por una horizontal de ≥2400 px (plan §7).
const HERO_IMAGE = "/images/fondo3.png"

export function HomeHero({ enJuego }: { enJuego: EnJuego }) {
  return (
    <section className="relative isolate overflow-hidden bg-board text-board-foreground">
      <Image src={HERO_IMAGE} alt="" fill priority sizes="100vw" className="-z-20 object-cover object-[center_40%]" />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-board/70 to-board/90 lg:bg-gradient-to-r lg:from-board/90 lg:via-board/80 lg:to-board/45"
      />

      <div className="mx-auto grid max-w-7xl items-end gap-10 px-4 pb-12 pt-40 sm:px-6 lg:min-h-[640px] lg:grid-cols-[7fr_5fr] lg:gap-12 lg:px-8 lg:pb-16 lg:pt-24">
        <div className="flex flex-col gap-6">
          <h1 className="font-heading text-[clamp(3.5rem,8vw,6.75rem)] font-extrabold uppercase leading-[0.88]">
            Viví el tenis en Parque Tenis Club
          </h1>
          <p className="max-w-[34rem] text-lg leading-relaxed text-board-foreground/90 sm:text-xl">
            Canchas de polvo de ladrillo en Quilmes, entrenamientos, escuela y torneos todo el año.
          </p>
          <div className="mt-2 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
            <a
              href={waLink("Hola! Quiero hacer una consulta sobre Parque Tenis Club.")}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-14 items-center rounded-md bg-accent px-7 text-[17px] font-semibold text-accent-foreground hover:brightness-110 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground"
            >
              Consultar por WhatsApp
            </a>
            <Link
              href="#competencias"
              className="rounded-sm text-[17px] font-semibold underline underline-offset-[6px] hover:decoration-clay focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-board-foreground"
            >
              Ver las competencias
            </Link>
          </div>
        </div>

        <EnJuegoBoard data={enJuego} />
      </div>
    </section>
  )
}
