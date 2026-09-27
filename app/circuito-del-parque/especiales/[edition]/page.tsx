import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { MidMasterHero } from "@/components/mid-master/MidMasterHero"
import { CategoryGrid } from "@/components/mid-master/CategoryGrid"
import { MmSponsorsBanner } from "@/components/mid-master/MmSponsorsBanner"
import { getMmEditionBySlug, getMmCategoriesForPublic } from "@/lib/data/mid-master"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ edition: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { edition } = await params
  const ed = await getMmEditionBySlug(edition)
  if (!ed) return {}
  return {
    title: `${ed.name} ${ed.year} | Parque Tenis Club`,
    description:
      "Torneo especial del Circuito del Parque. Los mejores clasificados de cada categoría compiten en zonas, semifinales y final.",
  }
}

export default async function EdicionEspecialPage({ params }: Props) {
  const { edition } = await params
  const ed = await getMmEditionBySlug(edition)
  if (!ed) notFound()

  const categories = await getMmCategoriesForPublic(ed.id)

  return (
    <>
      <MidMasterHero year={ed.year} />
      <CategoryGrid categories={categories} />
      <MmSponsorsBanner />
    </>
  )
}
