"use client"

import { useMemo, useState, useTransition } from "react"
import {
  CalendarDays,
  Clock,
  Save,
  Check,
  RotateCcw,
  CalendarClock,
  Loader2,
  Trophy,
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
import { saveReschedule } from "@/app/actions/liga"
import { MatchSheetButton } from "@/components/admin/fixture/MatchSheetButton"
import type { AdminBundle } from "@/app/admin/page"

type Draft = {
  seriesId: string
  roundName: string
  home: string
  away: string
  date: string
  time: string
  originalDate: string
  originalTime: string
  status: string
  dirty: boolean
  saved: boolean
}

function formatDate(iso: string) {
  if (!iso) return "—"
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "long",
  })
}

function buildDrafts(bundle: AdminBundle): Draft[] {
  return bundle.rounds.flatMap((round) =>
    round.series.map((s) => ({
      seriesId: s.id,
      roundName: round.name,
      home: s.home_team?.name ?? s.home_team_id,
      away: s.away_team?.name ?? s.away_team_id,
      date: s.scheduled_date ?? "",
      time: s.scheduled_time ?? "",
      originalDate: s.original_scheduled_date ?? s.scheduled_date ?? "",
      originalTime: s.original_scheduled_time ?? s.scheduled_time ?? "",
      status: s.status,
      dirty: false,
      saved: false,
    })),
  )
}

export function FixtureManager({ bundles }: { bundles: AdminBundle[] }) {
  const [categoryId, setCategoryId] = useState<string>(bundles[0]?.category.id ?? "")
  const [drafts, setDrafts] = useState<Record<string, Draft[]>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const activeBundle = useMemo(
    () => bundles.find((b) => b.category.id === categoryId) ?? bundles[0],
    [bundles, categoryId],
  )

  const rows: Draft[] = useMemo(() => {
    if (!activeBundle) return []
    return drafts[activeBundle.category.id] ?? buildDrafts(activeBundle)
  }, [drafts, activeBundle])

  function update(seriesId: string, patch: Partial<Draft>) {
    const catId = activeBundle!.category.id
    setDrafts((prev) => {
      const base = prev[catId] ?? buildDrafts(activeBundle!)
      return {
        ...prev,
        [catId]: base.map((d) =>
          d.seriesId === seriesId ? { ...d, ...patch, dirty: true, saved: false } : d,
        ),
      }
    })
    setSavedAt(null)
  }

  function resetRow(seriesId: string) {
    const catId = activeBundle!.category.id
    setDrafts((prev) => {
      const base = prev[catId] ?? buildDrafts(activeBundle!)
      return {
        ...prev,
        [catId]: base.map((d) =>
          d.seriesId === seriesId
            ? { ...d, date: d.originalDate, time: d.originalTime, dirty: false, saved: false }
            : d,
        ),
      }
    })
  }

  function handleSaveAll() {
    const dirty = rows.filter((r) => r.dirty)
    if (dirty.length === 0) return
    setError(null)
    startTransition(async () => {
      try {
        await Promise.all(dirty.map((d) => saveReschedule(d.seriesId, d.date, d.time)))
        const catId = activeBundle!.category.id
        setDrafts((prev) => {
          const base = prev[catId] ?? buildDrafts(activeBundle!)
          return {
            ...prev,
            [catId]: base.map((d) =>
              d.dirty ? { ...d, dirty: false, saved: true } : d,
            ),
          }
        })
        setSavedAt(
          new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        )
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar")
      }
    })
  }

  const dirtyCount = rows.filter((r) => r.dirty).length

  const sorted = [...rows].sort((a, b) => {
    const played = (s: string) => s === "completed" || s === "walkover"
    if (played(a.status) !== played(b.status)) return played(a.status) ? 1 : -1
    return (a.date || "z").localeCompare(b.date || "z")
  })

  return (
    <div className="space-y-5">
      <Card className="border-t-4 border-t-winter">
        <CardContent className="py-4">
          <div className="w-full sm:max-w-xs">
            <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Trophy className="size-3.5 text-accent" />
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
                {bundles.map((b) => (
                  <SelectItem key={b.category.id} value={b.category.id}>
                    {b.category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay series cargadas para esta categoría.
        </p>
      )}

      <div className="space-y-3">
        {sorted.map((m) => {
          const moved =
            !!m.date && !!m.originalDate && m.date !== m.originalDate
          const played = m.status === "completed" || m.status === "walkover"
          return (
            <Card
              key={m.seriesId}
              className={cn(
                "overflow-hidden border-l-4",
                played ? "border-l-muted" : "border-l-winter",
              )}
            >
              <CardContent className="flex flex-col gap-4 py-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        played
                          ? "bg-secondary text-secondary-foreground hover:bg-secondary"
                          : "bg-winter text-winter-foreground hover:bg-winter",
                      )}
                    >
                      {m.roundName}
                    </Badge>
                    {played && (
                      <span className="text-xs font-medium text-muted-foreground">Jugada</span>
                    )}
                    {moved && (
                      <Badge className="gap-1 bg-accent text-accent-foreground hover:bg-accent">
                        <CalendarClock className="size-3" />
                        Reprogramada
                      </Badge>
                    )}
                    {m.saved && (
                      <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
                        <Check className="size-3" />
                        Guardada
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 font-heading text-base font-bold text-foreground">
                    {m.home} <span className="text-muted-foreground">vs</span> {m.away}
                  </p>
                  {m.date && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Fecha actual: {formatDate(m.date)}
                      {moved && (
                        <span className="text-accent"> (antes {formatDate(m.originalDate)})</span>
                      )}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  <MatchSheetButton seriesId={m.seriesId} />

                  <div>
                    <Label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      Fecha
                    </Label>
                    <Input
                      type="date"
                      value={m.date}
                      onChange={(e) => update(m.seriesId, { date: e.target.value })}
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
                      onChange={(e) => update(m.seriesId, { time: e.target.value })}
                      aria-label={`Hora de ${m.home} vs ${m.away}`}
                      className="h-10 w-[7rem]"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => resetRow(m.seriesId)}
                    disabled={!m.dirty}
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

      {sorted.length > 0 && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur">
          {savedAt ? (
            <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary">
              <Check className="size-3.5" />
              Guardado {savedAt}
            </Badge>
          ) : dirtyCount > 0 ? (
            <span className="text-sm text-muted-foreground">
              {dirtyCount} serie{dirtyCount !== 1 ? "s" : ""} con cambios
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Editá las fechas y guardá los cambios
            </span>
          )}
          <Button
            onClick={handleSaveAll}
            disabled={dirtyCount === 0 || isPending}
            className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar fixture
          </Button>
        </div>
      )}
    </div>
  )
}
