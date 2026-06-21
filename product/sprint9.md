Implementá el panel admin privado.
Rutas:
admin/page.tsx

import type { Metadata } from "next"
import Link from "next/link"
import {
  Snowflake,
  ArrowLeft,
  ClipboardList,
  Trophy,
  Users,
  CalendarClock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ResultLoader } from "@/components/admin/result-loader"
import { TeamManager } from "@/components/admin/team-manager"
import { FixtureManager } from "@/components/admin/fixture-manager"

export const metadata: Metadata = {
  title: "Panel de carga | Liga de Invierno",
  description:
    "Dashboard interno para cargar resultados de la Liga de Invierno de Parque Tenis Club.",
}

export default function AdminPage() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
            <ClipboardList className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-bold leading-tight">
              Panel de carga
            </p>
            <p className="flex items-center gap-1 text-xs text-primary-foreground/70">
              <Snowflake className="size-3 text-winter" />
              Liga de Invierno
            </p>
          </div>
          <Badge className="ml-auto bg-accent text-accent-foreground hover:bg-accent">
            Admin
          </Badge>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="hidden bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:inline-flex"
          >
            <Link href="/liga-invierno">
              <ArrowLeft className="size-4" />
              Ver liga
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            Gestión de la liga
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cargá resultados, administrá los planteles de cada equipo y
            reprogramá las fechas del fixture.
          </p>
        </div>

        <Tabs defaultValue="resultados">
          <TabsList className="h-auto w-full flex-wrap gap-1 bg-muted p-1 sm:w-auto">
            <TabsTrigger value="resultados" className="h-9 gap-1.5 px-3">
              <Trophy className="size-4" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="jugadores" className="h-9 gap-1.5 px-3">
              <Users className="size-4" />
              Jugadores
            </TabsTrigger>
            <TabsTrigger value="fixture" className="h-9 gap-1.5 px-3">
              <CalendarClock className="size-4" />
              Fixture
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resultados" className="mt-5">
            <ResultLoader />
          </TabsContent>
          <TabsContent value="jugadores" className="mt-5">
            <TeamManager />
          </TabsContent>
          <TabsContent value="fixture" className="mt-5">
            <FixtureManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

fixture-manager.tsx

"use client"

import { useMemo, useState } from "react"
import {
  CalendarDays,
  Clock,
  Save,
  Check,
  RotateCcw,
  CalendarClock,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORIES, LEAGUE, formatDate, type CategoryId } from "@/lib/liga"
import { cn } from "@/lib/utils"

type FixtureDraft = {
  id: string
  round: string
  home: string
  away: string
  date: string
  time: string
  status: "played" | "upcoming"
  originalDate: string
}

function buildDraft(categoryId: CategoryId): FixtureDraft[] {
  return LEAGUE[categoryId].matches.map((m, i) => ({
    id: `${categoryId}-${i}`,
    round: m.round,
    home: m.home,
    away: m.away,
    date: m.date,
    time: "09:00",
    status: m.status,
    originalDate: m.date,
  }))
}

