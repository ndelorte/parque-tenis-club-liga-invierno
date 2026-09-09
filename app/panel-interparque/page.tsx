import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, ClipboardList, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getInterparqueMatches, getInterparquePlayers } from "@/lib/data/interparque"
import { signOutInterparque } from "@/app/actions/interparque"
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
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-brand text-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <ClipboardList className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold leading-tight">
              Panel de carga
            </p>
            <p className="text-xs text-white/70">Interparque</p>
          </div>
          <Badge className="ml-auto bg-accent text-accent-foreground hover:bg-accent">
            Admin
          </Badge>
          <form action={signOutInterparque}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </form>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="hidden bg-white text-brand hover:bg-white/90 sm:inline-flex"
          >
            <Link href="/interparque">
              <ArrowLeft className="size-4" />
              Ver Interparque
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Partidos de Interparque
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cargá jugadores nuevos, partidos y resultados. La tabla de posiciones se
            calcula sola a partir de los resultados cargados.
          </p>
        </div>

        <div className="mb-6">
          <NewMatchForm initialPlayers={players} />
        </div>

        {matches.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Todavía no hay partidos cargados.
          </p>
        ) : (
          <div className="space-y-5">
            {Array.from(groups.entries()).map(([dateKey, dateMatches]) => (
              <div key={dateKey} className="overflow-hidden rounded-lg border border-border bg-white">
                <div className="border-b border-border bg-muted/50 px-4 py-2">
                  <p className="text-sm font-semibold capitalize text-foreground">
                    {fmtGroupDate(dateKey)}
                  </p>
                </div>
                {dateMatches.map((match) => (
                  <MatchForm key={match.id} match={match} players={players} />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
