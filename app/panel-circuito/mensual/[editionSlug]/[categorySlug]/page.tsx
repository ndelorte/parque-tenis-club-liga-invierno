import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { getCircuitoEditionBySlug } from "@/lib/data/circuito/editions"
import { getCircuitoCategoryBySlug } from "@/lib/data/circuito/categories"
import { getCircuitoParticipants, getPlayersForSelect } from "@/lib/data/circuito/participants"
import { getCircuitoMatches } from "@/lib/data/circuito/matches"
import { getCircuitRanking } from "@/lib/data/circuito/ranking"
import { ParticipantsPanel } from "@/components/admin/circuito/ParticipantsPanel"
import { MatchesList } from "@/components/admin/circuito/MatchesList"

export const metadata: Metadata = { title: "Categoría | Panel Circuito del Parque" }
export const dynamic = "force-dynamic"

export default async function CircuitoCategoryPage({
  params,
}: {
  params: Promise<{ editionSlug: string; categorySlug: string }>
}) {
  const { editionSlug, categorySlug } = await params
  const edition = await getCircuitoEditionBySlug(editionSlug)
  if (!edition) notFound()

  const category = await getCircuitoCategoryBySlug(edition.id, categorySlug)
  if (!category) notFound()

  const participants = await getCircuitoParticipants(category.id)
  const hasBracket = category.draw_size !== null
  const matches = hasBracket ? await getCircuitoMatches(category.id) : []
  const ranking = hasBracket ? await getCircuitRanking(edition.id, category.id) : []
  const players = hasBracket ? [] : await getPlayersForSelect()

  const participantNames = Object.fromEntries(participants.map((p) => [p.id, p.display_name]))

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href={`/panel-circuito/mensual/${editionSlug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        {edition.name}
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-foreground">{category.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {category.type === "single" ? "Single" : "Dobles"}
        {hasBracket ? ` · ${category.draw_size} inscriptos` : ""}
      </p>

      <div className="mb-8">
        <ParticipantsPanel
          categoryId={category.id}
          categoryType={category.type}
          editionSlug={editionSlug}
          categorySlug={categorySlug}
          participants={participants}
          players={players}
          hasBracket={hasBracket}
        />
      </div>

      {hasBracket && (
        <>
          <MatchesList
            matches={matches}
            participantNames={participantNames}
            editionSlug={editionSlug}
            categorySlug={categorySlug}
          />

          {ranking.length > 0 && (
            <div className="mt-8">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Puntos de ranking otorgados en esta categoría
              </p>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {ranking.map((r) => (
                  <div key={r.playerId} className="flex items-center justify-between border-b border-border px-3 py-2 text-sm last:border-0">
                    <span className="text-foreground">{r.playerName}</span>
                    <span className="font-mono text-muted-foreground">{r.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
