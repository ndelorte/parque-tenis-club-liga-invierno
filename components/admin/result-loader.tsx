"use client"

import { useMemo, useState } from "react"
import {
  Trophy,
  CalendarDays,
  Save,
  Check,
  CircleDot,
  ShieldAlert,
  MapPin,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORIES, LEAGUE, formatDate, type CategoryId } from "@/lib/liga"
import { cn } from "@/lib/utils"

type Side = "home" | "away"

type CourtForm = {
  homePlayers: [string, string]
  awayPlayers: [string, string]
  score: string
  winner: Side | null
  wo: boolean
}

type SeriesForm = {
  courts: [CourtForm, CourtForm, CourtForm]
  generalWo: Side | null
  saved: boolean
}

const RESERVES = ["Suplente A", "Suplente B"]

function rosterOf(categoryId: CategoryId, teamName: string): string[] {
  const team = LEAGUE[categoryId].teams.find((t) => t.name === teamName)
  if (!team) return [...RESERVES]
  return [...team.players, ...RESERVES]
}

function buildInitialSeries(
  categoryId: CategoryId,
  home: string,
  away: string,
  courts: (boolean | null)[],
): SeriesForm {
  const homeRoster = rosterOf(categoryId, home)
  const awayRoster = rosterOf(categoryId, away)
  const mk = (i: number): CourtForm => ({
    homePlayers: [
      homeRoster[i % homeRoster.length],
      homeRoster[(i + 1) % homeRoster.length],
    ],
    awayPlayers: [
      awayRoster[i % awayRoster.length],
      awayRoster[(i + 1) % awayRoster.length],
    ],
    score: "",
    winner: courts[i] === true ? "home" : courts[i] === false ? "away" : null,
    wo: false,
  })
  return { courts: [mk(0), mk(1), mk(2)], generalWo: null, saved: false }
}

