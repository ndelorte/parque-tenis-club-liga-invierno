import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { MidMasterHero } from "@/components/mid-master/MidMasterHero"
import { CategoryGrid } from "@/components/mid-master/CategoryGrid"
import { MmSponsorsBanner } from "@/components/mid-master/MmSponsorsBanner"
import { isFinalMasterSlug } from "@/lib/final-master/categories"
import { getMmEditionBySlug, getMmCategoriesForPublic } from "@/lib/data/mid-master"

export const revalidate = 60

// Sin rutas en build: cada combinación se renderiza en su primera visita y se cachea (ISR).
export async function generateStaticParams() {
  return []
}

const FINAL_MASTER_DESCRIPTION =
  "El cierre del año del Circuito del Parque. Los mejores del ranking anual de cada categoría (hasta 8) en dos zonas de todos contra todos; los dos primeros de cada zona a semifinales y la final a tres sets completos."

interface Props {
  params: Promise<{ edition: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition } = await params
  const ed = await getMmEditionBySlug(edition)
  // Borrador (Final Master sin publicar): invisible.
  if (!ed || ed.status === "upcoming") return {}
  const title = `${ed.name} ${ed.year} | Parque Tenis Club`
  const description = isFinalMasterSlug(ed.slug)
    ? FINAL_MASTER_DESCRIPTION
    : "Torneo especial del Circuito del Parque. Los mejores clasificados de cada categoría compiten en zonas, semifinales y final."
  return { title, description, openGraph: { title, description } }
}

export default async function EdicionEspecialPage({ params }: Props) {
  const { edition } = await params
  const ed = await getMmEditionBySlug(edition)
  // Cualquier edición especial en `upcoming` (borrador) es invisible: 404.
  if (!ed || ed.status === "upcoming") notFound()

  const categories = await getMmCategoriesForPublic(ed.id)
  const participantsCount = categories.reduce(
    (sum, cat) => sum + cat.zones[0].participants.length + cat.zones[1].participants.length,
    0,
  )
  // Final Master: jugadores (categorías single) y parejas (dobles) por separado.
  const countOf = (type: "singles" | "doubles") =>
    categories
      .filter((cat) => cat.type === type)
      .reduce((sum, cat) => sum + cat.zones[0].participants.length + cat.zones[1].participants.length, 0)
  const isFinalMaster = isFinalMasterSlug(ed.slug)

  return (
    <>
      <MidMasterHero
        name={ed.name}
        year={ed.year}
        categoriesCount={categories.length}
        participantsCount={participantsCount}
        playersCount={isFinalMaster ? countOf("singles") : undefined}
        pairsCount={isFinalMaster ? countOf("doubles") : undefined}
        description={isFinalMaster ? FINAL_MASTER_DESCRIPTION : undefined}
      />
      <CategoryGrid editionSlug={ed.slug} categories={categories} />
      {/* Los sponsors son los del Mid Master: el Final Master no los muestra. */}
      {!isFinalMasterSlug(ed.slug) && <MmSponsorsBanner />}
    </>
  )
}
