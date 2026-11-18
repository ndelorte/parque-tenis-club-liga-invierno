import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Crown } from "lucide-react"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
import { EmptyState, Notice } from "@/components/admin/states"
import {
  CreateFinalMasterButton,
  PublishFinalMasterButton,
} from "@/components/admin/final-master/FinalMasterActions"
import {
  FinalMasterSchemaError,
  getCurrentFinalMasterEdition,
  getFinalMasterCategorySummaries,
  type FinalMasterCategorySummary,
} from "@/lib/data/final-master"
import { normalizeType } from "@/lib/data/mid-master/types"
import { FINAL_MASTER_MAX_ENTRIES } from "@/lib/final-master/draw"
import { getFinalMasterYear } from "@/lib/final-master/year"

export const metadata: Metadata = { title: "Final Master | Panel Circuito del Parque" }
export const dynamic = "force-dynamic"

function CategoryCard({ summary }: { summary: FinalMasterCategorySummary }) {
  const { category, entriesCount, hasDraw, drawComplete } = summary
  const typeLabel = normalizeType(category.type) === "singles" ? "Singles" : "Dobles"
  return (
    <Link
      href={`/panel-circuito/final-master/${category.slug}`}
      className="press group flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-foreground transition-colors hover:border-border-strong hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="grid min-w-0">
        <span className="text-sm text-muted-foreground">
          {typeLabel} · {entriesCount}/{FINAL_MASTER_MAX_ENTRIES} inscriptos ·{" "}
          <span className={drawComplete ? "font-semibold text-win" : hasDraw ? "font-semibold text-loss" : undefined}>
            {drawComplete ? "Cuadros armados" : hasDraw ? "Cuadros incompletos" : "Sin cuadros"}
          </span>
        </span>
        <span className="truncate font-bold">{category.name}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}

function Section({ title, items }: { title: string; items: FinalMasterCategorySummary[] }) {
  if (items.length === 0) return null
  return (
    <section>
      <h2 className="mb-2 mt-[22px] font-heading text-xl font-bold uppercase">{title}</h2>
      <ul role="list" className="grid gap-2 md:grid-cols-2">
        {items.map((s) => (
          <li key={s.category.id}>
            <CategoryCard summary={s} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function PanelFinalMasterPage() {
  // Edición vigente; si no hay ninguna, "Crear" usa el año actual (o el override e2e).
  const edition = await getCurrentFinalMasterEdition()
  const year = edition?.year ?? getFinalMasterYear()

  let summaries: FinalMasterCategorySummary[] = []
  let missingMigration = false
  let readError = ""
  if (edition) {
    try {
      summaries = await getFinalMasterCategorySummaries(edition.id)
    } catch (e) {
      if (e instanceof FinalMasterSchemaError) missingMigration = true
      else readError = e instanceof Error ? e.message : "No se pudieron leer las categorías."
    }
  }

  const published = edition ? edition.status !== "upcoming" : false
  const singles = summaries.filter((s) => normalizeType(s.category.type) === "singles")
  const doubles = summaries.filter((s) => normalizeType(s.category.type) === "doubles")

  return (
    <AdminShell
      panel="circuito"
      context={edition ? `Final Master ${year} · ${published ? "Publicado" : "Borrador"}` : `Final Master ${year}`}
      currentSection="final-master"
      publicHref={
        edition && published
          ? `/circuito-del-parque/especiales/${edition.slug}`
          : "/circuito-del-parque/final-master"
      }
    >
      <AdminPageHeader
        title="Final Master"
        lede="Cargá hasta 8 jugadores por categoría, armá los cuadros y publicá el torneo cuando esté listo."
      />

      {!edition ? (
        <EmptyState
          title={`Todavía no hay Final Master ${year}`}
          icon={Crown}
          action={<CreateFinalMasterButton year={year} />}
        >
          Se crea como borrador con las 10 categorías. No se ve en la web hasta que lo publiques.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
            <div className="grid">
              <span className="text-sm text-muted-foreground">Estado</span>
              <span className="font-heading text-xl font-bold uppercase">
                {published ? "Publicado" : "Borrador"}
              </span>
              <span className="text-sm text-muted-foreground">
                {published ? "Se ve en la web pública." : "No se ve en la web pública."}
              </span>
            </div>
            {!missingMigration && <PublishFinalMasterButton editionId={edition.id} published={published} />}
          </div>

          {missingMigration && (
            <Notice variant="error" title="Falta correr la migración 018">
              Ejecutá <code>supabase/migrations/018_final_master.sql</code> en el SQL editor de Supabase y recargá.
            </Notice>
          )}
          {readError && (
            <Notice variant="error" title="No se pudieron leer las categorías">
              {readError}
            </Notice>
          )}

          {!missingMigration && !readError && summaries.length === 0 && (
            <EmptyState title="La edición no tiene categorías" icon={Crown} action={<CreateFinalMasterButton year={year} />}>
              Volvé a crearla para generar las 10 categorías (no duplica lo que ya existe).
            </EmptyState>
          )}

          <Section title="Singles" items={singles} />
          <Section title="Dobles" items={doubles} />
        </>
      )}
    </AdminShell>
  )
}