export function ResultLoader() {
  const [categoryId, setCategoryId] = useState<CategoryId>("cab-a")

  const rounds = useMemo(() => {
    const seen = new Map<string, { round: string; date: string }>()
    for (const m of LEAGUE[categoryId].matches) {
      if (!seen.has(m.round)) seen.set(m.round, { round: m.round, date: m.date })
    }
    return Array.from(seen.values())
  }, [categoryId])

  const [round, setRound] = useState<string>(rounds[0]?.round ?? "")

  const activeRound = rounds.some((r) => r.round === round)
    ? round
    : rounds[0]?.round ?? ""

  const series = useMemo(
    () => LEAGUE[categoryId].matches.filter((m) => m.round === activeRound),
    [categoryId, activeRound],
  )

  const [forms, setForms] = useState<Record<string, SeriesForm>>({})

  function keyOf(home: string, away: string) {
    return `${categoryId}|${activeRound}|${home}|${away}`
  }

  function getForm(home: string, away: string, courts: (boolean | null)[]) {
    const k = keyOf(home, away)
    return forms[k] ?? buildInitialSeries(categoryId, home, away, courts)
  }

  function updateForm(
    home: string,
    away: string,
    courts: (boolean | null)[],
    updater: (prev: SeriesForm) => SeriesForm,
  ) {
    const k = keyOf(home, away)
    setForms((prev) => {
      const base = prev[k] ?? buildInitialSeries(categoryId, home, away, courts)
      return { ...prev, [k]: updater(base) }
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-primary">
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Trophy className="size-3.5 text-accent" />
              Categoría
            </Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v as CategoryId)}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-3.5 text-winter" />
              Fecha
            </Label>
            <Select value={activeRound} onValueChange={(v) => setRound(v ?? "")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((r) => (
                  <SelectItem key={r.round} value={r.round}>
                    {r.round} · {formatDate(r.date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {series.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay series para esta fecha.
        </p>
      )}

      {series.map((m) => (
        <SeriesEditor
          key={`${m.home}-${m.away}`}
          categoryId={categoryId}
          home={m.home}
          away={m.away}
          form={getForm(m.home, m.away, m.courts)}
          onChange={(updater) => updateForm(m.home, m.away, m.courts, updater)}
        />
      ))}
    </div>
  )
}

function previewScore(form: SeriesForm) {
  const home = form.courts.filter((c) => c.winner === "home").length
  const away = form.courts.filter((c) => c.winner === "away").length
  return { home, away }
}

function SeriesEditor({
  categoryId,
  home,
  away,
  form,
  onChange,
}: {
  categoryId: CategoryId
  home: string
  away: string
  form: SeriesForm
  onChange: (updater: (prev: SeriesForm) => SeriesForm) => void
}) {
  const homeRoster = rosterOf(categoryId, home)
  const awayRoster = rosterOf(categoryId, away)
  const { home: homeScore, away: awayScore } = previewScore(form)
  const decided = homeScore >= 2 || awayScore >= 2
  const allSet = form.courts.every((c) => c.winner !== null)
  const winner =
    homeScore > awayScore ? home : awayScore > homeScore ? away : null

  function setCourt(i: number, patch: Partial<CourtForm>) {
    onChange((prev) => {
      const courts = [...prev.courts] as SeriesForm["courts"]
      courts[i] = { ...courts[i], ...patch }
      return { ...prev, courts, saved: false }
    })
  }

  function setGeneralWo(side: Side | null) {
    onChange((prev) => {
      if (side === null) {
        return { ...prev, generalWo: null, saved: false }
      }
      const courts = prev.courts.map((c) => ({
        ...c,
        winner: side,
        wo: true,
        score: "W.O.",
      })) as SeriesForm["courts"]
      return { ...prev, generalWo: side, courts, saved: false }
    })
  }

  return (
    <Card className="overflow-hidden border-t-4 border-t-accent">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="font-heading text-lg">
            <span className={cn(winner === home && "text-primary")}>{home}</span>
            <span className="px-2 text-muted-foreground">vs</span>
            <span className={cn(winner === away && "text-primary")}>{away}</span>
          </CardTitle>
          {form.saved ? (
            <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <Check className="size-3" />
              Guardada
            </Badge>
          ) : allSet ? (
            <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
              <CircleDot className="size-3" />
              Lista para guardar
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 border-border text-muted-foreground"
            >
              <CircleDot className="size-3" />
              En carga
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Resultado general
          </span>
          <span className="font-heading text-xl font-extrabold text-foreground">
            {homeScore}
            <span className="px-1 text-muted-foreground">–</span>
            {awayScore}
          </span>
          {decided && winner && (
            <Badge className="ml-auto gap-1 bg-primary/10 text-primary hover:bg-primary/10">
              <Trophy className="size-3" />
              Gana {winner}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border p-3">
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <ShieldAlert className="size-4 text-accent" />
            W.O. general
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={form.generalWo === "home" ? "default" : "outline"}
              onClick={() => setGeneralWo(form.generalWo === "home" ? null : "home")}
            >
              {home}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={form.generalWo === "away" ? "default" : "outline"}
              onClick={() => setGeneralWo(form.generalWo === "away" ? null : "away")}
            >
              {away}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          {form.courts.map((court, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-border border-l-4 border-l-winter bg-card p-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <MapPin className="size-3.5 text-winter" />
                  Cancha {i + 1}
                </span>
                <label className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Checkbox
                    checked={court.wo}
                    onCheckedChange={(v) =>
                      setCourt(i, {
                        wo: v === true,
                        score: v === true ? "W.O." : "",
                      })
                    }
                  />
                  W.O.
                </label>
              </div>

              <PlayerPair
                label={home}
                tone="primary"
                roster={homeRoster}
                value={court.homePlayers}
                onChange={(p) => setCourt(i, { homePlayers: p })}
              />
              <PlayerPair
                label={away}
                tone="accent"
                roster={awayRoster}
                value={court.awayPlayers}
                onChange={(p) => setCourt(i, { awayPlayers: p })}
              />

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Resultado</Label>
                <Input
                  value={court.score}
                  placeholder="6-4 6-3"
                  disabled={court.wo}
                  onChange={(e) => setCourt(i, { score: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={court.winner === "home" ? "default" : "outline"}
                  onClick={() => setCourt(i, { winner: "home" })}
                  className="text-xs"
                >
                  Gana {home}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={court.winner === "away" ? "default" : "outline"}
                  onClick={() => setCourt(i, { winner: "away" })}
                  className="text-xs"
                >
                  Gana {away}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {allSet
              ? "Las 3 canchas tienen ganador."
              : `Faltan ${form.courts.filter((c) => c.winner === null).length} cancha(s) por definir.`}
          </p>
          <Button
            type="button"
            disabled={!allSet}
            onClick={() => onChange((prev) => ({ ...prev, saved: true }))}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className="size-4" />
            Guardar serie
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PlayerPair({
  label,
  tone,
  roster,
  value,
  onChange,
}: {
  label: string
  tone: "primary" | "accent"
  roster: string[]
  value: [string, string]
  onChange: (v: [string, string]) => void
}) {
  return (
    <div className="space-y-1.5">
      <span
        className={cn(
          "inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
          tone === "primary"
            ? "bg-primary/10 text-primary"
            : "bg-accent/15 text-accent",
        )}
      >
        {label}
      </span>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((idx) => (
          <Select
            key={idx}
            value={value[idx]}
            onValueChange={(v) => {
              const next: [string, string] = [...value] as [string, string]
              next[idx] = v ?? value[idx]
              onChange(next)
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roster.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  )
}
