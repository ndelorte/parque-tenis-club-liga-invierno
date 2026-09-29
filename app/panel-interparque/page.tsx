import type { Metadata } from "next"
import { ClipboardList } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { AdminShell, AdminPageHeader } from "@/components/admin/admin-shell"
import { EmptyState } from "@/components/admin/states"
import { getInterparqueMatches, getInterparquePlayers } from "@/lib/data/interparque"
import { MatchForm } from "@/components/admin/interparque/MatchForm"
import { NewMatchForm } from "@/components/admin/interparque/NewMatchForm"
import type { InterparqueMatch } from "@/lib/data/interparque"

export const metadata: Metadata = {
  title: "Panel de carga | Interparque",
  description: "Dashboard interno para cargar partidos y resultados de Interparque.",
}

function groupByDate(matches: InterparqueMatch[]) {
  const groups = new Map<string, InterparqueMatch[]>()
  for (const match of matches) {
    const key = match.match_date ?? "Sin fecha"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(match)
  }
  return groups
}

function fmtGroupDate(key: string) {
  if (key === "Sin fecha") return key
  const dt = new Date(key + "T12:00:00")
  return dt.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
}

export default async function PanelInterparquePage() {
  const [matches, players] = await Promise.all([
    getInterparqueMatches(),
    getInterparquePlayers(),
  ])

  const groups = groupByDate(matches)

  return (
    <AdminShell
      panel="interparque"
      context="Partidos entre alumnos"
      currentSection="nuevo-partido"
      publicHref="/interparque"
    >
      <AdminPageHeader
        title="Partidos de Interparque"
        lede="Cargá jugadores nuevos, partidos y resultados. La tabla de posiciones se calcula sola a partir de los resultados cargados."
      />

      <section id="nuevo-partido" aria-labelledby="nuevo-partido-titulo" className="scroll-mt-32">
        <h2 id="nuevo-partido-titulo" className="mb-2 mt-[22px] font-heading text-xl font-bold uppercase">
          Nuevo partido
        </h2>
        <NewMatchForm initialPlayers={players} />
      </section>

      <section id="partidos" aria-labelledby="partidos-titulo" className="scroll-mt-32">
        <h2 id="partidos-titulo" className="mb-2 mt-[22px] font-heading text-xl font-bold uppercase">
          Partidos cargados
        </h2>
        {matches.length === 0 ? (
          <EmptyState
            title="Todavía no hay partidos cargados"
            icon={ClipboardList}
            action={
              <a href="#nuevo-partido" className={buttonVariants({ className: "min-h-11 bg-accent px-4 text-[15px] font-bold text-accent-foreground hover:bg-accent-dark" })}>
                Cargar partido
              </a>
            }
          >
            Cuando cargues el primero aparece acá, agrupado por fecha. La tabla de posiciones se calcula sola.
          </EmptyState>
        ) : (
          <div className="space-y-5">
            {Array.from(groups.entries()).map(([dateKey, dateMatches]) => (
              <div key={dateKey} className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="border-b border-border bg-surface px-4 py-2">
                  <p className="font-bold capitalize text-foreground">{fmtGroupDate(dateKey)}</p>
                </div>
                {dateMatches.map((match) => (
                  <MatchForm key={match.id} match={match} players={players} />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  )
}
