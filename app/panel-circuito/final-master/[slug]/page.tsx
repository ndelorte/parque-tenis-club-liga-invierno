import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { stripPendingSuffix } from "@/lib/final-master/partner"
import { ZoneAdmin } from "@/components/admin/mid-master/ZoneAdmin"
import { KnockoutAdmin } from "@/components/admin/mid-master/KnockoutAdmin"
import { EntriesPanel } from "@/components/admin/final-master/EntriesPanel"
import { PendingPartnersPanel } from "@/components/admin/final-master/PartnerPicker"
import { UndoDrawButton } from "@/components/admin/final-master/FinalMasterActions"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
import { Notice } from "@/components/admin/states"
import { CreateFinalMasterButton } from "@/components/admin/final-master/FinalMasterActions"
import { FinalMasterSchemaError, getCurrentFinalMasterEdition, getFinalMasterEntries } from "@/lib/data/final-master"
import { getMmCategoryAdminData, getMmCategoryBySlug } from "@/lib/data/mid-master"
import { normalizeType } from "@/lib/data/mid-master/types"
import { getPlayersForSelect } from "@/lib/data/circuito/participants"
import { isPlayedMatch } from "@/lib/final-master/draw"

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
  const edition = await getCurrentFinalMasterEdition()
  if (!edition) notFound()
  const year = edition.year
  const data = await getMmCategoryAdminData(edition.id, slug)
  if (!data) {
    // La categoría existe pero le faltan las zonas A y B: se completa con el
    // botón de crear (idempotente, solo agrega lo que falta).
    const category = await getMmCategoryBySlug(edition.id, slug)
    if (!category) notFound()
    return (
      <AdminShell
        panel="circuito"
        context={`Final Master ${year} · ${edition.status !== "upcoming" ? "Publicado" : "Borrador"}`}
        currentSection="final-master"
        publicHref="/circuito-del-parque/final-master"
      >
        <AdminPageHeader
          crumbs={[{ label: "Final Master", href: "/panel-circuito/final-master" }, { label: category.name }]}
          title={category.name}
        />
        <Notice variant="error" title="La categoría no tiene las zonas A y B">
          Completá el Final Master para crear las zonas que faltan (no duplica lo que ya existe).
          <div className="mt-3">
            <CreateFinalMasterButton year={year} />
          </div>
        </Notice>
      </AdminShell>
    )
  }

  const { category, groupA, groupB, knockoutMatches, allParticipants } = data
  const isSingles = normalizeType(category.type) === "singles"
  const allMatches = [...groupA.matches, ...groupB.matches, ...knockoutMatches]
  const drawn = allParticipants.some((p) => p.group_name !== null) || allMatches.length > 0
  const anyPlayed = allMatches.some(isPlayedMatch)
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
  // Con cuadros armados solo se necesita la lista para completar parejas pendientes.
  const pendingPairs = drawn && !isSingles ? allParticipants.filter((p) => !p.player_2_id && !!p.player_id) : []
  const players = (!drawn && !missingMigration) || pendingPairs.length > 0 ? await getPlayersForSelect() : []
  const inscribedIds = allParticipants.flatMap((p) => [p.player_id, p.player_2_id]).filter((id): id is string => !!id)

  return (
    <AdminShell
      panel="circuito"
      context={`Final Master ${year} · ${published ? "Publicado" : "Borrador"}`}
      currentSection="final-master"
      publicHref={
        published
          ? `/circuito-del-parque/especiales/${edition.slug}/categorias/${slug}`
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
          <PendingPartnersPanel
            pending={pendingPairs.map((p) => ({
              id: p.id,
              playerId: p.player_id ?? null,
              name1: stripPendingSuffix(p.name),
            }))}
            players={players}
            inscribedIds={inscribedIds}
          />
          <section className="mb-8">
            <h2 className="mb-3 font-heading text-xl font-bold uppercase">Fase de zonas</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div data-testid={`zone-${groupA.group.name}`}>
                <p className="mb-2 text-sm font-semibold text-muted-foreground">{groupA.group.name}</p>
                <ZoneAdmin data={groupA} allowAddParticipant={false} />
              </div>
              <div data-testid={`zone-${groupB.group.name}`}>
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
