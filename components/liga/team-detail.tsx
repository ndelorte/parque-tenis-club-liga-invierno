"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronDown,
  Crown,
  Users,
  Trophy,
  CalendarClock,
  CheckCircle2,
  XCircle,
  Snowflake,
  MapPin,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"
import type { TeamDetail } from "@/lib/team-detail-types"

export function TeamDetailView({ team }: { team: TeamDetail }) {
  const [open, setOpen] = useState<number | null>(0)

  const winRate =
    team.stats.played > 0
      ? Math.round((team.stats.won / team.stats.played) * 100)
      : 0

  const stats = [
    { label: "Posición", value: `${team.stats.position}º`, accent: "accent" },
    { label: "Puntos", value: team.stats.points, accent: "primary" },
    { label: "PJ", value: team.stats.played, accent: "winter" },
    { label: "Ganados", value: team.stats.won, accent: "primary" },
    { label: "Perdidos", value: team.stats.lost, accent: "winter" },
    { label: "Efectividad", value: `${winRate}%`, accent: "accent" },
  ] as const

  return (
    <div className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-winter/15 via-background to-background"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-10 -z-10 size-72 rounded-full bg-winter/20 blur-3xl"
      />

      {/* Hero header */}
      <header className="relative isolate overflow-hidden bg-primary text-primary-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-winter/30 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-12">
          <Link
            href={team.categorySlug ? `/liga-invierno?categoria=${team.categorySlug}` : "/liga-invierno"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground/80 transition-colors hover:text-primary-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a {team.categoryLabel}
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-accent font-heading text-2xl font-extrabold text-accent-foreground shadow-lg ring-4 ring-primary-foreground/10">
              {team.name.charAt(0)}
            </span>
            <div>
              <Badge className="gap-1 bg-winter text-winter-foreground hover:bg-winter">
                <Snowflake className="size-3" />
                {team.categoryLabel}
              </Badge>
              <h1 className="mt-2 text-balance font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                {team.name}
              </h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary-foreground/80">
                <Crown className="size-4 text-accent" />
                Capitán: {team.captain}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-2xl border bg-card p-3 text-center shadow-sm",
                s.accent === "accent" && "border-t-2 border-t-accent",
                s.accent === "primary" && "border-t-2 border-t-primary",
                s.accent === "winter" && "border-t-2 border-t-winter",
              )}
            >
              <p className="font-heading text-2xl font-extrabold text-foreground">
                {s.value}
              </p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Roster */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Users className="size-5" />
              </span>
              Lista de buena fe
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {team.roster.map((player) => {
              const isCaptain = player === team.captain
              return (
                <div
                  key={player}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5",
                    isCaptain && "border-accent/40 bg-accent/5",
                  )}
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {player.charAt(0)}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {player}
                  </span>
                  {isCaptain && (
                    <Badge className="ml-auto gap-1 bg-accent text-accent-foreground hover:bg-accent">
                      <Crown className="size-3" />
                      Capitán
                    </Badge>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Fechas jugadas */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Trophy className="size-5" />
              </span>
              Fechas jugadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.played.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no hay fechas jugadas.
              </p>
            )}
            {team.played.map((d, i) => {
              const isOpen = open === i
              const won = d.result === "win"
              return (
                <div
                  key={i}
                  className={cn(
                    "overflow-hidden rounded-2xl border",
                    won
                      ? "border-l-4 border-l-primary border-border"
                      : "border-l-4 border-l-destructive border-border",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                  >
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        won
                          ? "bg-primary/15 text-primary"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {won ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        <XCircle className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-sm font-bold text-foreground">
                        {d.round} · vs {d.opponent}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(d.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          won
                            ? "bg-primary text-primary-foreground hover:bg-primary"
                            : "bg-destructive text-destructive-foreground hover:bg-destructive",
                        )}
                      >
                        {won ? "Ganó" : "Perdió"} {d.courtsWon}-{d.courtsLost}
                      </Badge>
                      <ChevronDown
                        className={cn(
                          "size-5 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="space-y-2 border-t border-border bg-secondary/30 p-3">
                      {d.courts.map((c) => {
                        const teamWonCourt = c.winner === "home" === d.isHome
                        return (
                          <div
                            key={c.court}
                            className="rounded-xl border border-border bg-card p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <MapPin className="size-3.5 text-winter" />
                                Cancha {c.court}
                              </span>
                              {c.wo ? (
                                <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                                  W.O.
                                </Badge>
                              ) : (
                                <Badge
                                  className={cn(
                                    teamWonCourt
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {teamWonCourt ? "Ganada" : "Perdida"}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                              <PairCell
                                players={c.homePlayers}
                                winner={c.winner === "home"}
                              />
                              <span className="font-heading text-sm font-bold text-foreground">
                                {c.score}
                              </span>
                              <PairCell
                                players={c.awayPlayers}
                                winner={c.winner === "away"}
                                align="right"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Fixture pendiente */}
        <Card className="mt-6 overflow-hidden border-t-4 border-t-winter">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading">
              <span className="flex size-8 items-center justify-center rounded-xl bg-winter/15 text-winter">
                <CalendarClock className="size-5" />
              </span>
              Fixture pendiente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {team.pending.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay fechas pendientes por el momento.
              </p>
            )}
            {team.pending.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-border border-l-4 border-l-winter bg-winter/5 p-4"
              >
                <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-winter/15 text-winter">
                  <Snowflake className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading text-sm font-bold text-foreground">
                    {d.round} · vs {d.opponent}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(d.date)} · {d.time} hs
                  </p>
                </div>
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                  Por jugar
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
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
