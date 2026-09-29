import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ZoneSection } from "@/components/mid-master/ZoneSection"
import { KnockoutBracket } from "@/components/mid-master/KnockoutBracket"
import { MmSponsorsBanner } from "@/components/mid-master/MmSponsorsBanner"
import { getMmEditionBySlug, getMmCategoryForPublic, getMmCategories } from "@/lib/data/mid-master"
import type { MmCategory } from "@/lib/mid-master/types"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ edition: string; slug: string }>
}

export async function generateStaticParams({ params }: { params: { edition: string } }) {
  // Intenta pre-generar rutas; si falla silenciosamente, se resuelven en runtime
  try {
    const { edition } = params
    const ed = await getMmEditionBySlug(edition)
    if (!ed) return []
    const categories = await getMmCategories(ed.id)
    return categories.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition, slug } = await params
  const ed = await getMmEditionBySlug(edition)
  if (!ed) return {}
  const cat = await getMmCategoryForPublic(ed.id, slug)
  if (!cat) return {}
  return {
    title: `${cat.name} · ${ed.name} ${ed.year} | Parque Tenis Club`,
    description: `Zonas, fixture y cuadro final de ${cat.name} en el ${ed.name} ${ed.year}.`,
  }
}

function getChampionLabel(category: MmCategory): string {
  if (category.type === "doubles") return "Campeones"
  return /damas/i.test(category.name) ? "Campeona" : "Campeón"
}

function getCrossDescription(category: MmCategory): string {
  const unit = category.type === "doubles" ? "parejas" : "jugadores"
  return `2 zonas de ${category.zoneSize} ${unit}. Pasan los dos primeros de cada zona; las semifinales se cruzan (1° A con 2° B, 1° B con 2° A).`
}

export default async function CategoryPage({ params }: Props) {
  const { edition, slug } = await params
  const ed = await getMmEditionBySlug(edition)
  if (!ed) notFound()

  const cat = await getMmCategoryForPublic(ed.id, slug)
  if (!cat) notFound()

  const { final } = cat.knockout
  const isFinalPlayed = final.status === "played" || final.status === "walkover"
  const championName =
    isFinalPlayed && final.winnerId === final.participantAId
      ? final.participantALabel
      : final.participantBLabel
  const runnerUpName =
    isFinalPlayed && final.winnerId === final.participantAId
      ? final.participantBLabel
      : final.participantALabel

  const noParticipants = cat.zones[0].participants.length === 0 && cat.zones[1].participants.length === 0

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Estás en" className="flex flex-wrap gap-x-2 gap-y-1 text-sm font-semibold text-mm-text-muted">
        <Link href="/circuito-del-parque" className="hover:text-mm-gold-light">
          Circuito del Parque
        </Link>
        <span aria-hidden="true">/</span>
        <Link href={`/circuito-del-parque/especiales/${ed.slug}`} className="hover:text-mm-gold-light">
          {ed.name} {ed.year}
        </Link>
      </nav>

      <header className="mt-3 grid gap-2.5 border-b border-mm-gold-muted pb-6">
        <h1 className="font-mm-display text-[clamp(2.125rem,7vw,3.75rem)] leading-none text-mm-text">{cat.name}</h1>
        <p className="text-mm-text-muted">{getCrossDescription(cat)}</p>
      </header>

      {noParticipants ? (
        <p className="mt-8 text-sm text-mm-text-muted">Los participantes aún no fueron cargados.</p>
      ) : (
        <>
          {isFinalPlayed && (
            <section
              aria-labelledby="mm-champ-h"
              className="relative mt-7 grid gap-1.5 justify-items-start border border-mm-gold bg-mm-gold-wash px-5 py-5 outline outline-1 outline-offset-4 outline-mm-gold-muted sm:px-7 sm:py-6"
            >
              <p id="mm-champ-h" className="font-heading text-lg font-bold text-mm-gold">
                {getChampionLabel(cat)}
              </p>
              <p className="font-mm-display text-[clamp(1.875rem,6vw,2.75rem)] leading-[1.05] text-mm-text">
                {championName}
              </p>
              <p className="text-[15px] text-mm-text-muted">
                Final ante {runnerUpName}
                <br />
                <b className="font-heading text-2xl font-bold tracking-[0.02em] text-mm-text tabular-nums">
                  {final.score}
                </b>
              </p>
            </section>
          )}

          <section className="mt-10" aria-labelledby="mm-cuadro-h">
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
              <h2 id="mm-cuadro-h" className="font-mm-display text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.05] text-mm-text">
                Cuadro final
              </h2>
              <p className="text-sm text-mm-text-muted">
                Semis al mejor de 3 con super tie-break; final a 3 sets completos.
              </p>
            </div>
            <KnockoutBracket knockout={cat.knockout} />
          </section>

          <section className="mt-10" aria-labelledby="mm-zonas-h">
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
              <h2 id="mm-zonas-h" className="font-mm-display text-[clamp(1.75rem,5vw,2.5rem)] leading-[1.05] text-mm-text">
                Zonas
              </h2>
              <p className="text-sm text-mm-text-muted">
                Orden: partidos ganados, diferencia de sets, diferencia de games, enfrentamiento directo.
              </p>
            </div>
            <div className="grid gap-9 md:grid-cols-2">
              <ZoneSection zone={cat.zones[0]} />
              <ZoneSection zone={cat.zones[1]} />
            </div>
            <p className="mt-2.5 text-[13px] text-mm-text-muted">
              El tercer set de zonas y semifinales es super tie-break y se registra como 7-6.
            </p>
          </section>
        </>
      )}

      <div className="mt-12">
        <MmSponsorsBanner />
      </div>
    </div>
  )
}
