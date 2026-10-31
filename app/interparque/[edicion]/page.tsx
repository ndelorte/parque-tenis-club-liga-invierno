import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SeasonHero } from "@/components/interparque/SeasonHero"
import { RulesSection } from "@/components/interparque/RulesSection"
import { StandingsTable } from "@/components/interparque/StandingsTable"
import { MatchesList } from "@/components/interparque/MatchesList"
import {
  getInterparqueEditionByNumber,
  getInterparqueMatches,
  getInterparquePlayers,
  getInterparqueStandings,
} from "@/lib/data/interparque"
import { buildPlayerParticipation, buildSeasonCalendar } from "@/components/interparque/seasonCalendar"
import { editionLabel } from "@/lib/interparque/editions"

export const revalidate = 60

const MATCHES_PAGE_SIZE = 8

function parseEditionNumber(param: string): number | null {
  if (!/^\d+$/.test(param)) return null
  const n = Number.parseInt(param, 10)
  return n > 0 ? n : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ edicion: string }>
}): Promise<Metadata> {
  const { edicion } = await params
  const number = parseEditionNumber(edicion)
  const edition = number ? await getInterparqueEditionByNumber(number) : null
  if (!edition) return { title: "Interparque | Parque Tenis Club" }
  return {
    title: `Interparque, ${editionLabel(edition.number)} | Parque Tenis Club`,
    description: `Interparque, ${editionLabel(edition.number)}: partidos de single entre alumnos del club, domingo a domingo. Calendario de fechas, tabla de posiciones y partidos jugados.`,
  }
}

export default async function InterparqueEditionPage({
  params,
  searchParams,
}: {
  params: Promise<{ edicion: string }>
  searchParams: Promise<{ pagina?: string }>
}) {
  const [{ edicion }, { pagina }] = await Promise.all([params, searchParams])
  const number = parseEditionNumber(edicion)
  if (!number) notFound()
  const edition = await getInterparqueEditionByNumber(number)
  if (!edition) notFound()

  const [standings, matches, players] = await Promise.all([
    getInterparqueStandings(edition.id),
    getInterparqueMatches(edition.id),
    getInterparquePlayers(edition.id),
  ])

  const seasonDates = buildSeasonCalendar(edition)
  const participation = buildPlayerParticipation(matches)
  const championIds = new Set(players.filter((p) => p.is_champion).map((p) => p.id))

  // Partidos jugados: lista plana del más nuevo al más viejo, paginada de a
  // 8 (sin dividir por fecha 1/2/3 — eso lo pidió el usuario para esta
  // sección; el calendario de fechas sigue en el hero y en la tabla).
  const completedMatches = matches
    .filter((m) => m.status === "completed")
    .sort((a, b) => {
      const dateA = a.match_date ?? ""
      const dateB = b.match_date ?? ""
      if (dateA !== dateB) return dateB.localeCompare(dateA)
      return b.created_at.localeCompare(a.created_at)
    })
  const totalPages = Math.max(1, Math.ceil(completedMatches.length / MATCHES_PAGE_SIZE))
  const page = Math.min(Math.max(Number.parseInt(pagina ?? "1", 10) || 1, 1), totalPages)
  const pageMatches = completedMatches.slice((page - 1) * MATCHES_PAGE_SIZE, page * MATCHES_PAGE_SIZE)

  return (
    <div className="bg-background">
      <SeasonHero seasonDates={seasonDates} editionNumber={edition.number} />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <section id="como-se-juega">
          <h2 className="font-heading text-2xl font-extrabold uppercase tracking-[0.01em] text-foreground sm:text-3xl">
            Cómo se juega
          </h2>
          <div className="mt-4">
            <RulesSection />
          </div>
        </section>

        <section id="tabla" className="mt-14">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
            <h2 className="font-heading text-2xl font-extrabold uppercase tracking-[0.01em] text-foreground sm:text-3xl">
              Tabla de posiciones
            </h2>
            <p className="text-sm text-muted-foreground">
              A igual puntaje, arriba quien jugó menos partidos.
            </p>
          </div>
          <StandingsTable
            standings={standings}
            seasonDates={seasonDates}
            participation={participation}
            championIds={championIds}
          />
        </section>

        <section id="partidos" className="mt-14">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
            <h2 className="font-heading text-2xl font-extrabold uppercase tracking-[0.01em] text-foreground sm:text-3xl">
              Partidos jugados
            </h2>
            <p className="text-sm text-muted-foreground">Debajo de cada nombre, los puntos que sumó.</p>
          </div>
          <MatchesList matches={pageMatches} players={players} page={page} totalPages={totalPages} basePath={`/interparque/${edition.number}`} />
        </section>
      </main>
    </div>
  )
}
