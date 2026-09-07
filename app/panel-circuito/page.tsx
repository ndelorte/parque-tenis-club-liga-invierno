import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, LogOut, Trophy, ExternalLink } from "lucide-react"
import { signOutMaster } from "@/app/actions/mid-master"
import { getMmCategories } from "@/lib/data/mid-master"
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
      className="group flex items-center justify-between border border-mm-border bg-mm-surface px-5 py-4 transition-colors hover:border-mm-gold/40 hover:bg-mm-surface-2"
    >
      <div>
        <p className="text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
          {typeLabel} · 2 zonas de {zoneSize}
        </p>
        <p className="mt-0.5 text-sm font-medium text-mm-text">{cat.name}</p>
      </div>
      <ArrowRight className="size-4 text-mm-text-faint transition-colors group-hover:text-mm-gold" />
    </Link>
  )
}

export default async function PanelMasterPage() {
  const categories = await getMmCategories()
  const singles = categories.filter((c) => normalizeType(c.type) === "singles")
  const doubles = categories.filter((c) => normalizeType(c.type) === "doubles")

  return (
    <div className="min-h-dvh bg-mm-bg text-mm-text">
      <header className="sticky top-0 z-30 border-b border-mm-border bg-mm-surface">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex size-9 shrink-0 items-center justify-center rounded border border-mm-gold/30 bg-mm-bg">
            <Trophy className="size-4 text-mm-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-mm-text">Panel Mid Master</p>
            <p className="text-xs text-mm-text-muted">Mid Master 2026</p>
          </div>
          <Link
            href="/mid-master"
            target="_blank"
            className="hidden items-center gap-1.5 rounded border border-mm-border px-3 py-1.5 text-xs text-mm-text-muted transition-colors hover:border-mm-gold/40 hover:text-mm-gold sm:flex"
          >
            <ExternalLink className="size-3.5" />
            Ver público
          </Link>
          <form action={signOutMaster}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs text-mm-text-muted transition-colors hover:bg-mm-surface-2 hover:text-mm-text"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {categories.length === 0 ? (
          <div className="border border-mm-border bg-mm-surface p-8 text-center">
            <p className="text-mm-text-muted">
              No se encontraron categorías en la base de datos.
            </p>
            <p className="mt-2 text-xs text-mm-text-faint">
              Verificá que la tabla <code>mid_master_categories</code> tenga datos.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-mm-gold">
                Mid Master · 2026
              </p>
              <h1 className="mt-1 font-mm-display text-2xl font-bold text-mm-text sm:text-3xl">
                Gestión del torneo
              </h1>
              <p className="mt-2 text-sm text-mm-text-muted">
                Seleccioná una categoría para cargar resultados, editar participantes y programar partidos.
              </p>
            </div>

            {singles.length > 0 && (
              <section className="mb-8">
                <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
                  Singles
                </p>
                <div className="grid gap-px border border-mm-border sm:grid-cols-2">
                  {singles.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
                </div>
              </section>
            )}

            {doubles.length > 0 && (
              <section>
                <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
                  Dobles
                </p>
                <div className="grid gap-px border border-mm-border sm:grid-cols-2">
                  {doubles.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
