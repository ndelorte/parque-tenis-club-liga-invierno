"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarClock,
  ListChecks,
  Users,
  Trophy,
  Snowflake,
  Medal,
  ChevronRight,
  ChevronDown,
  MapPin,
} from "lucide-react"
import {
  CATEGORIES,
  LEAGUE,
  formatDate,
  seriesResult,
  type CategoryId,
  type Match,
} from "@/lib/liga"
import { slugify, getSeriesDetail, type CourtDetail } from "@/lib/equipos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const TEAM_TINTS = [
  "bg-primary/15 text-primary",
  "bg-winter/20 text-winter",
  "bg-accent/15 text-accent",
]

export function LigaBoard() {
  const [active, setActive] = useState<CategoryId>("cab-a")
  const data = LEAGUE[active]

  const upcoming = useMemo(
    () => data.matches.filter((m) => m.status === "upcoming"),
    [data],
  )
  const played = useMemo(
    () =>
      data.matches
        .filter((m) => m.status === "played")
        .sort((a, b) => b.date.localeCompare(a.date)),
    [data],
  )
  const nextDate = upcoming[0]?.date

  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-winter/15 via-background to-background"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-12 -z-10 size-72 rounded-full bg-winter/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-1/2 -z-10 size-72 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Category selector */}
        <div>
          <h2 className="flex items-center gap-2 font-heading text-xl font-bold text-foreground">
            <Snowflake className="size-5 text-winter" />
            Elegí tu categoría
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                aria-pressed={active === c.id}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition-all duration-200",
                  active === c.id
                    ? "scale-105 bg-primary text-primary-foreground ring-primary"
                    : "bg-card text-secondary-foreground ring-border hover:-translate-y-0.5 hover:bg-winter/10 hover:text-primary hover:ring-winter/40",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Standings */}
          <Card className="overflow-hidden border-t-4 border-t-accent lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <span className="flex size-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
                  <Trophy className="size-5" />
                </span>
                Tabla de posiciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Equipo</TableHead>
                      <TableHead className="text-center">PJ</TableHead>
                      <TableHead className="text-center">G</TableHead>
                      <TableHead className="text-center">P</TableHead>
                      <TableHead className="text-center">
                        <span title="Canchas a favor / en contra">Canchas</span>
                      </TableHead>
                      <TableHead className="text-center">Pts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.standings.map((r) => (
                      <TableRow
                        key={r.team}
                        className={cn(
                          r.pos === 1 && "bg-accent/5",
                          r.pos <= 3 && "font-medium",
                        )}
                      >
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex size-6 items-center justify-center rounded-full text-xs font-bold",
                              podiumClass(r.pos),
                            )}
                          >
                            {r.pos}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <span className="flex items-center gap-1.5">
                            {r.pos <= 3 && (
                              <Medal className={cn("size-4", podiumIcon(r.pos))} />
                            )}
                            {r.team}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {r.played}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {r.won}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {r.lost}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {r.courtsFor}:{r.courtsAgainst}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex min-w-7 justify-center rounded-md bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                            {r.points}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                PJ: jugados · G: ganados · P: perdidos · Canchas: a favor:en
                contra · Pts: 2 por serie ganada.
              </p>
            </CardContent>
          </Card>

          {/* Next round */}
          <Card className="overflow-hidden border-t-4 border-t-winter">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading">
                <span className="flex size-8 items-center justify-center rounded-xl bg-winter/15 text-winter">
                  <CalendarClock className="size-5" />
                </span>
                Próxima fecha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {nextDate && (
                <Badge className="gap-1 bg-winter text-winter-foreground hover:bg-winter">
                  <Snowflake className="size-3" />
                  {formatDate(nextDate)}
                </Badge>
              )}
              {upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay series programadas por el momento.
                </p>
              )}
              {upcoming.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border border-l-4 border-l-winter bg-winter/5 p-3"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {m.round}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                    <span className="text-pretty">{m.home}</span>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <span className="text-pretty text-right">{m.away}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* All results */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <ListChecks className="size-5" />
              </span>
              Todos los resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {played.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay fechas jugadas en esta categoría.
              </p>
            )}
            {played.map((m, i) => (
              <SeriesCard key={i} match={m} categoryId={active} />
            ))}
          </CardContent>
        </Card>

        {/* Fixture */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-winter">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-winter/15 text-winter">
                <CalendarClock className="size-5" />
              </span>
              Fixture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Serie</TableHead>
                    <TableHead className="text-center">Canchas</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.matches.map((m, i) => {
                    const res = seriesResult(m.courts)
                    return (
                      <TableRow key={i}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatDate(m.date)}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">
                          {m.home}{" "}
                          <span className="text-muted-foreground">vs</span>{" "}
                          {m.away}
                        </TableCell>
                        <TableCell className="text-center text-sm font-semibold text-foreground">
                          {m.status === "played" ? `${res.home}–${res.away}` : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.status === "played" ? (
                            <Badge
                              variant="secondary"
                              className="bg-primary/10 text-primary"
                            >
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
          </CardContent>
        </Card>

        {/* Teams */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Users className="size-5" />
              </span>
              Equipos participantes
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.teams.map((t, i) => (
              <Link
                key={t.name}
                href={`/liga-invierno/equipo/${slugify(t.name)}`}
                className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-winter/50 hover:shadow-md"
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
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-winter" />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t.players[0]} · {t.players[1]}
                  </p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function podiumClass(pos: number) {
  if (pos === 1) return "bg-amber-400 text-amber-950"
  if (pos === 2) return "bg-slate-300 text-slate-800"
  if (pos === 3) return "bg-orange-400 text-orange-950"
  return "bg-secondary text-secondary-foreground"
}

function podiumIcon(pos: number) {
  if (pos === 1) return "text-amber-500"
  if (pos === 2) return "text-slate-400"
  if (pos === 3) return "text-orange-500"
  return "text-muted-foreground"
}

function SeriesCard({
  match,
  categoryId,
}: {
  match: Match
  categoryId: CategoryId
}) {
  const [open, setOpen] = useState(false)
  const detail = getSeriesDetail(categoryId, match)
  const homeWon = detail.homeScore > detail.awayScore

  return (
    <div className="overflow-hidden rounded-2xl border border-border border-l-4 border-l-primary">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/50"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ListChecks className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-bold text-foreground">
            <span className={cn(homeWon && "text-primary")}>{match.home}</span>{" "}
            <span className="text-muted-foreground">vs</span>{" "}
            <span className={cn(!homeWon && "text-primary")}>{match.away}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {match.round} · {formatDate(match.date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary">
            {detail.homeScore}–{detail.awayScore}
          </Badge>
          <ChevronDown
            className={cn(
              "size-5 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-2 border-t border-border bg-secondary/30 p-3">
          {detail.courts.map((c) => (
            <CourtRow key={c.court} court={c} />
          ))}
        </div>
      )}
    </div>
  )
}

function CourtRow({ court }: { court: CourtDetail }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <MapPin className="size-3.5 text-winter" />
          Cancha {court.court}
        </span>
        {court.wo && (
          <Badge className="bg-accent text-accent-foreground hover:bg-accent">
            W.O.
          </Badge>
        )}
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <PairCell players={court.homePlayers} winner={court.winner === "home"} />
        <span className="font-heading text-sm font-bold text-foreground">
          {court.score}
        </span>
        <PairCell
          players={court.awayPlayers}
          winner={court.winner === "away"}
          align="right"
        />
      </div>
    </div>
  )
}

function PairCell({
  players,
  winner,
  align = "left",
}: {
  players: [string, string]
  winner: boolean
  align?: "left" | "right"
}) {
  return (
    <div className={cn(align === "right" && "text-right")}>
      {players.map((p) => (
        <p
          key={p}
          className={cn(
            "truncate text-xs",
            winner
              ? "font-bold text-foreground"
              : "font-medium text-muted-foreground",
          )}
        >
          {p}
        </p>
      ))}
    </div>
  )
}
