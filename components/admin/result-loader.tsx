"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Trophy,
  CalendarDays,
  Save,
  Check,
  CircleDot,
  ShieldAlert,
  MapPin,
  Loader2,
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
import { cn } from "@/lib/utils"
import {
  type CategoryForAdmin,
  type RoundForAdmin,
  type SeriesForAdmin,
  type CourtInput,
  type PlayerInfo,
  getRoundsForAdmin,
  saveSeriesResult,
} from "@/app/actions/admin"

type CourtForm = {
  homePlayer1Id: string | null
  homePlayer2Id: string | null
  awayPlayer1Id: string | null
  awayPlayer2Id: string | null
  score: string
  winnerTeamId: string | null
  wo: boolean
}

type SeriesForm = {
  isGeneralWalkover: boolean
  walkoverWinnerId: string | null
  courts: [CourtForm, CourtForm, CourtForm]
  saved: boolean
}

function blankCourt(): CourtForm {
  return {
    homePlayer1Id: null,
    homePlayer2Id: null,
    awayPlayer1Id: null,
    awayPlayer2Id: null,
    score: "",
    winnerTeamId: null,
    wo: false,
  }
}

function seriesToForm(s: SeriesForAdmin): SeriesForm {
  const courts = ([1, 2, 3] as const).map((n) => {
    const c = s.courts.find((x) => x.courtNumber === n)
    if (!c) return blankCourt()
    return {
      homePlayer1Id: c.homePlayer1Id,
      homePlayer2Id: c.homePlayer2Id,
      awayPlayer1Id: c.awayPlayer1Id,
      awayPlayer2Id: c.awayPlayer2Id,
      score: c.score ?? "",
      winnerTeamId: c.winnerTeamId,
      wo: c.isWalkover,
    }
  }) as [CourtForm, CourtForm, CourtForm]

  return {
    isGeneralWalkover: s.isGeneralWalkover,
    walkoverWinnerId: s.walkoverWinnerId,
    courts,
    saved: s.status === "completed" || s.status === "walkover",
  }
}

