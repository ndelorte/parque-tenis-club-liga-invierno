import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Trophy } from "lucide-react"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
import { EmptyState } from "@/components/admin/states"
import { getMmActiveEdition, getMmCategories } from "@/lib/data/mid-master"
import type { DbMmCategory } from "@/lib/data/mid-master/types"
import { getZoneSize, normalizeType } from "@/lib/data/mid-master/types"

export const metadata: Metadata = {
  title: "Panel Mid Master | Parque Tenis Club",
}

export const dynamic = "force-dynamic"

function CategoryCard({ cat }: { cat: DbMmCategory }) {
  const typeLabel = normalizeType(cat.type) === "singles" ? "Singles" : "Dobles"
  const zoneSize = getZoneSize(cat)
  return (
    <Link
      href={`/panel-circuito/categorias/${cat.slug}`}
      className="press group flex min-h-14 items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-foreground transition-colors hover:border-border-strong hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="grid min-w-0">
        <span className="text-sm text-muted-foreground">
          {typeLabel} · 2 zonas de {zoneSize}
        </span>
        <span className="truncate font-bold">{cat.name}</span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}

export default async function PanelMasterPage() {
  const activeEdition = await getMmActiveEdition()
  const categories = activeEdition ? await getMmCategories(activeEdition.id) : []
  const singles = categories.filter((c) => normalizeType(c.type) === "singles")
  const doubles = categories.filter((c) => normalizeType(c.type) === "doubles")

  return (
    <AdminShell
      panel="circuito"
      context={
        activeEdition
          ? `${activeEdition.name} ${activeEdition.year} · torneos mensuales`
          : "Sin edición activa"
      }
      currentSection="mid-master"
      publicHref={
        activeEdition
          ? `/circuito-del-parque/especiales/${activeEdition.slug}`
          : "/circuito-del-parque"
      }
    >
      <AdminPageHeader
        title="Gestión del Mid Master"
        lede="Elegí una categoría para cargar resultados, editar participantes y programar partidos."
      />

      {!activeEdition ? (
        <EmptyState title="No hay ninguna edición activa" icon={Trophy}>
          Para cargar resultados, la edición tiene que figurar como activa en{" "}
          <code className="rounded border border-border bg-surface px-1 text-[0.9em]">mid_master_editions</code>{" "}
          (status{" "}
          <code className="rounded border border-border bg-surface px-1 text-[0.9em]">active</code>).
        </EmptyState>
      ) : categories.length === 0 ? (
        <EmptyState title="No se encontraron categorías para esta edición" icon={Trophy}>
          Verificá que la tabla{" "}
          <code className="rounded border border-border bg-surface px-1 text-[0.9em]">mid_master_categories</code>{" "}
          tenga datos con este{" "}
          <code className="rounded border border-border bg-surface px-1 text-[0.9em]">edition_id</code>.
        </EmptyState>
      ) : (
        <>
          {singles.length > 0 && (
            <section>
              <h2 className="mb-2 mt-[22px] font-heading text-xl font-bold uppercase">Singles</h2>
              <ul role="list" className="grid gap-2 md:grid-cols-2">
                {singles.map((cat) => (
                  <li key={cat.id}>
                    <CategoryCard cat={cat} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {doubles.length > 0 && (
            <section>
              <h2 className="mb-2 mt-[22px] font-heading text-xl font-bold uppercase">Dobles</h2>
              <ul role="list" className="grid gap-2 md:grid-cols-2">
                {doubles.map((cat) => (
                  <li key={cat.id}>
                    <CategoryCard cat={cat} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </AdminShell>
  )
}
