import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { ZoneAdmin } from "@/components/admin/mid-master/ZoneAdmin"
import { KnockoutAdmin } from "@/components/admin/mid-master/KnockoutAdmin"
import { EntriesPanel } from "@/components/admin/final-master/EntriesPanel"
import { UndoDrawButton } from "@/components/admin/final-master/FinalMasterActions"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
import { Notice } from "@/components/admin/states"
import { FinalMasterSchemaError, getFinalMasterEdition, getFinalMasterEntries } from "@/lib/data/final-master"
import { getMmCategoryAdminData } from "@/lib/data/mid-master"
import { normalizeType } from "@/lib/data/mid-master/types"
import { getPlayersForSelect } from "@/lib/data/circuito/participants"
import { finalMasterSlug } from "@/lib/final-master/categories"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug} · Panel Final Master` }
}

export default async function PanelFinalMasterCategoryPage({ params }: Props) {
  const { slug } = await params
  const year = new Date().getFullYear()
  const edition = await getFinalMasterEdition(year)
  if (!edition) notFound()
  const data = await getMmCategoryAdminData(edition.id, slug)
  if (!data) notFound()

  const { category, groupA, groupB, knockoutMatches, allParticipants } = data
  const isSingles = normalizeType(category.type) === "singles"
  const allMatches = [...groupA.matches, ...groupB.matches, ...knockoutMatches]
  const drawn = allParticipants.some((p) => p.group_name !== null) || allMatches.length > 0
  const anyPlayed = allMatches.some((m) => m.status === "played" || m.status === "walkover")
  const published = edition.status !== "upcoming"

  let entries: Awaited<ReturnType<typeof getFinalMasterEntries>> = []
  let missingMigration = false
  if (!drawn) {
    try {
      entries = await getFinalMasterEntries(category, year)
    } catch (e) {
      if (e instanceof FinalMasterSchemaError) missingMigration = true
      else throw e
    }
  }
  const players = !drawn && !missingMigration ? await getPlayersForSelect() : []

  return (
    <AdminShell
      panel="circuito"
      context={`Final Master ${year} · ${published ? "Publicado" : "Borrador"}`}
      currentSection="final-master"
      publicHref={
        published
          ? `/circuito-del-parque/especiales/${finalMasterSlug(year)}/categorias/${slug}`
          : "/circuito-del-parque/final-master"
      }
    >
      <AdminPageHeader
        crumbs={[{ label: "Final Master", href: "/panel-circuito/final-master" }, { label: category.name }]}
        title={category.name}
        lede={isSingles ? "Singles" : "Dobles"}
      />

      {missingMigration ? (
        <Notice variant="error" title="Falta correr la migración 018">
          Ejecutá <code>supabase/migrations/018_final_master.sql</code> en el SQL editor de Supabase y recargá.
        </Notice>
      ) : !drawn ? (
        <EntriesPanel
          categoryId={category.id}
          isDouble={!isSingles}
          year={year}
          entries={entries.map((e) => ({
            id: e.id,
            name: e.name,
            playerId: e.playerId,
            player2Id: e.player2Id,
            rankingPoints: e.rankingPoints,
          }))}
          players={players}
        />
      ) : (
        <>
          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold uppercase">Fase de zonas</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-semibold text-muted-foreground">{groupA.group.name}</p>
                <ZoneAdmin data={groupA} allowAddParticipant={false} />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-muted-foreground">{groupB.group.name}</p>
                <ZoneAdmin data={groupB} allowAddParticipant={false} />
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold uppercase">Cuadro final</h2>
            <KnockoutAdmin knockoutMatches={knockoutMatches} participants={allParticipants} categoryId={category.id} />
          </section>

          <section className="max-w-md">
            <UndoDrawButton categoryId={category.id} disabled={anyPlayed} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {anyPlayed
                ? "Ya hay partidos jugados: no se pueden deshacer los cuadros."
                : "Borra zonas, fixture y semifinales; los inscriptos quedan para volver a armar."}
            </p>
          </section>
        </>
      )}
    </AdminShell>
  )
}
