import Link from "next/link"
import { ArrowLeft, Crown } from "lucide-react"
import type { TeamDetail } from "@/lib/team-detail-types"
import { categoryHref } from "@/lib/tournament/seasonRoutes"
import { formatDate } from "@/lib/utils"
import { seasonFromSlug } from "./season-theme"
import { PlayedDateCard } from "./PlayedDateCard"

function dateLabel(value: string) {
  return formatDate(value, { month: "short", utc: true, emptyLabel: "Fecha a confirmar" })
}

export function TeamDetailView({ team }: { team: TeamDetail }) {
  const season = seasonFromSlug(team.seasonSlug)
  const winRate = team.stats.played > 0 ? Math.round((team.stats.won / team.stats.played) * 100) : 0
  const stats = [
    ["Posición", team.stats.position ? `${team.stats.position}° / ${team.stats.totalTeams}` : "—"],
    ["Puntos", String(team.stats.points)],
    ["Jugados", String(team.stats.played)],
    ["Ganados", String(team.stats.won)],
    ["Perdidos", String(team.stats.lost)],
    ["Efectividad", `${winRate}%`],
    ["Canchas", `${team.stats.courtsFor}–${team.stats.courtsAgainst}`],
  ]
  return <main data-identity={season === "neutro" ? undefined : `liga-${season}`} className="min-h-screen bg-background">
    <header className="liga-team-header" data-identity={season === "neutro" ? undefined : `liga-${season}`}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link href={categoryHref(team.seasonSlug, team.categorySlug)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"><ArrowLeft aria-hidden="true" className="size-4" /> {team.categoryLabel}</Link>
        <p className="liga-team-kicker mt-5 text-xs font-bold uppercase tracking-[0.2em]">Temporada de {season === "neutro" ? "Liga" : season} · Equipo</p>
        <h1 className="mt-1 font-heading text-4xl font-extrabold text-balance text-foreground sm:text-6xl">{team.name}</h1>
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground"><Crown aria-hidden="true" className="size-4 text-primary" /> Capitán: <strong className="text-foreground">{team.captain}</strong></p>
      </div>
    </header>
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <section aria-label="Números del equipo" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stats.map(([label, value]) => <div key={label} className="border-t-2 border-primary bg-card p-4"><p className="font-heading text-2xl font-extrabold tabular-nums text-foreground">{value}</p><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p></div>)}
      </section>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-10">
          <section><h2 className="mb-4 border-b border-border pb-3 font-heading text-2xl font-bold">Fechas jugadas</h2>
            {team.played.length === 0 ? <p className="text-sm text-muted-foreground">Todavía no hay fechas jugadas.</p> : <div className="space-y-2">
              {team.played.map((date, index) => <PlayedDateCard key={`${date.round}-${index}`} date={date} label={dateLabel(date.date)} />)}
            </div>}
          </section>
          <section><h2 className="mb-4 border-b border-border pb-3 font-heading text-2xl font-bold">Próximas fechas</h2>
            {team.pending.length === 0 ? <p className="text-sm text-muted-foreground">No hay fechas pendientes por el momento.</p> : <ul className="space-y-2">{team.pending.map((date, index) => <li key={`${date.round}-${index}`} className="flex min-h-16 flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-4 py-3"><span><span className="block text-xs text-muted-foreground">{date.round}</span><strong className="font-heading">vs {date.opponent}</strong></span><span className="text-sm font-semibold tabular-nums text-primary">{dateLabel(date.date)}{date.time !== "—" ? ` · ${date.time.slice(0, 5)} hs` : ""}</span></li>)}</ul>}
          </section>
        </div>
        <aside><h2 className="mb-4 border-b border-border pb-3 font-heading text-2xl font-bold">Lista de buena fe</h2><p className="mb-3 text-sm text-muted-foreground">{team.roster.length} jugadores</p><ol className="divide-y divide-border">{team.roster.map((name, index) => <li key={`${name}-${index}`} className="flex min-h-11 items-center justify-between gap-2 py-2 text-sm"><span>{name}</span>{name === team.captain && <span className="text-xs font-bold text-primary">Capitán</span>}</li>)}</ol></aside>
      </div>
    </div>
  </main>
}
