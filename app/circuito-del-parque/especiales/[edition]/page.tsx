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
  "El cierre del año del Circuito del Parque. Los 8 mejores del ranking anual de cada categoría en dos zonas de todos contra todos; los dos primeros de cada zona a semifinales y la final a tres sets completos."

interface Props {
  params: Promise<{ edition: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition } = await params
  const ed = await getMmEditionBySlug(edition)
  // Borrador (Final Master sin publicar): invisible.
  if (!ed || ed.status === "upcoming") return {}
  return {
    title: `${ed.name} ${ed.year} | Parque Tenis Club`,
    description:
      "Torneo especial del Circuito del Parque. Los mejores clasificados de cada categoría compiten en zonas, semifinales y final.",
  }
}

export default async function EdicionEspecialPage({ params }: Props) {
  const { edition } = await params
  const ed = await getMmEditionBySlug(edition)
  if (!ed || ed.status === "upcoming") notFound()

  const categories = await getMmCategoriesForPublic(ed.id)
  const participantsCount = categories.reduce(
    (sum, cat) => sum + cat.zones[0].participants.length + cat.zones[1].participants.length,
    0,
  )

  return (
    <>
      <MidMasterHero
        name={ed.name}
        year={ed.year}
        categoriesCount={categories.length}
        participantsCount={participantsCount}
        description={isFinalMasterSlug(ed.slug) ? FINAL_MASTER_DESCRIPTION : undefined}
      />
      <CategoryGrid editionSlug={ed.slug} categories={categories} />
      <MmSponsorsBanner />
    </>
  )
}
