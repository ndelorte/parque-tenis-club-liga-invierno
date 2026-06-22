"use client"

import { useState, useTransition, useEffect } from "react"
import {
  CalendarDays,
  Clock,
  Save,
  Check,
  RotateCcw,
  CalendarClock,
  Loader2,
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
import { cn } from "@/lib/utils"
import {
  type CategoryForAdmin,
  type RoundForAdmin,
  getRoundsForAdmin,
  updateSeriesSchedule,
} from "@/app/actions/admin"
import { formatDate } from "@/lib/liga"
import { MatchSheetButton } from "@/components/admin/fixture/MatchSheetButton"

type FixtureDraft = {
  seriesId: string
  roundName: string
  homeTeamName: string
  awayTeamName: string
  date: string
  time: string
  originalDate: string
  originalTime: string
  status: string
}

function roundsToFixture(rounds: RoundForAdmin[]): FixtureDraft[] {
  const items: FixtureDraft[] = []
  for (const round of rounds) {
    for (const s of round.series) {
      items.push({
        seriesId: s.id,
        roundName: round.name,
        homeTeamName: s.homeTeam.name,
        awayTeamName: s.awayTeam.name,
        date: s.scheduledDate ?? "",
        time: s.scheduledTime ?? "09:00",
        originalDate: s.originalScheduledDate ?? s.scheduledDate ?? "",
        originalTime: s.originalScheduledTime ?? s.scheduledTime ?? "09:00",
        status: s.status,
      })
    }
  }
  return items
}

export function FixtureManager({ categories }: { categories: CategoryForAdmin[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [drafts, setDrafts] = useState<FixtureDraft[]>([])
  const [isPending, startTransition] = useTransition()
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function loadData(catId: string) {
    setSavedAt(null)
    setError(null)
    startTransition(async () => {
      const rounds = await getRoundsForAdmin(catId)
      setDrafts(roundsToFixture(rounds))
    })
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (categoryId) loadData(categoryId)
  }, [categoryId])

  function update(seriesId: string, patch: Partial<FixtureDraft>) {
    setDrafts((prev) => prev.map((d) => (d.seriesId === seriesId ? { ...d, ...patch } : d)))
    setSavedAt(null)
  }

  function reset(seriesId: string) {
    setDrafts((prev) =>
      prev.map((d) =>
        d.seriesId === seriesId ? { ...d, date: d.originalDate, time: d.originalTime } : d,
      ),
    )
    setSavedAt(null)
  }

  async function save() {
    setSaving(true)
    setError(null)

    const changed = drafts.filter(
      (d) => d.date !== d.originalDate || d.time !== d.originalTime,
    )

    const results = await Promise.all(
      changed.map((d) => updateSeriesSchedule(d.seriesId, d.date, d.time)),
    )

    setSaving(false)
    const failed = results.find((r) => !r.success)
    if (failed) {
      setError(failed.error ?? "Error al guardar")
    } else {
      setSavedAt(
        new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
      )
      loadData(categoryId)
    }
  }

  const sorted = [...drafts].sort((a, b) => {
    const aUpcoming = a.status !== "completed" && a.status !== "walkover"
    const bUpcoming = b.status !== "completed" && b.status !== "walkover"
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
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
            <Select
              value={categoryId}
              onValueChange={(v) => {
                if (v) setCategoryId(v)
                setSavedAt(null)
              }}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isPending ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((m) => {
            const moved = m.date !== m.originalDate
            const isCompleted = m.status === "completed" || m.status === "walkover"
            return (
              <Card
                key={m.seriesId}
                className={cn(
                  "overflow-hidden border-l-4",
                  !isCompleted ? "border-l-winter" : "border-l-muted",
                )}
              >
                <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={cn(
                          !isCompleted
                            ? "bg-winter text-winter-foreground hover:bg-winter"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary",
                        )}
                      >
                        {m.roundName}
                      </Badge>
                      {isCompleted && (
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
                      {m.homeTeamName}{" "}
                      <span className="text-muted-foreground">vs</span>{" "}
                      {m.awayTeamName}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {m.date ? `Fecha actual: ${formatDate(m.date)}` : "Sin fecha asignada"}
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
                        onChange={(e) => update(m.seriesId, { date: e.target.value })}
                        aria-label={`Fecha de ${m.homeTeamName} vs ${m.awayTeamName}`}
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
                        onChange={(e) => update(m.seriesId, { time: e.target.value })}
                        aria-label={`Hora de ${m.homeTeamName} vs ${m.awayTeamName}`}
                        className="h-10 w-[7rem]"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => reset(m.seriesId)}
                      disabled={!moved}
                      aria-label="Restaurar fecha original"
                      className="h-10 shrink-0 text-muted-foreground hover:bg-secondary disabled:opacity-40"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                    <MatchSheetButton seriesId={m.seriesId} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay series para esta categoría.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

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
          disabled={isPending || saving}
          className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          Guardar fixture
        </Button>
      </div>
    </div>
  )
}
