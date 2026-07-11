import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { getMmCategoryAdminData } from "@/lib/data/mid-master"
import { normalizeType } from "@/lib/data/mid-master/types"
import { ZoneAdmin } from "@/components/admin/mid-master/ZoneAdmin"
import { KnockoutAdmin } from "@/components/admin/mid-master/KnockoutAdmin"
import { revalidateMmCategory } from "@/app/actions/mid-master"

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug} · Panel Mid Master` }
}

async function RecalcButton({ slug }: { slug: string }) {
  async function revalidate() {
    "use server"
    await revalidateMmCategory(slug)
  }
  return (
    <form action={revalidate}>
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded border border-mm-border px-3 py-1.5 text-xs text-mm-text-muted transition-colors hover:border-mm-gold/40 hover:text-mm-gold"
        title="Actualizar tabla (standings se recalculan automáticamente)"
      >
        <RefreshCw className="size-3.5" />
        Actualizar tabla
      </button>
    </form>
  )
}

export default async function PanelMasterCategoryPage({ params }: Props) {
  const { slug } = await params
  const data = await getMmCategoryAdminData(slug)
  if (!data) notFound()

  const { category, groupA, groupB, knockoutMatches, allParticipants } = data

  return (
    <div className="min-h-dvh bg-mm-bg text-mm-text">
      <header className="sticky top-0 z-30 border-b border-mm-border bg-mm-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/panel-master"
            className="flex items-center gap-1.5 rounded px-2 py-1.5 text-xs text-mm-text-muted transition-colors hover:text-mm-gold"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Panel</span>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
              {normalizeType(category.type) === "singles" ? "Singles" : "Dobles"}
            </p>
            <p className="truncate font-semibold text-mm-text">{category.name}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Zones */}
        <div className="mb-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-mm-text-muted">
            Fase de zonas
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-mm-text-faint">{groupA.group.name}</p>
                <RecalcButton slug={slug} />
              </div>
              <ZoneAdmin data={groupA} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-mm-text-faint">{groupB.group.name}</p>
                <RecalcButton slug={slug} />
              </div>
              <ZoneAdmin data={groupB} />
            </div>
          </div>
        </div>

        {/* Knockout */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-mm-text-muted">
            Cuadro final
          </h2>
          <KnockoutAdmin
            knockoutMatches={knockoutMatches}
            participants={allParticipants}
            categoryId={category.id}
          />
        </div>
      </main>
    </div>
  )
}
