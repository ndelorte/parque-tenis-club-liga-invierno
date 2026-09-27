import type { Metadata } from "next"
import Link from "next/link"
import { getCircuitoEditions } from "@/lib/data/circuito/editions"
import { getMmActiveEdition } from "@/lib/data/mid-master"
import { buildSeasonCalendar } from "@/lib/circuito/seasonCalendar"
import { SeasonCalendar } from "@/components/circuito/season-calendar"

export const metadata: Metadata = {
  title: "Circuito del Parque | Parque Tenis Club",
  description: "Torneos mensuales por categoría, ranking anual y Final Master del Circuito del Parque.",
}

export default async function CircuitoDelParquePage() {
  const now = new Date()
  const year = now.getFullYear()

  const [editions, midMaster] = await Promise.all([getCircuitoEditions(), getMmActiveEdition()])
  const months = buildSeasonCalendar(editions, year, now.getMonth() + 1)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 pb-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <h1 className="font-heading text-5xl font-extrabold uppercase leading-[0.9] text-foreground sm:text-6xl lg:text-7xl">
          Temporada {year}
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          Un torneo por categoría cada mes, con el nombre de un torneo del circuito profesional. Los puntos suman al
          ranking anual y los 8 mejores de cada categoría juegan la Final Master.
        </p>
      </div>

      <div className="mt-8">
        <SeasonCalendar months={months} />
      </div>

      <div className="mt-16 border-t-2 border-draw-line">
        <LandingRow
          title="Ranking"
          description="La tabla de cada categoría, torneo por torneo. Los 8 primeros clasifican a la Final Master."
          cta="Ver ranking"
          href="/circuito-del-parque/ranking"
        />
        <LandingRow
          title="Final Master"
          description="El cierre de la temporada. Hoy, la clasificación provisoria de cada categoría."
          cta="Ver clasificados"
          href="/circuito-del-parque/final-master"
        />
        {midMaster && (
          <LandingRow
            title="Mid Master"
            description="El torneo especial de mitad de año, con zonas y cuadro final."
            cta="Ver torneo"
            href={`/circuito-del-parque/especiales/${midMaster.slug}`}
          />
        )}
      </div>
    </main>
  )
}

function LandingRow({ title, description, cta, href }: { title: string; description: string; cta: string; href: string }) {
  return (
    <Link
      href={href}
      className="group grid grid-cols-1 gap-2 border-b border-border py-6 no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)_auto] sm:items-center sm:gap-8 sm:py-7"
    >
      <span className="font-heading text-3xl font-extrabold uppercase leading-none text-foreground group-hover:underline group-hover:underline-offset-[6px] sm:text-4xl lg:text-5xl">
        {title}
      </span>
      <span className="text-base leading-relaxed text-muted-foreground">{description}</span>
      <span className="font-semibold text-accent-dark sm:text-right">{cta}</span>
    </Link>
  )
}
