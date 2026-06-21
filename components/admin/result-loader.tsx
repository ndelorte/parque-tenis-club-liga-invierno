"use client"

import { useMemo, useState, useTransition } from "react"
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
import { saveSeriesResult } from "@/app/actions/liga"
import type { AdminBundle } from "@/app/admin/page"
import type { Team, TeamPlayer, Player } from "@/lib/tournament/types"

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

function emptyForm(): CourtForm {
  return { homePlayers: ["", ""], awayPlayers: ["", ""], score: "", winner: null, wo: false }
}

function buildInitialForm(): SeriesForm {
  return {
    courts: [emptyForm(), emptyForm(), emptyForm()],
    generalWo: null,
    saved: false,
  }
}

type TeamWithPlayers = Team & { players: (TeamPlayer & { player: Player })[] }

function rosterOf(team: TeamWithPlayers): { id: string; name: string }[] {
  return team.players.map((tp) => ({
    id: tp.player_id,
    name: tp.player?.display_name ?? tp.player_id,
  }))
}

export function ResultLoader({ bundles }: { bundles: AdminBundle[] }) {
  const [categoryId, setCategoryId] = useState<string>(bundles[0]?.category.id ?? "")
  const [roundId, setRoundId] = useState<string>("")
  const [forms, setForms] = useState<Record<string, SeriesForm>>({})
  const [isPending, startTransition] = useTransition()
  const [saveError, setSaveError] = useState<string | null>(null)

  const activeBundle = useMemo(
    () => bundles.find((b) => b.category.id === categoryId) ?? bundles[0],
    [bundles, categoryId],
  )

  const rounds = useMemo(() => activeBundle?.rounds ?? [], [activeBundle])

  const activeRoundId = rounds.some((r) => r.id === roundId) ? roundId : (rounds[0]?.id ?? "")
  const activeRound = rounds.find((r) => r.id === activeRoundId)

  function keyOf(seriesId: string) {
    return `${categoryId}|${seriesId}`
  }

  function getForm(seriesId: string): SeriesForm {
    return forms[keyOf(seriesId)] ?? buildInitialForm()
  }

  function updateForm(seriesId: string, updater: (prev: SeriesForm) => SeriesForm) {
    setForms((prev) => {
      const k = keyOf(seriesId)
      return { ...prev, [k]: updater(prev[k] ?? buildInitialForm()) }
    })
  }

  function handleSave(
    seriesId: string,
    homeTeamId: string,
    awayTeamId: string,
    form: SeriesForm,
  ) {
    setSaveError(null)
    startTransition(async () => {
      try {
        if (form.generalWo !== null) {
          const winnerId = form.generalWo === "home" ? homeTeamId : awayTeamId
          await saveSeriesResult(seriesId, activeBundle!.category.id, [], true, winnerId)
        } else {
          const courts = form.courts.map((c, i) => ({
            courtNumber: (i + 1) as 1 | 2 | 3,
            homePlayers: c.homePlayers as [string, string],
            awayPlayers: c.awayPlayers as [string, string],
            score: c.score,
            winnerId: c.winner === "home" ? homeTeamId : awayTeamId,
            isWalkover: c.wo,
          }))
          await saveSeriesResult(seriesId, activeBundle!.category.id, courts, false)
        }
        updateForm(seriesId, (prev) => ({ ...prev, saved: true }))
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "Error al guardar")
      }
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
              onValueChange={(v) => {
                if (v) setCategoryId(v)
                setRoundId("")
                setForms({})
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

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-3.5 text-winter" />
              Fecha
            </Label>
            <Select
              value={activeRoundId}
              onValueChange={(v) => setRoundId(v ?? "")}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Seleccioná una fecha" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                    {r.scheduled_date ? ` · ${r.scheduled_date}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {saveError && (
        <p className="text-sm text-destructive">{saveError}</p>
      )}

      {rounds.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No hay fechas cargadas. Importá el fixture primero.
        </p>
      )}

      {activeRound?.series.length === 0 && rounds.length > 0 && (
        <p className="text-sm text-muted-foreground">No hay series para esta fecha.</p>
      )}

      {activeRound?.series.map((s) => {
        const homeTeam = activeBundle?.teamsWithPlayers.find((t) => t.id === s.home_team_id)
        const awayTeam = activeBundle?.teamsWithPlayers.find((t) => t.id === s.away_team_id)
        const homeRoster = homeTeam ? rosterOf(homeTeam) : []
        const awayRoster = awayTeam ? rosterOf(awayTeam) : []
        const homeName = s.home_team?.name ?? s.home_team_id
        const awayName = s.away_team?.name ?? s.away_team_id
        const form = getForm(s.id)

        return (
          <SeriesEditor
            key={s.id}
            home={homeName}
            away={awayName}
            homeTeamId={s.home_team_id}
            awayTeamId={s.away_team_id}
            homeRoster={homeRoster}
            awayRoster={awayRoster}
            form={form}
            isPending={isPending}
            onChange={(updater) => updateForm(s.id, updater)}
            onSave={(form) => handleSave(s.id, s.home_team_id, s.away_team_id, form)}
          />
        )
      })}
    </div>
  )
}

