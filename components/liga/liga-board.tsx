"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  CalendarClock,
  ListChecks,
  Users,
  Trophy,
  Snowflake,
  Sun,
  Medal,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import type { Category, Team, StandingsRow, CourtMatch } from "@/lib/tournament/types"
import type { RoundWithSeries } from "@/lib/data/series"
import type { ProvisionalBracket } from "@/lib/playoffs/types"
import type { PlayoffSeriesSimple } from "@/lib/data/playoffs"
import { teamHref } from "@/lib/tournament/seasonRoutes"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, formatDate } from "@/lib/utils"
import type { Season } from "@/components/liga/season-theme"
import { DialogSheet } from "@/components/liga/DialogSheet"

type CategoryBundle = {
  category: Category
  standings: StandingsRow[]
  rounds: RoundWithSeries[]
  teams: Team[]
  bracket: ProvisionalBracket | null
  playoffSeries: PlayoffSeriesSimple[]
}

type LigaBoardProps = {
  bundles: CategoryBundle[]
  initialCategory?: string
  seasonSlug: string
  season: Season
}

const TEAM_TINTS = [
  "bg-primary/15 text-primary",
  "liga-board-icon-soft",
  "bg-accent/15 text-accent",
]

function dateLabel(dateStr?: string, timeStr?: string): string {
  return formatDate(dateStr ?? "", { month: "short", utc: true, time: timeStr, emptyLabel: "Fecha a confirmar" })
}