export function FixtureManager() {
  const [active, setActive] = useState<CategoryId>("cab-a")
  const [drafts, setDrafts] = useState<Record<string, FixtureDraft[]>>(() => ({
    "cab-a": buildDraft("cab-a"),
  }))
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const matches = useMemo(() => {
    if (!drafts[active]) {
      const next = buildDraft(active)
      setDrafts((d) => ({ ...d, [active]: next }))
      return next
    }
    return drafts[active]
  }, [drafts, active])

  function update(id: string, patch: Partial<FixtureDraft>) {
    setDrafts((d) => ({
      ...d,
      [active]: (d[active] ?? buildDraft(active)).map((m) =>
        m.id === id ? { ...m, ...patch } : m,
      ),
    }))
    setSavedAt(null)
  }

  function reset(id: string) {
    setDrafts((d) => ({
      ...d,
      [active]: (d[active] ?? buildDraft(active)).map((m) =>
        m.id === id ? { ...m, date: m.originalDate } : m,
      ),
    }))
    setSavedAt(null)
  }

  function save() {
    setSavedAt(
      new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
    )
  }

  // Upcoming first, then played; both sorted by date.
  const sorted = [...matches].sort((a, b) => {
    if (a.status !== b.status) return a.status === "upcoming" ? -1 : 1
    return a.date.localeCompare(b.date)
  })

  return (
    <div className="space-y-5">
      <Card className="border-t-4 border-t-winter">
        <CardContent className="py-4">
          <div className="w-full sm:max-w-xs">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categoría
            </Label>
            <Select value={active} onValueChange={(v) => setActive(v as CategoryId)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue>
                  {(value) =>
                    CATEGORIES.find((c) => c.id === value)?.label ?? ""
                  }
                </SelectValue>
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
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sorted.map((m) => {
          const moved = m.date !== m.originalDate
          return (
            <Card
              key={m.id}
              className={cn(
                "overflow-hidden border-l-4",
                m.status === "upcoming" ? "border-l-winter" : "border-l-muted",
              )}
            >
              <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        m.status === "upcoming"
                          ? "bg-winter text-winter-foreground hover:bg-winter"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary",
                      )}
                    >
                      {m.round}
                    </Badge>
                    {m.status === "played" && (
                      <span className="text-xs font-medium text-muted-foreground">
                        Jugada
                      </span>
                    )}
                    {moved && (
                      <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
                        <CalendarClock className="size-3" />
                        Reprogramada
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 font-heading text-base font-bold text-foreground">
                    {m.home} <span className="text-muted-foreground">vs</span>{" "}
                    {m.away}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Fecha actual: {formatDate(m.date)}
                    {moved && (
                      <span className="text-accent">
                        {" "}
                        (antes {formatDate(m.originalDate)})
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      Fecha
                    </Label>
                    <Input
                      type="date"
                      value={m.date}
                      onChange={(e) => update(m.id, { date: e.target.value })}
                      aria-label={`Fecha de ${m.home} vs ${m.away}`}
                      className="h-10 w-[10.5rem]"
                    />
                  </div>
                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Clock className="size-3.5" />
                      Hora
                    </Label>
                    <Input
                      type="time"
                      value={m.time}
                      onChange={(e) => update(m.id, { time: e.target.value })}
                      aria-label={`Hora de ${m.home} vs ${m.away}`}
                      className="h-10 w-[7rem]"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => reset(m.id)}
                    disabled={!moved}
                    aria-label="Restaurar fecha original"
                    className="h-10 shrink-0 text-muted-foreground hover:bg-secondary disabled:opacity-40"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        {savedAt ? (
          <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
            <Check className="size-3.5" />
            Guardado {savedAt}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">
            Editá las fechas y guardá los cambios
          </span>
        )}
        <Button onClick={save} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="size-4" />
          Guardar fixture
        </Button>
      </div>
    </div>
  )
}

result-loader.tsx

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

  // Unique rounds for the selected category.
  const rounds = useMemo(() => {
    const seen = new Map<string, { round: string; date: string }>()
    for (const m of LEAGUE[categoryId].matches) {
      if (!seen.has(m.round)) seen.set(m.round, { round: m.round, date: m.date })
    }
    return Array.from(seen.values())
  }, [categoryId])

  const [round, setRound] = useState<string>(rounds[0]?.round ?? "")

  // Keep round valid when category changes.
  const activeRound = rounds.some((r) => r.round === round)
    ? round
    : rounds[0]?.round ?? ""

  const series = useMemo(
    () =>
      LEAGUE[categoryId].matches.filter((m) => m.round === activeRound),
    [categoryId, activeRound],
  )

  // Form state keyed by "home vs away".
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
      {/* Toolbar: category + date */}
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
                <SelectValue>
                  {(value) =>
                    CATEGORIES.find((c) => c.id === value)?.label ?? ""
                  }
                </SelectValue>
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
            <Select value={activeRound} onValueChange={setRound}>
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

      {/* Series */}
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

        {/* Live preview */}
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
        {/* General WO */}
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

        {/* Court forms */}
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

              {/* Home pair */}
              <PlayerPair
                label={home}
                tone="primary"
                roster={homeRoster}
                value={court.homePlayers}
                onChange={(p) => setCourt(i, { homePlayers: p })}
              />
              {/* Away pair */}
              <PlayerPair
                label={away}
                tone="accent"
                roster={awayRoster}
                value={court.awayPlayers}
                onChange={(p) => setCourt(i, { awayPlayers: p })}
              />

              {/* Score */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Resultado
                </Label>
                <Input
                  value={court.score}
                  placeholder="6-4 6-3"
                  disabled={court.wo}
                  onChange={(e) => setCourt(i, { score: e.target.value })}
                  className="h-9"
                />
              </div>

              {/* Winner */}
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
              const next: [string, string] = [...value]
              next[idx] = v
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

team-manager.tsx

"use client"

import { useMemo, useState } from "react"
import {
  Users,
  UserPlus,
  Trash2,
  Plus,
  Save,
  Check,
  X,
  Pencil,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CATEGORIES, LEAGUE, type CategoryId } from "@/lib/liga"

type TeamDraft = {
  id: string
  name: string
  players: string[]
}

let teamSeq = 0
function uid() {
  teamSeq += 1
  return `t${teamSeq}-${Math.random().toString(36).slice(2, 7)}`
}

function buildDraft(categoryId: CategoryId): TeamDraft[] {
  return LEAGUE[categoryId].teams.map((t) => ({
    id: uid(),
    name: t.name,
    players: [...t.players],
  }))
}

export function TeamManager() {
  const [active, setActive] = useState<CategoryId>("cab-a")
  // Keep an independent draft per category so switching tabs keeps edits.
  const [drafts, setDrafts] = useState<Record<string, TeamDraft[]>>(() => ({
    "cab-a": buildDraft("cab-a"),
  }))
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const teams = useMemo(() => {
    if (!drafts[active]) {
      const next = buildDraft(active)
      setDrafts((d) => ({ ...d, [active]: next }))
      return next
    }
    return drafts[active]
  }, [drafts, active])

  function update(updater: (teams: TeamDraft[]) => TeamDraft[]) {
    setDrafts((d) => ({ ...d, [active]: updater(d[active] ?? buildDraft(active)) }))
    setSavedAt(null)
  }

  function setTeamName(id: string, name: string) {
    update((ts) => ts.map((t) => (t.id === id ? { ...t, name } : t)))
  }

  function setPlayer(teamId: string, index: number, value: string) {
    update((ts) =>
      ts.map((t) =>
        t.id === teamId
          ? { ...t, players: t.players.map((p, i) => (i === index ? value : p)) }
          : t,
      ),
    )
  }

  function addPlayer(teamId: string) {
    update((ts) =>
      ts.map((t) =>
        t.id === teamId ? { ...t, players: [...t.players, ""] } : t,
      ),
    )
  }

  function removePlayer(teamId: string, index: number) {
    update((ts) =>
      ts.map((t) =>
        t.id === teamId
          ? { ...t, players: t.players.filter((_, i) => i !== index) }
          : t,
      ),
    )
  }

  function addTeam() {
    update((ts) => [
      ...ts,
      { id: uid(), name: "Nuevo equipo", players: ["", ""] },
    ])
  }

  function removeTeam(id: string) {
    update((ts) => ts.filter((t) => t.id !== id))
  }

  function save() {
    // Mock persistence: in a real app this would POST to the backend.
    setSavedAt(new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }))
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <Card className="border-t-4 border-t-winter">
        <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-xs">
            <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Categoría
            </Label>
            <Select value={active} onValueChange={(v) => setActive(v as CategoryId)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue>
                  {(value) =>
                    CATEGORIES.find((c) => c.id === value)?.label ?? ""
                  }
                </SelectValue>
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
          <Button onClick={addTeam} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" />
            Agregar equipo
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {teams.map((team) => (
          <Card key={team.id} className="overflow-hidden border-t-4 border-t-primary">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 font-heading text-sm font-bold text-primary">
                  {team.name.charAt(0) || "?"}
                </span>
                <Input
                  value={team.name}
                  onChange={(e) => setTeamName(team.id, e.target.value)}
                  aria-label="Nombre del equipo"
                  className="h-10 font-heading text-base font-bold"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTeam(team.id)}
                  aria-label={`Eliminar ${team.name}`}
                  className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <Users className="size-4" />
                  Jugadores ({team.players.length})
                </CardTitle>
              </div>
              {team.players.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {i + 1}
                  </span>
                  <Input
                    value={p}
                    onChange={(e) => setPlayer(team.id, i, e.target.value)}
                    placeholder={`Jugador ${i + 1}`}
                    aria-label={`Jugador ${i + 1} de ${team.name}`}
                    className="h-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePlayer(team.id, i)}
                    disabled={team.players.length <= 1}
                    aria-label={`Quitar jugador ${i + 1}`}
                    className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => addPlayer(team.id)}
                className="mt-1 h-10 w-full border-dashed"
              >
                <UserPlus className="size-4" />
                Agregar jugador
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
        <div className="flex items-center gap-2 text-sm">
          {savedAt ? (
            <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <Check className="size-3.5" />
              Guardado {savedAt}
            </Badge>
          ) : (
            <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
              <Pencil className="size-3.5" />
              Cambios sin guardar
            </Badge>
          )}
          <span className="hidden text-muted-foreground sm:inline">
            {teams.length} equipos en la categoría
          </span>
        </div>
        <Button onClick={save} className="h-11 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="size-4" />
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}

select
"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon, ChevronUpIcon } from "lucide-react"

const Select = SelectPrimitive.Root

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  )
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex flex-1 text-left", className)}
      {...props}
    />
  )
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=default]:h-8 data-[size=sm]:h-7 data-[size=sm]:rounded-[min(var(--radius-md),10px)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
        }
      />
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        alignItemWithTrigger={alignItemWithTrigger}
        className="isolate z-50"
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          data-align-trigger={alignItemWithTrigger}
          className={cn("relative isolate z-50 max-h-(--available-height) w-(--anchor-width) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95", className )}
          {...props}
        >
          <SelectScrollUpButton />
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
          <SelectScrollDownButton />
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn("px-1.5 py-1 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground not-data-[variant=destructive]:focus:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemText className="flex flex-1 shrink-0 gap-2 whitespace-nowrap">
        {children}
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "top-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronUpIcon
      />
    </SelectPrimitive.ScrollUpArrow>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "bottom-0 z-10 flex w-full cursor-default items-center justify-center bg-popover py-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      <ChevronDownIcon
      />
    </SelectPrimitive.ScrollDownArrow>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}

input
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }

checkbox
"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <CheckIcon
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

label
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }

separator
"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }

Requisitos:
- El login no debe aparecer linkeado desde el home.
- Solo usuarios autenticados pueden entrar.
- Crear/editar equipos.
- Crear/editar jugadores.
- Asociar jugadores a equipos.
- Ver fixture.
- Reprogramar día y horario.
- Cargar resultados de las 3 canchas.
- Editar resultados ya cargados.
- Cargar WO de cancha.
- Cargar WO general.
- Al guardar o editar resultado, recalcular tabla de la categoría.
- Mostrar mensajes claros de éxito/error.