function previewScore(form: SeriesForm) {
  const home = form.courts.filter((c) => c.winner === "home").length
  const away = form.courts.filter((c) => c.winner === "away").length
  return { home, away }
}

function SeriesEditor({
  home,
  away,
  homeTeamId,
  awayTeamId,
  homeRoster,
  awayRoster,
  form,
  isPending,
  onChange,
  onSave,
}: {
  home: string
  away: string
  homeTeamId: string
  awayTeamId: string
  homeRoster: { id: string; name: string }[]
  awayRoster: { id: string; name: string }[]
  form: SeriesForm
  isPending: boolean
  onChange: (updater: (prev: SeriesForm) => SeriesForm) => void
  onSave: (form: SeriesForm) => void
}) {
  const { home: homeScore, away: awayScore } = previewScore(form)
  const decided = homeScore >= 2 || awayScore >= 2
  const allSet = form.generalWo !== null || form.courts.every((c) => c.winner !== null)
  const winner = homeScore > awayScore ? home : awayScore > homeScore ? away : null

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
        score: "6-0 6-0",
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
            <Badge variant="outline" className="gap-1 border-border text-muted-foreground">
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
            {form.generalWo !== null
              ? "WO"
              : `${homeScore} – ${awayScore}`}
          </span>
          {decided && winner && form.generalWo === null && (
            <Badge className="ml-auto gap-1 bg-primary/10 text-primary hover:bg-primary/10">
              <Trophy className="size-3" />
              Gana {winner}
            </Badge>
          )}
          {form.generalWo !== null && (
            <Badge className="ml-auto gap-1 bg-accent/10 text-accent hover:bg-accent/10">
              <ShieldAlert className="size-3" />
              WO general — Gana {form.generalWo === "home" ? home : away}
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

        {form.generalWo === null && (
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
                        setCourt(i, { wo: v === true, score: v === true ? "6-0 6-0" : "" })
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
        )}

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {form.generalWo !== null
              ? "WO general configurado."
              : allSet
                ? "Las 3 canchas tienen ganador."
                : `Faltan ${form.courts.filter((c) => c.winner === null).length} cancha(s) por definir.`}
          </p>
          <Button
            type="button"
            disabled={!allSet || isPending}
            onClick={() => onSave(form)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isPending ? (
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

function PlayerPair({
  label,
  tone,
  roster,
  value,
  onChange,
}: {
  label: string
  tone: "primary" | "accent"
  roster: { id: string; name: string }[]
  value: [string, string]
  onChange: (v: [string, string]) => void
}) {
  return (
    <div className="space-y-1.5">
      <span
        className={cn(
          "inline-block rounded-md px-2 py-0.5 text-xs font-semibold",
          tone === "primary" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent",
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
              <SelectValue placeholder="Jugador" />
            </SelectTrigger>
            <SelectContent>
              {roster.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  )
}
