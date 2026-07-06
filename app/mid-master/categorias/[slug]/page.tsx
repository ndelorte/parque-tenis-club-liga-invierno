import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ZoneSection } from "@/components/mid-master/ZoneSection"
import { KnockoutBracket } from "@/components/mid-master/KnockoutBracket"
import { getMmCategoryForPublic, getMmCategories } from "@/lib/data/mid-master"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  // Intenta pre-generar rutas; si falla silenciosamente, se resuelven en runtime
  try {
    const categories = await getMmCategories()
    return categories.map((c) => ({ slug: c.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cat = await getMmCategoryForPublic(slug)
  if (!cat) return {}
  return {
    title: `${cat.name} · Mid Master 2026 | Parque Tenis Club`,
    description: `Zonas, fixture y cuadro final de ${cat.name} en el Mid Master 2026.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const cat = await getMmCategoryForPublic(slug)
  if (!cat) notFound()

  const typeLabel = cat.type === "singles" ? "Singles" : "Dobles"
  const zoneLabel =
    cat.zoneSize === 3
      ? "2 zonas de 3 · Semifinal · Final"
      : "2 zonas de 4 · Semifinal · Final"

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/mid-master"
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-mm-text-faint transition-colors hover:text-mm-gold"
      >
        <ArrowLeft className="size-3.5" />
        Mid Master
      </Link>

      <div className="mb-10 border-b border-mm-border pb-8">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-mm-gold">
          {typeLabel} · {zoneLabel}
        </p>
        <h1 className="font-mm-display text-3xl font-bold text-mm-text sm:text-4xl">
          {cat.name}
        </h1>
      </div>

      {cat.zones[0].participants.length === 0 && cat.zones[1].participants.length === 0 ? (
        <p className="text-sm text-mm-text-muted">
          Los participantes aún no fueron cargados.
        </p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <ZoneSection zone={cat.zones[0]} />
            <ZoneSection zone={cat.zones[1]} />
          </div>
          <div className="mt-8">
            <KnockoutBracket knockout={cat.knockout} />
          </div>
        </>
      )}
    </div>
  )
}
