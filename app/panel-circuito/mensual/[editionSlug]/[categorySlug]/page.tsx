import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCircuitoEditionBySlug } from "@/lib/data/circuito/editions"
import { getCircuitoCategoryBySlug } from "@/lib/data/circuito/categories"
import { getCircuitoParticipants, getPlayersForSelect } from "@/lib/data/circuito/participants"
import { getCircuitoMatches, refreshRepechajeStructure } from "@/lib/data/circuito/matches"
import { getCircuitRanking } from "@/lib/data/circuito/ranking"
import { selectDrawRule } from "@/lib/circuito/generateBracket"
import { CIRCUITO_FORMAT_SPEC } from "@/lib/circuito/formatSpec"
import { ParticipantsPanel } from "@/components/admin/circuito/ParticipantsPanel"
import { MatchesList } from "@/components/admin/circuito/MatchesList"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"

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
  // Cuadros armados antes de que el repechaje tuviera su forma fija: se
  // actualizan la primera vez que se abre la categoría.
  if (hasBracket) await refreshRepechajeStructure(category.id)
  const matches = hasBracket ? await getCircuitoMatches(category.id) : []
  const ranking = hasBracket ? await getCircuitRanking(edition.id, category.id) : []
  const players = await getPlayersForSelect()

  const participantNames = Object.fromEntries(participants.map((p) => [p.id, p.display_name]))
  const participantSeeds = Object.fromEntries(participants.map((p) => [p.id, p.seed]))
  const mainMatches = matches.filter((m) => m.bracket === "main")
  const repechajeMatches = matches.filter((m) => m.bracket === "repechaje")
  const format = category.draw_size ? (selectDrawRule(category.draw_size, CIRCUITO_FORMAT_SPEC)?.format ?? null) : null

  return (
    <AdminShell
      panel="circuito"
      context="Mid Master y torneos mensuales"
      currentSection="mensual"
      publicHref={`/circuito-del-parque/torneos/${editionSlug}/${categorySlug}`}
    >
      <AdminPageHeader
        crumbs={[
          { label: "Circuito mensual", href: "/panel-circuito/mensual" },
          { label: edition.name, href: `/panel-circuito/mensual/${editionSlug}` },
          { label: category.name },
        ]}
        title={category.name}
        lede={`${category.type === "single" ? "Single" : "Dobles"}${hasBracket ? ` · ${category.draw_size} inscriptos` : ""}`}
      />

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
            categoryId={category.id}
            part="main"
            matches={mainMatches}
            participantNames={participantNames}
            participantSeeds={participantSeeds}
            editionSlug={editionSlug}
            categorySlug={categorySlug}
            format={format}
          />

          {ranking.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-2 font-heading text-xl font-bold uppercase">
                Puntos de ranking otorgados en esta categoría
              </h2>
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                {ranking.map((r) => (
                  <div key={r.playerId} className="flex items-center justify-between border-b border-border px-3 py-2 text-sm last:border-0">
                    <span className="text-foreground">{r.playerName}</span>
                    <span className="font-mono text-muted-foreground">{r.points} pts</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="mt-10">
            <MatchesList
              categoryId={category.id}
              part="repechaje"
              matches={repechajeMatches}
              participantNames={participantNames}
              participantSeeds={participantSeeds}
              editionSlug={editionSlug}
              categorySlug={categorySlug}
              format={format}
            />
          </section>
        </>
      )}
    </AdminShell>
  )
}
