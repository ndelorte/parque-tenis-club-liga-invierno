import type { Metadata } from "next"
import { getAnnualCircuitRanking, getCircuitoCategoriesWithRanking } from "@/lib/data/circuito/ranking"
import { RankingTable } from "@/components/circuito/RankingTable"
import { CategoryFilterPills } from "@/components/circuito/CategoryFilterPills"
import { CourtLines } from "@/components/mid-master/CourtLines"

export const metadata: Metadata = { title: "Final Master | Circuito del Parque" }
// La clasificación sale del ranking, que se recalcula al cargar cada resultado: sin cache.
export const dynamic = "force-dynamic"

// Clasifican los 8 mejores del ranking anual por categoría — reglas-circuito-del-parque.md.
const QUALIFIERS = 8

export default async function CircuitoFinalMasterPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>
}) {
  const { categoria } = await searchParams
  const year = new Date().getFullYear()
  // Todas las categorías que se jugaron en el año (las 14 fijas y las que se
  // agregaron a mano a algún torneo): las que tienen jugadores con puntos. Si
  // la pedida no tiene, se muestra la primera que sí.
  const categories = await getCircuitoCategoriesWithRanking(year)
  const selected = categories.some((c) => c.slug === categoria) ? categoria! : categories[0]?.slug
  const entries = selected ? (await getAnnualCircuitRanking(year, selected)).entries.slice(0, QUALIFIERS) : []

  return (
    // Especiales (Mid Master, Final Master) se ve siempre en oscuro, igual
    // que app/circuito-del-parque/especiales/[edition]/layout.tsx — esta
    // ruta vive fuera de ese segmento, así que fuerza el tema acá.
    <main className="dark min-h-dvh bg-mm-bg text-mm-text">
      <section className="relative isolate overflow-hidden border-b border-mm-gold-muted px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-mm-text-muted">
            Circuito del Parque
          </p>
          <h1 className="mt-2 font-mm-display text-5xl font-bold text-mm-text sm:text-6xl">
            Final Master <span className="text-mm-gold-light">{year}</span>
          </h1>
          <p className="mt-3 max-w-lg text-pretty text-base leading-relaxed text-mm-text-muted">
            El cierre del año del Circuito del Parque. Juegan los {QUALIFIERS} mejores del ranking anual de
            cada categoría; mientras tanto, así va la clasificación provisoria.
          </p>

          <dl className="mt-7 grid grid-cols-2 gap-x-7 gap-y-4 sm:grid-cols-3 sm:gap-y-1">
            <div>
              <dt className="text-[13px] text-mm-text-muted">Fecha</dt>
              <dd className="font-heading text-xl font-bold leading-tight text-mm-gold-light sm:text-2xl">
                Próximamente
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-mm-text-muted">Clasifican</dt>
              <dd className="font-heading text-xl font-bold leading-tight tabular-nums text-mm-gold-light sm:text-2xl">
                {QUALIFIERS} por categoría
              </dd>
            </div>
            <div>
              <dt className="text-[13px] text-mm-text-muted">Categorías</dt>
              <dd className="font-heading text-xl font-bold leading-tight tabular-nums text-mm-gold-light sm:text-2xl">
                {categories.length}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-mm-text-muted">La fecha la confirma el club.</p>

          {/* Único momento audaz de la pantalla: la cancha se dibuja una vez al montar. */}
          <CourtLines className="mt-9 opacity-80" />
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6" aria-labelledby="clasificacion-provisoria">
        <h2
          id="clasificacion-provisoria"
          className="font-heading text-3xl font-bold uppercase leading-none text-mm-text sm:text-4xl"
        >
          Clasificación provisoria
        </h2>

        {selected ? (
          <>
            <CategoryFilterPills
              basePath="/circuito-del-parque/final-master"
              selectedSlug={selected}
              categories={categories}
              variant="especiales"
              className="mt-6"
            />

            <div className="mt-6">
              <RankingTable entries={entries} variant="especiales" />
            </div>

            <p className="mt-3 text-xs text-mm-text-muted">
              Línea de corte: puesto {QUALIFIERS}. A igual puntaje, queda arriba quien jugó menos torneos.
            </p>
          </>
        ) : (
          <p className="mt-6 text-sm text-mm-text-muted">Todavía no hay puntos cargados en el ranking {year}.</p>
        )}
      </section>
    </main>
  )
}
