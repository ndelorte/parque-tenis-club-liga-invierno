import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCircuitoEditionBySlug } from "@/lib/data/circuito/editions"
import { getCircuitoCategoryBySlug } from "@/lib/data/circuito/categories"
import { getCircuitoParticipants } from "@/lib/data/circuito/participants"
import { getCircuitoMatches } from "@/lib/data/circuito/matches"
import { BracketView } from "@/components/circuito/BracketView"
import { RepechajeView } from "@/components/circuito/RepechajeView"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ edition: string; categoria: string }>
}): Promise<Metadata> {
  const { edition, categoria } = await params
  const ed = await getCircuitoEditionBySlug(edition)
  const cat = ed ? await getCircuitoCategoryBySlug(ed.id, categoria) : null
  return { title: cat ? `${cat.name} — ${ed!.name} | Circuito del Parque` : "Circuito del Parque" }
}

export default async function CircuitoTorneoCategoriaPage({
  params,
}: {
  params: Promise<{ edition: string; categoria: string }>
}) {
  const { edition: editionSlug, categoria: categorySlug } = await params
  const edition = await getCircuitoEditionBySlug(editionSlug)
  if (!edition) notFound()

  const category = await getCircuitoCategoryBySlug(edition.id, categorySlug)
  if (!category || category.draw_size === null) notFound()

  const [participants, matches] = await Promise.all([
    getCircuitoParticipants(category.id),
    getCircuitoMatches(category.id),
  ])
  const participantNames = Object.fromEntries(participants.map((p) => [p.id, p.display_name]))

  const mainMatches = matches.filter((m) => m.bracket === "main")
  const repechajeMatches = matches.filter((m) => m.bracket === "repechaje")

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href={`/circuito-del-parque/torneos/${editionSlug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {edition.name}
      </Link>

      <h1 className="mb-1 font-heading text-2xl font-bold text-foreground sm:text-3xl">{category.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {category.type === "single" ? "Single" : "Dobles"} · {category.draw_size} inscriptos
      </p>

      <BracketView matches={mainMatches} participantNames={participantNames} />
      <RepechajeView matches={repechajeMatches} participantNames={participantNames} />
    </main>
  )
}
