import type { Metadata } from "next"
import { MidMasterHero } from "@/components/mid-master/MidMasterHero"
import { CategoryGrid } from "@/components/mid-master/CategoryGrid"
import { getMmCategoriesForPublic } from "@/lib/data/mid-master"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Mid Master 2026 | Parque Tenis Club",
  description:
    "Torneo de mitad de temporada. Los mejores clasificados de cada categoría compiten en zonas, semifinales y final.",
}

export default async function MidMasterPage() {
  const categories = await getMmCategoriesForPublic()

  return (
    <>
      <MidMasterHero year={2026} />
      <CategoryGrid categories={categories} />
    </>
  )
}
