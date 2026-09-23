import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ZoneSection } from "@/components/mid-master/ZoneSection"
import { KnockoutBracket } from "@/components/mid-master/KnockoutBracket"
import { MmReveal } from "@/components/mid-master/MmReveal"
import { getMmEditionBySlug, getMmCategoryForPublic, getMmCategories } from "@/lib/data/mid-master"

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

export default async function CategoryPage({ params }: Props) {
  const { edition, slug } = await params
  const ed = await getMmEditionBySlug(edition)
  if (!ed) notFound()

  const cat = await getMmCategoryForPublic(ed.id, slug)
  if (!cat) notFound()

  const typeLabel = cat.type === "singles" ? "Singles" : "Dobles"
  const zoneLabel =
    cat.zoneSize === 3
      ? "2 zonas de 3 · Semifinal · Final"
      : "2 zonas de 4 · Semifinal · Final"

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href={`/circuito-del-parque/especiales/${ed.slug}`}
        className="mb-8 inline-flex items-center gap-1.5 text-xs text-mm-text-faint transition-colors hover:text-mm-gold"
      >
        <ArrowLeft className="size-3.5" />
        {ed.name}
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
            <MmReveal delay={0}>
              <ZoneSection zone={cat.zones[0]} />
            </MmReveal>
            <MmReveal delay={100}>
              <ZoneSection zone={cat.zones[1]} />
            </MmReveal>
          </div>
          <MmReveal delay={0} className="mt-8">
            <KnockoutBracket knockout={cat.knockout} />
          </MmReveal>
        </>
      )}
    </div>
  )
}
