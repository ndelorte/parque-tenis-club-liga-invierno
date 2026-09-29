import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { RefreshCw } from "lucide-react"
import { getMmActiveEdition, getMmCategoryAdminData } from "@/lib/data/mid-master"
import { normalizeType } from "@/lib/data/mid-master/types"
import { ZoneAdmin } from "@/components/admin/mid-master/ZoneAdmin"
import { KnockoutAdmin } from "@/components/admin/mid-master/KnockoutAdmin"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
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
        className="press inline-flex min-h-10 items-center gap-1.5 rounded-md border-[1.5px] border-border-strong bg-card px-3 text-sm font-bold transition-colors hover:border-foreground focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-accent"
        title="Actualizar tabla (standings se recalculan automáticamente)"
      >
        <RefreshCw className="size-3.5" aria-hidden />
        Actualizar tabla
      </button>
    </form>
  )
}

export default async function PanelMasterCategoryPage({ params }: Props) {
  const { slug } = await params
  const activeEdition = await getMmActiveEdition()
  if (!activeEdition) notFound()
  const data = await getMmCategoryAdminData(activeEdition.id, slug)
  if (!data) notFound()

  const { category, groupA, groupB, knockoutMatches, allParticipants } = data

  return (
    <AdminShell
      panel="circuito"
      context={`${activeEdition.name} ${activeEdition.year} · torneos mensuales`}
      currentSection="mid-master"
      publicHref={`/circuito-del-parque/especiales/${activeEdition.slug}/categorias/${slug}`}
    >
      <AdminPageHeader
        crumbs={[{ label: "Mid Master", href: "/panel-circuito" }, { label: category.name }]}
        title={category.name}
        lede={normalizeType(category.type) === "singles" ? "Singles" : "Dobles"}
      />

      {/* Zones */}
      <section className="mb-8">
        <h2 className="mb-3 font-heading text-xl font-bold uppercase">Fase de zonas</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-muted-foreground">{groupA.group.name}</p>
              <RecalcButton slug={slug} />
            </div>
            <ZoneAdmin data={groupA} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-muted-foreground">{groupB.group.name}</p>
              <RecalcButton slug={slug} />
            </div>
            <ZoneAdmin data={groupB} />
          </div>
        </div>
      </section>

      {/* Knockout */}
      <section>
        <h2 className="mb-3 font-heading text-xl font-bold uppercase">Cuadro final</h2>
        <KnockoutAdmin
          knockoutMatches={knockoutMatches}
          participants={allParticipants}
          categoryId={category.id}
        />
      </section>
    </AdminShell>
  )
}
