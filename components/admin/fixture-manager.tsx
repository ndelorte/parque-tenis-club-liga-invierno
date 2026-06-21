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
import { Card, CardContent } from "@/components/ui/card"
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
import { mockSeriesCaballerosA } from "@/mock/data"
import { MatchSheetButton } from "@/components/admin/fixture/MatchSheetButton"
import { cn } from "@/lib/utils"

type FixtureDraft = {
  id: string
  seriesId?: string
  round: string
  home: string
  away: string
  date: string
  time: string
  status: "played" | "upcoming"
  originalDate: string
}

function buildDraftFromLeague(categoryId: CategoryId): FixtureDraft[] {
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

// Caballeros A uses the proper mock data from mock/data.ts (has player lists and real IDs)
function buildDraftFromMockSeries(): FixtureDraft[] {
  return mockSeriesCaballerosA.map((s) => ({
    id: s.id,
    seriesId: s.id,
    round: s.round?.name ?? "",
    home: s.home_team?.name ?? "",
    away: s.away_team?.name ?? "",
    date: s.scheduled_date ?? "",
    time: s.scheduled_time ?? "20:00",
    status:
      s.status === "completed" || s.status === "walkover" ? "played" : "upcoming",
    originalDate: s.original_scheduled_date ?? s.scheduled_date ?? "",
  }))
}

function buildDraft(categoryId: CategoryId): FixtureDraft[] {
  if (categoryId === "cab-a") return buildDraftFromMockSeries()
  return buildDraftFromLeague(categoryId)
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
                  {m.seriesId && <MatchSheetButton seriesId={m.seriesId} />}

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
        <Button
          onClick={save}
          className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Save className="size-4" />
          Guardar fixture
        </Button>
      </div>
    </div>
  )
}