export function LigaBoard({ bundles, initialCategory, seasonSlug, season }: LigaBoardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const SeasonIcon = season === "invierno" ? Snowflake : season === "verano" ? Sun : Trophy
  const defaultSlug = (initialCategory && bundles.some((b) => b.category.slug === initialCategory))
    ? initialCategory
    : (bundles[0]?.category.slug ?? "")
  const [activeSlug, setActiveSlug] = useState<string>(defaultSlug)

  // Sincroniza la categoría elegida con ?categoria= para que el link a una
  // categoría de esta edición sea compartible (no navega, solo reemplaza la URL).
  function selectCategory(slug: string) {
    setActiveSlug(slug)
    router.replace(`${pathname}?categoria=${slug}`, { scroll: false })
  }

  const activeBundle = bundles.find((b) => b.category.slug === activeSlug) ?? bundles[0]

  if (!activeBundle) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm text-muted-foreground">No hay categorías disponibles.</p>
      </section>
    )
  }

  const standings =
    activeBundle.standings.length > 0
      ? activeBundle.standings
      : activeBundle.teams.map((t, i) => ({
          team_id: t.id,
          team: t,
          played: 0,
          won: 0,
          lost: 0,
          points: 0,
          courts_won: 0,
          courts_lost: 0,
          courts_diff: 0,
          sets_won: 0,
          sets_lost: 0,
          sets_diff: 0,
          games_won: 0,
          games_lost: 0,
          games_diff: 0,
          position: i + 1,
        }))

  const allSeries = activeBundle.rounds.flatMap((r) =>
    r.series.map((s) => ({ ...s, roundName: r.name })),
  )

  const regularSeries = activeBundle.rounds
    .filter((r) => r.phase === "regular")
    .flatMap((r) => r.series.map((s) => ({ ...s, roundName: r.name })))

  const played = allSeries
    .filter((s) => s.status === "completed" || s.status === "walkover")
    .sort((a, b) => (b.scheduled_date ?? "").localeCompare(a.scheduled_date ?? ""))

  // Primer round regular con al menos una serie sin terminar
  const nextRound = [...activeBundle.rounds]
    .filter((r) => r.phase === "regular")
    .sort((a, b) => a.round_number - b.round_number)
    .find((r) =>
      r.series.some(
        (s) => s.status !== "completed" && s.status !== "walkover" && s.status !== "cancelled",
      ),
    )
  const nextRoundSeries = nextRound
    ? nextRound.series.map((s) => ({ ...s, roundName: nextRound.name }))
    : []

  return (
    <section className="liga-board" data-identity={season === "neutro" ? undefined : `liga-${season}`}>
      <div className="liga-board-content mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Category selector */}
        <div className="liga-board-categories">
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <SeasonIcon className="liga-board-accent-icon size-5" aria-hidden="true" />
            Categorías
          </h2>
          <div className="liga-board-category-list mt-4 flex flex-wrap gap-2">
            {bundles.map((b) => (
              <button
                key={b.category.slug}
                type="button"
                onClick={() => selectCategory(b.category.slug)}
                aria-pressed={activeSlug === b.category.slug}
                className={cn(
                  "liga-board-category min-h-11 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  activeSlug === b.category.slug
                    ? "bg-board text-board-foreground ring-board"
                    : "bg-card text-secondary-foreground ring-border",
                )}
              >
                {b.category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Standings */}
          <div className="liga-board-panel border-t-4 border-t-accent p-6 lg:col-span-2">
            <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 font-heading text-lg font-bold text-foreground">
              <Trophy aria-hidden="true" className="size-5 text-accent" />
              Tabla de posiciones
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Equipo</TableHead>
                    <TableHead className="text-center" title="Puntos">P</TableHead>
                    <TableHead className="text-center" title="Partidos Jugados">PJ</TableHead>
                    <TableHead className="text-center" title="Partidos Ganados">PG</TableHead>
                    <TableHead className="text-center" title="Diferencia de Parciales (canchas)">DP</TableHead>
                    <TableHead className="text-center" title="Diferencia de Sets">DS</TableHead>
                    <TableHead className="text-center" title="Diferencia de Games">DG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((r) => (
                    <TableRow
                      key={r.team_id}
                      className={cn(
                        r.position === 1 && "bg-accent/5",
                        r.position <= 3 && "font-medium",
                      )}
                    >
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full text-xs font-bold tabular-nums",
                            podiumClass(r.position),
                          )}
                        >
                          {r.position}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          {r.position <= 3 && (
                            <Medal aria-hidden="true" className={cn("size-4", podiumIcon(r.position))} />
                          )}
                          {r.team.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        <span className="inline-flex min-w-7 justify-center rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                          {r.points}
                        </span>
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {r.played}
                      </TableCell>
                      <TableCell className="text-center tabular-nums text-muted-foreground">
                        {r.won}
                      </TableCell>
                      <TableCell className={cn("text-center tabular-nums font-medium", r.courts_diff > 0 ? "text-primary" : r.courts_diff < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {r.courts_diff > 0 ? `+${r.courts_diff}` : r.courts_diff}
                      </TableCell>
                      <TableCell className={cn("text-center tabular-nums font-medium", r.sets_diff > 0 ? "text-primary" : r.sets_diff < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {r.sets_diff > 0 ? `+${r.sets_diff}` : r.sets_diff}
                      </TableCell>
                      <TableCell className={cn("text-center tabular-nums font-medium", r.games_diff > 0 ? "text-primary" : r.games_diff < 0 ? "text-destructive" : "text-muted-foreground")}>
                        {r.games_diff > 0 ? `+${r.games_diff}` : r.games_diff}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              P: puntos · PJ: partidos jugados · PG: ganados · DP: dif. de parciales · DS: dif. de sets · DG: dif. de games
            </p>
          </div>

          {/* Next round */}
          <div className="liga-board-panel liga-board-accent-border border-t-4 p-6">
            <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 font-heading text-lg font-bold text-foreground">
              <CalendarClock aria-hidden="true" className="liga-board-accent-icon size-5" />
              Próxima fecha
            </h3>
            <div className="space-y-3">
              {nextRound && (
                <Badge className="liga-board-date-badge gap-1">
                  <SeasonIcon className="size-3" aria-hidden="true" />
                  {nextRound.name}
                </Badge>
              )}
              {nextRoundSeries.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay series programadas por el momento.
                </p>
              )}
              {nextRoundSeries.map((s) => (
                <div
                  key={s.id}
                  className="liga-board-next-series rounded-md border border-border border-l-4 p-3"
                >
                  <div className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                    <span className="text-pretty">{s.home_team?.name ?? s.home_team_id}</span>
                    <span className="text-xs font-normal text-muted-foreground">vs</span>
                    <span className="text-pretty text-right">{s.away_team?.name ?? s.away_team_id}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {dateLabel(s.scheduled_date, s.scheduled_time?.slice(0, 5))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All results */}
        <div className="liga-board-panel mt-6 border-t-4 border-t-primary p-6">
          <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 font-heading text-lg font-bold text-foreground">
            <ListChecks aria-hidden="true" className="size-5 text-primary" />
            Todos los resultados
          </h3>
          <div className="space-y-3">
            {played.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay fechas jugadas en esta categoría.
              </p>
            )}
            {played.map((s) => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        </div>

        {/* Fixture */}
        <div className="liga-board-panel liga-board-accent-border mt-6 border-t-4 p-6">
          <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 font-heading text-lg font-bold text-foreground">
            <CalendarClock aria-hidden="true" className="liga-board-accent-icon size-5" />
            Fixture
          </h3>
          {regularSeries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin fixture cargado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ronda / Horario</TableHead>
                    <TableHead>Serie</TableHead>
                    <TableHead className="text-center">Canchas</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regularSeries.map((s) => {
                    const isDone = s.status === "completed" || s.status === "walkover"
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">
                          <p className="font-medium text-foreground">{s.roundName}</p>
                          <p className="text-xs text-muted-foreground">
                            {dateLabel(s.scheduled_date, s.scheduled_time?.slice(0, 5))}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {s.home_team?.name ?? s.home_team_id}{" "}
                          <span className="text-muted-foreground">vs</span>{" "}
                          {s.away_team?.name ?? s.away_team_id}
                        </TableCell>
                        <TableCell className="text-center text-sm font-semibold tabular-nums text-foreground">
                          {isDone
                            ? s.is_general_walkover
                              ? "WO"
                              : `${s.home_courts_won ?? 0}–${s.away_courts_won ?? 0}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {isDone ? (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">
                              Jugada
                            </Badge>
                          ) : (
                            <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                              Por jugar
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Teams */}
        <div className="liga-board-panel mt-6 border-t-4 border-t-accent p-6">
          <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 font-heading text-lg font-bold text-foreground">
            <Users aria-hidden="true" className="size-5 text-accent" />
            Equipos participantes
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeBundle.teams.map((t, i) => (
              <Link
                key={t.id}
                href={teamHref(seasonSlug, activeBundle.category.slug, t.slug)}
                className="liga-board-team-link group flex min-h-11 items-start gap-3 rounded-md border border-border bg-card p-4 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full font-heading text-sm font-bold",
                    TEAM_TINTS[i % TEAM_TINTS.length],
                  )}
                >
                  {t.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-heading font-bold text-foreground">
                    {t.name}
                    <ChevronRight aria-hidden="true" className="liga-board-team-chevron size-4 shrink-0 text-muted-foreground" />
                  </p>
                  {t.captain_name && (
                    <p className="mt-1 text-sm text-muted-foreground">{t.captain_name}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Playoff bracket */}
        {activeBundle.bracket && (
          <BracketCard bracket={activeBundle.bracket} playoffSeries={activeBundle.playoffSeries} />
        )}
      </div>
    </section>
  )
}

function BracketCard({
  bracket,
  playoffSeries,
}: {
  bracket: ProvisionalBracket
  playoffSeries: PlayoffSeriesSimple[]
}) {
  const isFiveTeam = bracket.format === "five_team"

  // 6 equipos: qfTop = QF[1] (4°vs5°) feed SF1, qfBottom = QF[0] (3°vs6°) feed SF2
  // 5 equipos: qfTop = QF[0] (4°vs5°) feed SF1, no hay qfBottom (SF2 = bye[1] vs bye[2])
  const qfTop = isFiveTeam ? bracket.quarterfinals[0] : bracket.quarterfinals[1]
  const qfBottom = isFiveTeam ? null : bracket.quarterfinals[0]

  const allTeams = [
    ...bracket.byes.map((b) => b.team),
    ...bracket.quarterfinals.flatMap((qf) => [qf.home.team, qf.away.team]),
  ]
  const teamName = (id?: string) => allTeams.find((t) => t.id === id)?.name

  const qfTopWinnerName = qfTop.winnerTeamId ? teamName(qfTop.winnerTeamId) : undefined
  const qfBottomWinnerName = qfBottom?.winnerTeamId ? teamName(qfBottom.winnerTeamId) : undefined

  // Series SF y Final
  const sfSeries = playoffSeries.filter((s) => s.phase === "semifinal")
  const finalSeries = playoffSeries.find((s) => s.phase === "final")
  const thirdPlaceSeries = playoffSeries.find((s) => s.phase === "third_place")

  // SF1: la serie donde el local es el 1° seed (bye[0])
  const sf1 = sfSeries.find((s) => s.home_team_id === bracket.byes[0].team.id || s.away_team_id === bracket.byes[0].team.id)
  // SF2: la serie donde el visitante es el 2° seed (bye[1])
  const sf2 = sfSeries.find(
    (s) => s.id !== sf1?.id && (s.home_team_id === bracket.byes[1].team.id || s.away_team_id === bracket.byes[1].team.id),
  ) ?? sfSeries.find((s) => s.id !== sf1?.id)

  // Ganadores de SF para mostrar en Final
  const sf1WinnerName = sf1?.winner_team_id ? teamName(sf1.winner_team_id) : undefined
  const sf2WinnerName = sf2?.winner_team_id ? teamName(sf2.winner_team_id) : undefined

  // Perdedores de SF para mostrar en 3er puesto
  const sf1LoserId = sf1?.winner_team_id
    ? (sf1.home_team_id === sf1.winner_team_id ? sf1.away_team_id : sf1.home_team_id)
    : undefined
  const sf2LoserId = sf2?.winner_team_id
    ? (sf2.home_team_id === sf2.winner_team_id ? sf2.away_team_id : sf2.home_team_id)
    : undefined
  const sf1LoserName = sf1LoserId ? teamName(sf1LoserId) : undefined
  const sf2LoserName = sf2LoserId ? teamName(sf2LoserId) : undefined

  return (
    <div className="liga-board-panel mt-6 border-t-4 border-t-accent p-6">
      <h3 className="mb-4 flex items-center gap-2 border-b border-border pb-3 font-heading text-lg font-bold text-foreground">
        <Trophy aria-hidden="true" className="size-5 text-accent" />
        Fase Final — Cuadro provisorio
      </h3>
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="mx-auto min-w-[780px] max-w-5xl">
          {/* Bracket principal: QF → SF → Final */}
          <div className="grid grid-cols-[minmax(250px,1fr)_56px_minmax(250px,1fr)_56px_minmax(250px,1fr)] grid-rows-[auto_1fr_1fr] gap-y-5">
            <div className="col-start-1 row-start-1">
              <RoundLabel label="Cuartos de Final" />
            </div>
            <div className="col-start-3 row-start-1">
              <RoundLabel label="Semifinales" />
            </div>
            <div className="col-start-5 row-start-1">
              <RoundLabel label="Final" />
            </div>

            <div className="col-start-1 row-start-2 flex min-h-[176px] flex-col justify-center gap-1.5">
              <ByePill slot={bracket.byes[0]} />
              <QFMatchup qf={qfTop} />
            </div>
            <BracketConnector className="col-start-2 row-start-2" />
            <div className="col-start-3 row-start-2 flex min-h-[176px] items-center">
              <SFMatchup
                label="SF 1"
                home={{ name: bracket.byes[0].team.name, seed: 1, known: true }}
                away={{ name: qfTopWinnerName ?? "Ganador CF 1", known: !!qfTopWinnerName }}
                series={sf1}
              />
            </div>

            <div className="col-start-1 row-start-3 flex min-h-[176px] flex-col justify-center gap-1.5">
              {isFiveTeam ? (
                <>
                  <ByePill slot={bracket.byes[1]} />
                  <ByePill slot={bracket.byes[2]} />
                </>
              ) : (
                <>
                  <QFMatchup qf={qfBottom!} />
                  <ByePill slot={bracket.byes[1]} />
                </>
              )}
            </div>
            <BracketConnector className="col-start-2 row-start-3" />
            <div className="col-start-3 row-start-3 flex min-h-[176px] items-center">
              <SFMatchup
                label="SF 2"
                home={
                  isFiveTeam
                    ? { name: bracket.byes[1].team.name, seed: 2, known: true }
                    : { name: qfBottomWinnerName ?? "Ganador CF 2", known: !!qfBottomWinnerName }
                }
                away={
                  isFiveTeam
                    ? { name: bracket.byes[2].team.name, seed: 3, known: true }
                    : { name: bracket.byes[1].team.name, seed: 2, known: true }
                }
                series={sf2}
              />
            </div>

            <div className="col-start-4 row-span-2 row-start-2 flex items-center">
              <div className="h-px w-full border-t-2 border-dashed border-border" />
            </div>
            <div className="col-start-5 row-span-2 row-start-2 flex items-center">
              <SFMatchup
                label="Final"
                home={{ name: sf1WinnerName ?? "Ganador SF 1", known: !!sf1WinnerName }}
                away={{ name: sf2WinnerName ?? "Ganador SF 2", known: !!sf2WinnerName }}
                series={finalSeries}
              />
            </div>
          </div>

          {/* 3er y 4to puesto — desconectado, alineado a la derecha */}
          <div className="mt-6 flex justify-end">
            <div className="w-[minmax(250px,1fr)] min-w-[250px] max-w-[calc(100%/3-38px)]">
              <div className="mb-2 flex items-center gap-2">
                <Medal aria-hidden="true" className="size-3.5 text-pending" />
                <RoundLabel label="3er y 4to Puesto" />
              </div>
              <SFMatchup
                label="3° / 4°"
                home={{ name: sf1LoserName ?? "Perdedor SF 1", known: !!sf1LoserName }}
                away={{ name: sf2LoserName ?? "Perdedor SF 2", known: !!sf2LoserName }}
                series={thirdPlaceSeries}
              />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Cuadro provisorio según posiciones actuales. Se actualiza con cada resultado.
      </p>
    </div>
  )
}

function BracketConnector({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <div className="h-px w-full border-t-2 border-dashed border-border" />
    </div>
  )
}

function RoundLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
  )
}

type SlotInfo = { name: string; seed?: number; known: boolean }

function SFMatchup({
  label,
  home,
  away,
  series,
}: {
  label: string
  home: SlotInfo
  away: SlotInfo
  series?: PlayoffSeriesSimple
}) {
  const isCompleted = series?.status === "completed" || series?.status === "walkover"
  const isScheduled = series?.status === "scheduled" || series?.status === "rescheduled"

  return (
    <div className={cn(
      "w-full space-y-2 rounded-md border px-4 py-3",
      isCompleted ? "border-l-4 border-l-primary border-border bg-primary/5" : "border-border bg-card",
    )}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="size-3" /> Jugado
          </span>
        )}
        {isScheduled && (
          <span className="inline-flex items-center gap-1 text-xs text-pending">
            <AlertCircle aria-hidden="true" className="size-3" /> Programado
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SFSlot slot={home} />
        <span className="text-xs text-muted-foreground">vs</span>
        <SFSlot slot={away} />
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock aria-hidden="true" className="size-3.5 shrink-0" />
        {series?.scheduled_date ? (
          <span className="tabular-nums">
            {series.scheduled_date.split("-").reverse().join("/")}
            {series.scheduled_time ? ` · ${series.scheduled_time.slice(0, 5)} hs` : ""}
          </span>
        ) : (
          <span className="italic">Fecha a confirmar</span>
        )}
      </div>
    </div>
  )
}

function SFSlot({ slot }: { slot: SlotInfo }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-sm",
      slot.known ? "font-semibold text-foreground" : "italic text-muted-foreground",
    )}>
      {slot.seed && <SeedBadge seed={slot.seed} small />}
      <span className="max-w-[130px] truncate sm:max-w-none">{slot.name}</span>
    </span>
  )
}

function ByePill({ slot }: { slot: ProvisionalBracket["byes"][0] }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-2.5">
      <SeedBadge seed={slot.seed} small />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
        {slot.team.name}
      </span>
      <Badge className="shrink-0 bg-primary/10 text-xs text-primary hover:bg-primary/10">
        BYE → SF
      </Badge>
    </div>
  )
}

function QFMatchup({ qf }: { qf: ProvisionalBracket["quarterfinals"][0] }) {
  const isCompleted = qf.status === "completed" || qf.status === "walkover"
  const isScheduled = qf.status === "scheduled"

  return (
    <div className="flex items-stretch">
      {/* Team pills */}
      <div className="flex flex-1 flex-col gap-1.5">
        <BracketTeamPill slot={qf.home} winnerId={qf.winnerTeamId} done={isCompleted} />
        <BracketTeamPill slot={qf.away} winnerId={qf.winnerTeamId} done={isCompleted} />
      </div>

      {/* Bracket "]" connector */}
      <div className="flex w-5 flex-col">
        <div className="flex-1 rounded-tr-md border-r-2 border-t-2 border-border" />
        <div className="flex-1 rounded-br-md border-r-2 border-b-2 border-border" />
      </div>

      {/* Info */}
      <div className="flex w-28 shrink-0 flex-col items-start justify-center gap-0.5 pl-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Cuartos
        </span>
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="size-3" /> Jugado
          </span>
        ) : isScheduled ? (
          <>
            <span className="inline-flex items-center gap-1 text-xs text-pending">
              <AlertCircle aria-hidden="true" className="size-3" /> Programado
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {qf.scheduledDate
                ? `${qf.scheduledDate.split("-").slice(1).reverse().join("/")}${qf.scheduledTime ? ` · ${qf.scheduledTime.slice(0, 5)} hs` : ""}`
                : "Fecha a confirmar"}
            </span>
          </>
        ) : (
          <span className="text-xs italic text-muted-foreground">Por definir</span>
        )}
      </div>
    </div>
  )
}

function BracketTeamPill({
  slot,
  winnerId,
  done,
}: {
  slot: ProvisionalBracket["quarterfinals"][0]["home"]
  winnerId?: string
  done: boolean
}) {
  const isWinner = winnerId === slot.team.id
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2.5",
        isWinner
          ? "border-primary/40 bg-primary/5"
          : done
          ? "border-border bg-card opacity-50"
          : "border-border bg-card",
      )}
    >
      <SeedBadge seed={slot.seed} small />
      <span
        className={cn(
          "flex-1 truncate text-sm",
          isWinner ? "font-bold text-primary" : "font-medium text-foreground",
        )}
      >
        {slot.team.name}
        {isWinner && <span className="sr-only">, ganó</span>}
      </span>
      {isWinner && <Trophy aria-hidden="true" className="size-3.5 shrink-0 text-primary" />}
    </div>
  )
}

function SeedBadge({ seed, small }: { seed: number; small?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-bold tabular-nums text-muted-foreground",
        small ? "size-5 text-[10px]" : "size-6 text-xs",
      )}
    >
      {seed}°
    </span>
  )
}

function podiumClass(pos: number) {
  if (pos === 1) return "bg-board text-board-foreground"
  if (pos === 2) return "bg-walkover-soft text-walkover"
  if (pos === 3) return "bg-pending-soft text-pending"
  return "bg-secondary text-secondary-foreground"
}

function podiumIcon(pos: number) {
  if (pos === 1) return "text-primary"
  if (pos === 2) return "text-walkover"
  if (pos === 3) return "text-pending"
  return "text-muted-foreground"
}

type SeriesWithRound = {
  id: string
  home_team?: Team
  away_team?: Team
  home_team_id: string
  away_team_id: string
  home_courts_won?: number
  away_courts_won?: number
  winner_team_id?: string
  walkover_winner_team_id?: string
  is_general_walkover: boolean
  status: string
  scheduled_date?: string
  roundName: string
  court_matches: CourtMatch[]
}

function SeriesCard({ series }: { series: SeriesWithRound }) {
  // Solo se marca un ganador si la serie efectivamente tiene uno cargado
  // (evita pintar al "visitante" como ganador por default cuando no hay
  // resultado todavía).
  const hasWinner = Boolean(series.winner_team_id || series.walkover_winner_team_id)
  const homeWon = hasWinner && (
    series.winner_team_id === series.home_team_id ||
    series.walkover_winner_team_id === series.home_team_id
  )
  const awayWon = hasWinner && (
    series.winner_team_id === series.away_team_id ||
    series.walkover_winner_team_id === series.away_team_id
  )

  const homeName = series.home_team?.name ?? series.home_team_id
  const awayName = series.away_team?.name ?? series.away_team_id
  const scoreLabel = series.is_general_walkover
    ? "WO"
    : `${series.home_courts_won ?? 0}–${series.away_courts_won ?? 0}`
  const sortedCourts = [...series.court_matches].sort((a, b) => a.court_number - b.court_number)

  return (
    <DialogSheet
      triggerClassName="liga-board-series-button flex min-h-11 w-full items-center gap-3 overflow-hidden rounded-md border border-border border-l-4 border-l-primary bg-card px-4 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      title={`${homeName} ${scoreLabel} ${awayName}`}
      description={`${series.roundName} · Detalle de canchas`}
      trigger={
        <>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ListChecks aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-heading text-sm font-bold text-foreground">
              <span className={cn(homeWon && "text-primary")}>{homeName}{homeWon && <span className="sr-only">, ganó</span>}</span>{" "}
              <span className="text-muted-foreground">vs</span>{" "}
              <span className={cn(awayWon && "text-primary")}>{awayName}{awayWon && <span className="sr-only">, ganó</span>}</span>
            </span>
            <span className="block text-xs text-muted-foreground">
              {series.roundName} · {dateLabel(series.scheduled_date)}
            </span>
          </span>
          <Badge className="bg-primary text-primary-foreground hover:bg-primary tabular-nums">{scoreLabel}</Badge>
        </>
      }
    >
      {sortedCourts.length > 0 ? (
        <div className="space-y-2">
          {sortedCourts.map((cm) => (
            <CourtRow key={cm.id} court={cm} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Sin detalle de canchas.</p>
      )}
    </DialogSheet>
  )
}

function CourtRow({ court }: { court: CourtMatch }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin aria-hidden="true" className="size-3.5 text-accent" />
          Cancha {court.court_number}
        </span>
        {court.is_court_walkover && (
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">W.O.</Badge>
        )}
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
        <div>
          {court.home_player_1 && (
            <p className="truncate font-medium text-foreground">{court.home_player_1.display_name}</p>
          )}
          {court.home_player_2 && (
            <p className="truncate font-medium text-foreground">{court.home_player_2.display_name}</p>
          )}
        </div>
        <span className="font-heading text-sm font-bold tabular-nums text-foreground">
          {court.score ?? "—"}
        </span>
        <div className="text-right">
          {court.away_player_1 && (
            <p className="truncate font-medium text-foreground">{court.away_player_1.display_name}</p>
          )}
          {court.away_player_2 && (
            <p className="truncate font-medium text-foreground">{court.away_player_2.display_name}</p>
          )}
        </div>
      </div>
    </div>
  )
}