export function ResultLoader({ categories }: { categories: CategoryForAdmin[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [rounds, setRounds] = useState<RoundForAdmin[]>([])
  const [activeRoundId, setActiveRoundId] = useState<string>("")
  const [forms, setForms] = useState<Record<string, SeriesForm>>({})
  const [isPending, startTransition] = useTransition()
  const [savingId, setSavingId] = useState<string | null>(null)

  function loadRounds(catId: string) {
    startTransition(async () => {
      const data = await getRoundsForAdmin(catId)
      setRounds(data)
      const defaultRound =
        data.find((r) =>
          r.series.some((s) => s.status !== "completed" && s.status !== "walkover"),
        ) ?? data[data.length - 1]
      setActiveRoundId(defaultRound?.id ?? "")
      const newForms: Record<string, SeriesForm> = {}
      for (const round of data) {
        for (const s of round.series) {
          newForms[s.id] = seriesToForm(s)
        }
      }
      setForms(newForms)
    })
  }

  useEffect(() => {
    if (categoryId) loadRounds(categoryId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  const activeRound = rounds.find((r) => r.id === activeRoundId)

  function updateForm(seriesId: string, updater: (prev: SeriesForm) => SeriesForm) {
    setForms((prev) => ({
      ...prev,
      [seriesId]: updater(
        prev[seriesId] ?? {
          isGeneralWalkover: false,
          walkoverWinnerId: null,
          courts: [blankCourt(), blankCourt(), blankCourt()],
          saved: false,
        },
      ),
    }))
  }

  async function handleSaveSeries(series: SeriesForAdmin) {
    const form = forms[series.id]
    if (!form) return
    setSavingId(series.id)

    const courts: CourtInput[] = form.courts.map((c, i) => ({
      courtNumber: (i + 1) as 1 | 2 | 3,
      homePlayer1Id: c.homePlayer1Id,
      homePlayer2Id: c.homePlayer2Id,
      awayPlayer1Id: c.awayPlayer1Id,
      awayPlayer2Id: c.awayPlayer2Id,
      score: c.score,
      winnerTeamId: c.winnerTeamId,
      isWalkover: c.wo,
    }))

    const result = await saveSeriesResult({
      seriesId: series.id,
      homeTeamId: series.homeTeam.id,
      awayTeamId: series.awayTeam.id,
      isGeneralWalkover: form.isGeneralWalkover,
      walkoverWinnerId: form.walkoverWinnerId,
      courts,
    })

    setSavingId(null)
    if (result.success) {
      updateForm(series.id, (prev) => ({ ...prev, saved: true }))
    }
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
            <Select value={categoryId} onValueChange={(v) => { if (v) setCategoryId(v) }}>
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

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-3.5 text-winter" />
              Fecha
            </Label>
            <Select
              value={activeRoundId}
              onValueChange={(v) => { if (v) setActiveRoundId(v) }}
              disabled={rounds.length === 0}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Seleccioná una fecha" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
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
        <>
          {activeRound?.series.map((series) => {
            const form = forms[series.id] ?? seriesToForm(series)
            return (
              <SeriesEditor
                key={series.id}
                series={series}
                form={form}
                saving={savingId === series.id}
                onChange={(updater) => updateForm(series.id, updater)}
                onSave={() => handleSaveSeries(series)}
              />
            )
          })}
          {activeRound?.series.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay series para esta fecha.</p>
          )}
          {!activeRound && rounds.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay datos disponibles para esta categoría.
            </p>
          )}
        </>
      )}
    </div>
  )
}

function SeriesEditor({
  series,
  form,
  saving,
  onChange,
  onSave,
}: {
  series: SeriesForAdmin
  form: SeriesForm
  saving: boolean
  onChange: (updater: (prev: SeriesForm) => SeriesForm) => void
  onSave: () => void
}) {
  const homeCourts = form.courts.filter((c) => c.winnerTeamId === series.homeTeam.id).length
  const awayCourts = form.courts.filter((c) => c.winnerTeamId === series.awayTeam.id).length
  const decided = homeCourts >= 2 || awayCourts >= 2
  const allSet = form.isGeneralWalkover
    ? !!form.walkoverWinnerId
    : form.courts.every((c) => c.winnerTeamId !== null)
  const winner =
    homeCourts > awayCourts
      ? series.homeTeam.name
      : awayCourts > homeCourts
        ? series.awayTeam.name
        : null

  function setCourt(i: number, patch: Partial<CourtForm>) {
    onChange((prev) => {
      const courts = [...prev.courts] as SeriesForm["courts"]
      courts[i] = { ...courts[i], ...patch }
      return { ...prev, courts, saved: false }
    })
  }

  function setGeneralWo(teamId: string | null) {
    onChange((prev) => {
      if (!teamId) {
        return { ...prev, isGeneralWalkover: false, walkoverWinnerId: null, saved: false }
      }
      const courts = prev.courts.map((c) => ({
        ...c,
        winnerTeamId: teamId,
        wo: true,
        score: "W.O.",
      })) as SeriesForm["courts"]
      return {
        ...prev,
        isGeneralWalkover: true,
        walkoverWinnerId: teamId,
        courts,
        saved: false,
      }
    })
  }

  return (
    <Card className="overflow-hidden border-t-4 border-t-accent">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="font-heading text-lg">
            <span className={cn(winner === series.homeTeam.name && "text-primary")}>
              {series.homeTeam.name}
            </span>
            <span className="px-2 text-muted-foreground">vs</span>
            <span className={cn(winner === series.awayTeam.name && "text-primary")}>
              {series.awayTeam.name}
            </span>
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
            <Badge variant="outline" className="gap-1 border-border text-muted-foreground">
              <CircleDot className="size-3" />
              En carga
            </Badge>
          )}
        </div>

        {!form.isGeneralWalkover && (
          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Resultado general
            </span>
            <span className="font-heading text-xl font-extrabold text-foreground">
              {homeCourts}
              <span className="px-1 text-muted-foreground">–</span>
              {awayCourts}
            </span>
            {decided && winner && (
              <Badge className="ml-auto gap-1 bg-primary/10 text-primary hover:bg-primary/10">
                <Trophy className="size-3" />
                Gana {winner}
              </Badge>
            )}
          </div>
        )}

        {form.isGeneralWalkover && form.walkoverWinnerId && (
          <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              W.O. General
            </span>
            <Badge className="gap-1 bg-primary/10 text-primary">
              <Trophy className="size-3" />
              {form.walkoverWinnerId === series.homeTeam.id
                ? series.homeTeam.name
                : series.awayTeam.name}
            </Badge>
          </div>
        )}
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
              variant={form.walkoverWinnerId === series.homeTeam.id ? "default" : "outline"}
              onClick={() =>
                setGeneralWo(
                  form.walkoverWinnerId === series.homeTeam.id ? null : series.homeTeam.id,
                )
              }
            >
              {series.homeTeam.name}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={form.walkoverWinnerId === series.awayTeam.id ? "default" : "outline"}
              onClick={() =>
                setGeneralWo(
                  form.walkoverWinnerId === series.awayTeam.id ? null : series.awayTeam.id,
                )
              }
            >
              {series.awayTeam.name}
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
                <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground">
                  <Checkbox
                    checked={court.wo}
                    onCheckedChange={(v) =>
                      setCourt(i, { wo: v === true, score: v === true ? "W.O." : "" })
                    }
                  />
                  W.O.
                </label>
              </div>

              <PlayerPair
                label={series.homeTeam.name}
                tone="primary"
                players={series.homeTeam.players}
                value={[court.homePlayer1Id, court.homePlayer2Id]}
                onChange={([p1, p2]) => setCourt(i, { homePlayer1Id: p1, homePlayer2Id: p2 })}
              />
              <PlayerPair
                label={series.awayTeam.name}
                tone="accent"
                players={series.awayTeam.players}
                value={[court.awayPlayer1Id, court.awayPlayer2Id]}
                onChange={([p1, p2]) => setCourt(i, { awayPlayer1Id: p1, awayPlayer2Id: p2 })}
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
                  variant={court.winnerTeamId === series.homeTeam.id ? "default" : "outline"}
                  onClick={() => setCourt(i, { winnerTeamId: series.homeTeam.id })}
                  className="text-xs"
                >
                  Gana {series.homeTeam.name}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={court.winnerTeamId === series.awayTeam.id ? "default" : "outline"}
                  onClick={() => setCourt(i, { winnerTeamId: series.awayTeam.id })}
                  className="text-xs"
                >
                  Gana {series.awayTeam.name}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {allSet
              ? form.isGeneralWalkover
                ? "W.O. general marcado."
                : "Las 3 canchas tienen ganador."
              : `Faltan ${form.courts.filter((c) => c.winnerTeamId === null).length} cancha(s) por definir.`}
          </p>
          <Button
            type="button"
            disabled={!allSet || saving}
            onClick={onSave}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Guardar serie
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

const NULL_VALUE = "__null__"

function PlayerPair({
  label,
  tone,
  players,
  value,
  onChange,
}: {
  label: string
  tone: "primary" | "accent"
  players: PlayerInfo[]
  value: [string | null, string | null]
  onChange: (v: [string | null, string | null]) => void
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
        {([0, 1] as const).map((idx) => (
          <Select
            key={idx}
            value={value[idx] ?? NULL_VALUE}
            onValueChange={(v) => {
              const next: [string | null, string | null] = [...value] as [
                string | null,
                string | null,
              ]
              next[idx] = v === NULL_VALUE ? null : v
              onChange(next)
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Jugador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_VALUE}>Sin asignar</SelectItem>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  )
}
