import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getCircuitoEditionBySlug } from "@/lib/data/circuito/editions"
import { getCircuitoCategoriesForEdition } from "@/lib/data/circuito/categories"
import { getCircuitoParticipants } from "@/lib/data/circuito/participants"
import { getCircuitoMatches } from "@/lib/data/circuito/matches"
import { categoryStatus, formatLabel } from "@/lib/circuito/categoryStatus"
import { selectDrawRule } from "@/lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { isGrandSlamMonth } from "@/lib/circuito/pointsTable"
import { MONTH_NAMES } from "@/lib/circuito/seasonCalendar"
import { CategoryColumn, DoubleRacquetIcon, SingleRacquetIcon, type CategoryListItem } from "@/components/circuito/category-list"
import { CategoryModeSwitch } from "@/components/circuito/category-mode-switch"
import type { CircuitoCategoryRow } from "@/lib/data/circuito/types"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ edition: string }>
}): Promise<Metadata> {
  const { edition } = await params
  const ed = await getCircuitoEditionBySlug(edition)
  return { title: ed ? `${ed.name} | Circuito del Parque` : "Circuito del Parque" }
}

// "Campeón"/"Campeona"/"Campeones" según la categoría — dato de presentación
// (no una regla deportiva): dobles siempre es una pareja ("Campeones"),
// single femenino "Campeona", el resto "Campeón".
function championWord(category: Pick<CircuitoCategoryRow, "type" | "name">): string {
  if (category.type === "dobles") return "Campeones"
  return category.name.includes("Damas") ? "Campeona" : "Campeón"
}

async function toListItem(category: CircuitoCategoryRow): Promise<CategoryListItem> {
  const [participants, matches] = await Promise.all([
    getCircuitoParticipants(category.id),
    getCircuitoMatches(category.id),
  ])
  const names = Object.fromEntries(participants.map((p) => [p.id, { name: p.display_name, seed: p.seed }]))
  const status = categoryStatus(category.draw_size ?? 0, matches, names)

  const statusText =
    status.kind === "finished"
      ? `${championWord(category)}: ${status.champion}`
      : status.kind === "live"
        ? status.label
        : "Por definir"
  const statusTone = status.kind === "finished" ? "done" : status.kind === "live" ? "live" : "pending"

  return {
    slug: category.slug,
    name: category.name,
    formatText: formatLabel(category.draw_size ?? 0),
    countText: `${category.draw_size} ${category.type === "single" ? "inscriptos" : "parejas"}`,
    statusText,
    statusTone,
  }
}

export default async function CircuitoTorneoPage({
  params,
}: {
  params: Promise<{ edition: string }>
}) {
  const { edition: editionSlug } = await params
  const edition = await getCircuitoEditionBySlug(editionSlug)
  if (!edition) notFound()

  // Solo las categorías que se juegan este mes (tienen cuadro armado con un
  // formato válido). No alcanza con chequear que draw_size no sea null: un
  // draw_size cargado a mano o por un import con menos del mínimo de 4
  // inscriptos (reglas-circuito-del-parque.md) no matchea ningún drawRule y
  // esa categoría tampoco se jugó ese mes — se trata igual que "sin cuadro
  // armado" en vez de listarla y romper al entrar.
  const categories = (await getCircuitoCategoriesForEdition(edition.id)).filter(
    (c) => c.draw_size && selectDrawRule(c.draw_size, CIRCUITO_FORMAT_SPEC),
  )
  const [singleItems, doblesItems] = await Promise.all([
    Promise.all(categories.filter((c) => c.type === "single").map(toListItem)),
    Promise.all(categories.filter((c) => c.type === "dobles").map(toListItem)),
  ])

  const grandSlam = isGrandSlamMonth(edition.month)

  return (
    <main>
      <section className="court-stripe-header px-4 py-11 text-board-foreground sm:px-6 lg:px-8 lg:py-14">
        <div className="mx-auto flex max-w-6xl flex-col gap-3">
          <Link href="/circuito-del-parque" className="self-start text-[15px] font-semibold no-underline hover:underline">
            Temporada {edition.year}
          </Link>
          <h1 className="font-heading text-7xl font-extrabold uppercase leading-[0.85] sm:text-8xl lg:text-[9rem]">
            {edition.name}
          </h1>
          <p className="text-base sm:text-lg">
            {MONTH_NAMES[edition.month - 1]} {edition.year}
            {grandSlam && ". Grand Slam: puntos dobles para el ranking."}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay categorías con cuadro armado para este torneo.</p>
        ) : (
          <>
            <div className="hidden gap-14 lg:grid lg:grid-cols-2">
              <CategoryColumn title="Single" icon={<SingleRacquetIcon className="size-8" />} items={singleItems} editionSlug={editionSlug} />
              <CategoryColumn title="Dobles" icon={<DoubleRacquetIcon className="size-8" />} items={doblesItems} editionSlug={editionSlug} />
            </div>
            <div className="lg:hidden">
              <CategoryModeSwitch single={singleItems} dobles={doblesItems} editionSlug={editionSlug} />
            </div>
          </>
        )}
      </div>
    </main>
  )
}
