"use client"

import { useState, useTransition, useEffect } from "react"
import {
  Trophy,
  Save,
  Check,
  ShieldAlert,
  MapPin,
  Loader2,
  CalendarDays,
  Clock,
  Plus,
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
  type PlayoffSeriesForAdmin,
  type StandingForAdmin,
  type CourtInput,
  type PlayerInfo,
  getStandingsForAdmin,
  getPlayoffSeriesForAdmin,
  getTeamsForAdmin,
  createQuarterFinalSeries,
  saveSeriesResult,
  updateSeriesSchedule,
  upsertPlayoffSeries,
} from "@/app/actions/admin"
import {
  generateSixTeamQuarterfinals,
  generateFiveTeamQuarterfinals,
  mergeProvisionalBracketWithScheduledMatches,
} from "@/lib/playoffs/generateProvisionalBracket"
import type { ProvisionalBracket, QuarterFinalMatchup } from "@/lib/playoffs/types"
import type { StandingsRow } from "@/lib/tournament/types"

// ─── helpers ─────────────────────────────────────────────────────────────────

function standingsToRows(standings: StandingForAdmin[]): StandingsRow[] {
  return standings.map((s) => ({
    team_id: s.teamId,
    team: { id: s.teamId, name: s.teamName, slug: "", category_id: "", active: true },
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
    position: s.position,
  }))
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

function formatTime(t: string): string {
  return t.slice(0, 5) + " hs"
}

// ─── Court form types ─────────────────────────────────────────────────────────

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

function playoffSeriesToForm(s: PlayoffSeriesForAdmin): SeriesForm {
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

// ─── Main component ───────────────────────────────────────────────────────────

export function PlayoffManager({ categories }: { categories: CategoryForAdmin[] }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "")
  const [playoffSeries, setPlayoffSeries] = useState<PlayoffSeriesForAdmin[]>([])
  const [isPending, startTransition] = useTransition()
  const [bracket, setBracket] = useState<ProvisionalBracket | null>(null)
  const [bracketError, setBracketError] = useState<string | null>(null)

  function loadData(catId: string) {
    startTransition(async () => {
      const [s, ps, teams] = await Promise.all([
        getStandingsForAdmin(catId),
        getPlayoffSeriesForAdmin(catId),
        getTeamsForAdmin(catId),
      ])
      setPlayoffSeries(ps)

      // Usar standings reales si hay tantos como equipos, sino usar equipos en orden como provisional
      const teamCount = teams.length
      const effectiveStandings: StandingForAdmin[] =
        s.length >= teamCount
          ? s
          : teams.map((t, i) => ({ teamId: t.id, teamName: t.name, position: i + 1 }))

      try {
        const rows = standingsToRows(effectiveStandings)
        const generated = teamCount === 5
          ? generateFiveTeamQuarterfinals(rows)
          : generateSixTeamQuarterfinals(rows)
        const merged = mergeProvisionalBracketWithScheduledMatches(
          generated,
          ps.map((p) => ({
            id: p.id,
            home_team_id: p.homeTeam.id,
            away_team_id: p.awayTeam.id,
            scheduled_date: p.scheduledDate ?? undefined,
            scheduled_time: p.scheduledTime ?? undefined,
            status: p.status,
            winner_team_id: p.winnerTeamId,
          }))
        )
        setBracket(merged)
        setBracketError(null)
      } catch (e) {
        setBracket(null)
        setBracketError(e instanceof Error ? e.message : String(e))
      }
    })
  }

  useEffect(() => {
    if (categoryId) loadData(categoryId)
  }, [categoryId])

  return (
    <div className="space-y-6">
      <Card className="border-t-4 border-t-primary">
        <CardContent className="pt-6">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Trophy className="size-3.5 text-accent" />
              Categoría
            </Label>
            <Select value={categoryId} onValueChange={(v) => { if (v) setCategoryId(v) }}>
              <SelectTrigger className="h-11 max-w-xs">
                <SelectValue placeholder="Seleccioná una categoría">
                  {categories.find((c) => c.id === categoryId)?.name}
                </SelectValue>
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
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : bracketError ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {bracketError}
          </CardContent>
        </Card>
      ) : bracket ? (
        <BracketSection
          bracket={bracket}
          categoryId={categoryId}
          playoffSeries={playoffSeries}
          onRefresh={() => loadData(categoryId)}
        />
      ) : null}
    </div>
  )
}

// ─── Bracket section ──────────────────────────────────────────────────────────

function BracketSection({
  bracket,
  categoryId,
  playoffSeries,
  onRefresh,
}: {
  bracket: ProvisionalBracket
  categoryId: string
  playoffSeries: PlayoffSeriesForAdmin[]
  onRefresh: () => void
}) {
  const [forms, setForms] = useState<Record<string, SeriesForm>>(() => {
    const init: Record<string, SeriesForm> = {}
    for (const s of playoffSeries) init[s.id] = playoffSeriesToForm(s)
    return init
  })
  const [savingId, setSavingId] = useState<string | null>(null)

  function updateForm(seriesId: string, updater: (prev: SeriesForm) => SeriesForm) {
    setForms((prev) => ({
      ...prev,
      [seriesId]: updater(
        prev[seriesId] ?? {
          isGeneralWalkover: false,
          walkoverWinnerId: null,
          courts: [blankCourt(), blankCourt(), blankCourt()],
          saved: false,
        }
      ),
    }))
  }

  async function handleSaveSeries(seriesId: string, homeTeamId: string, awayTeamId: string) {
    const form = forms[seriesId]
    if (!form) return
    setSavingId(seriesId)
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
      seriesId,
      homeTeamId,
      awayTeamId,
      isGeneralWalkover: form.isGeneralWalkover,
      walkoverWinnerId: form.walkoverWinnerId,
      courts,
    })
    setSavingId(null)
    if (result.success) {
      updateForm(seriesId, (prev) => ({ ...prev, saved: true }))
      onRefresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-lg font-bold text-foreground">Fase Final</h2>
        <Badge variant="outline" className="text-muted-foreground text-xs">Provisorio</Badge>
      </div>

      {bracket.byes.map((bye) => (
        <ByeCard key={bye.seed} seed={bye.seed} teamName={bye.team.name} />
      ))}

      {bracket.quarterfinals.map((qf) => (
        <QFCard
          key={qf.matchNumber}
          qf={qf}
          categoryId={categoryId}
          existingSeries={playoffSeries.find(
            (s) =>
              (s.homeTeam.id === qf.home.team.id && s.awayTeam.id === qf.away.team.id) ||
              (s.homeTeam.id === qf.away.team.id && s.awayTeam.id === qf.home.team.id)
          )}
          form={forms[qf.seriesId ?? ""] ?? null}
          saving={savingId === qf.seriesId}
          onFormChange={(updater) => {
            if (qf.seriesId) updateForm(qf.seriesId, updater)
          }}
          onSaveSeries={(id, hId, aId) => handleSaveSeries(id, hId, aId)}
          onRefresh={onRefresh}
        />
      ))}

      {/* Semifinales y final */}
      <SemiFinalAndFinalSection
        bracket={bracket}
        categoryId={categoryId}
        playoffSeries={playoffSeries}
        onRefresh={onRefresh}
      />
    </div>
  )
}

// ─── Bye card ────────────────────────────────────────────────────────────────

function ByeCard({ seed, teamName }: { seed: number; teamName: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
      <SeedBadge seed={seed} />
      <span className="font-medium text-foreground flex-1">{teamName}</span>
      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">BYE — Semifinal</Badge>
    </div>
  )
}

// ─── QF Card ─────────────────────────────────────────────────────────────────

function QFCard({
  qf,
  categoryId,
  existingSeries,
  form,
  saving,
  onFormChange,
  onSaveSeries,
  onRefresh,
}: {
  qf: QuarterFinalMatchup
  categoryId: string
  existingSeries?: PlayoffSeriesForAdmin
  form: SeriesForm | null
  saving: boolean
  onFormChange: (updater: (prev: SeriesForm) => SeriesForm) => void
  onSaveSeries: (seriesId: string, homeTeamId: string, awayTeamId: string) => void
  onRefresh: () => void
}) {
  const [scheduleDate, setScheduleDate] = useState(existingSeries?.scheduledDate ?? "")
  const [scheduleTime, setScheduleTime] = useState(existingSeries?.scheduledTime ?? "")
  const [isScheduling, startScheduling] = useTransition()
  const [showResult, setShowResult] = useState(false)

  // If series already exists (from DB), use its home/away — otherwise use bracket order
  const homeTeamId = existingSeries?.homeTeam.id ?? qf.home.team.id
  const awayTeamId = existingSeries?.awayTeam.id ?? qf.away.team.id
  const homeTeamName = existingSeries?.homeTeam.name ?? qf.home.team.name
  const awayTeamName = existingSeries?.awayTeam.name ?? qf.away.team.name
  const homePlayers: PlayerInfo[] = existingSeries?.homeTeam.players ?? []
  const awayPlayers: PlayerInfo[] = existingSeries?.awayTeam.players ?? []

  async function handleSchedule() {
    if (!scheduleDate) return
    startScheduling(async () => {
      if (existingSeries) {
        await updateSeriesSchedule(existingSeries.id, scheduleDate, scheduleTime)
      } else {
        await createQuarterFinalSeries(categoryId, qf.home.team.id, qf.away.team.id, scheduleDate, scheduleTime)
      }
      onRefresh()
    })
  }

  const seriesForm = form ?? {
    isGeneralWalkover: false,
    walkoverWinnerId: null,
    courts: [blankCourt(), blankCourt(), blankCourt()] as [CourtForm, CourtForm, CourtForm],
    saved: false,
  }

  return (
    <Card className="border-t-4 border-t-accent overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium">Cuartos de Final</Badge>
          {qf.status === "completed" && (
            <Badge className="bg-primary text-primary-foreground text-xs">Jugado</Badge>
          )}
          {qf.status === "scheduled" && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Programado</Badge>
          )}
        </div>
        <CardTitle className="font-heading text-base">
          <span className="inline-flex items-center gap-1.5">
            <SeedBadge seed={qf.home.seed} />
            <span>{homeTeamName}</span>
          </span>
          <span className="px-2 text-muted-foreground">vs</span>
          <span className="inline-flex items-center gap-1.5">
            <SeedBadge seed={qf.away.seed} />
            <span>{awayTeamName}</span>
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Schedule section */}
        <div className="rounded-xl border border-dashed border-border p-3 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            Fecha y horario
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Fecha</Label>
              <Input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Hora</Label>
              <Input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!scheduleDate || isScheduling}
            onClick={handleSchedule}
            variant="outline"
            className="w-full"
          >
            {isScheduling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : existingSeries ? (
              <Save className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {existingSeries ? "Actualizar fecha" : "Crear partido y programar fecha"}
          </Button>
          {existingSeries?.scheduledDate && (
            <p className="text-xs text-muted-foreground">
              <Clock className="size-3 inline mr-1" />
              Programado: {formatDate(existingSeries.scheduledDate)}
              {existingSeries.scheduledTime ? ` ${formatTime(existingSeries.scheduledTime)}` : ""}
            </p>
          )}
        </div>

        {/* Result section — only if series exists */}
        {existingSeries && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setShowResult((v) => !v)}
            >
              {showResult ? "Ocultar resultado" : "Cargar / editar resultado"}
            </Button>

            {showResult && (
              <PlayoffSeriesEditor
                homeTeamId={homeTeamId}
                awayTeamId={awayTeamId}
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                homePlayers={homePlayers}
                awayPlayers={awayPlayers}
                form={seriesForm}
                saving={saving}
                onChange={onFormChange}
                onSave={() => onSaveSeries(existingSeries.id, homeTeamId, awayTeamId)}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Semifinal / Final scheduling ────────────────────────────────────────────

function SemiFinalAndFinalSection({
  bracket,
  categoryId,
  playoffSeries,
  onRefresh,
}: {
  bracket: ProvisionalBracket
  categoryId: string
  playoffSeries: PlayoffSeriesForAdmin[]
  onRefresh: () => void
}) {
  const isFiveTeam = bracket.format === "five_team"

  // SF1: siempre involucra al 1° (byes[0])
  const sf1Existing = playoffSeries.find(
    (s) => s.phase === "semifinal" &&
      (s.homeTeam.id === bracket.byes[0].team.id || s.awayTeam.id === bracket.byes[0].team.id),
  )
  // SF2: involucra al 2° (byes[1]) en ambos formatos
  const sf2Existing = playoffSeries.find(
    (s) => s.phase === "semifinal" && s.id !== sf1Existing?.id &&
      (s.homeTeam.id === bracket.byes[1].team.id || s.awayTeam.id === bracket.byes[1].team.id),
  ) ?? playoffSeries.find((s) => s.phase === "semifinal" && s.id !== sf1Existing?.id)

  // QF que alimenta SF1: para 5 equipos es quarterfinals[0]; para 6 equipos es quarterfinals[1] (4°vs5°)
  const qfForSF1 = isFiveTeam ? bracket.quarterfinals[0] : bracket.quarterfinals[1]
  // QF que alimenta SF2: solo existe en formato 6 equipos (quarterfinals[0] = 3°vs6°)
  const qfForSF2 = isFiveTeam ? null : bracket.quarterfinals[0]

  const finalExisting = playoffSeries.find((s) => s.phase === "final")
  const thirdPlaceExisting = playoffSeries.find((s) => s.phase === "third_place")

  // Perdedores de las semifinales (disponibles una vez que hay resultado)
  const sf1LoserId = sf1Existing?.winnerTeamId
    ? (sf1Existing.homeTeam.id === sf1Existing.winnerTeamId
        ? sf1Existing.awayTeam.id
        : sf1Existing.homeTeam.id)
    : null
  const sf1LoserName = sf1LoserId
    ? (sf1Existing?.homeTeam.id === sf1LoserId
        ? sf1Existing?.homeTeam.name
        : sf1Existing?.awayTeam.name) ?? "?"
    : null

  const sf2LoserId = sf2Existing?.winnerTeamId
    ? (sf2Existing.homeTeam.id === sf2Existing.winnerTeamId
        ? sf2Existing.awayTeam.id
        : sf2Existing.homeTeam.id)
    : null
  const sf2LoserName = sf2LoserId
    ? (sf2Existing?.homeTeam.id === sf2LoserId
        ? sf2Existing?.homeTeam.name
        : sf2Existing?.awayTeam.name) ?? "?"
    : null

  return (
    <div className="space-y-4">
      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Semifinales</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PlayoffScheduleCard
          label="SF 1"
          description={`${bracket.byes[0].team.name} vs Ganador CF`}
          existing={sf1Existing}
          onSave={async (date, time) => {
            await upsertPlayoffSeries({
              categoryId,
              phase: "semifinal",
              homeTeamId: bracket.byes[0].team.id,
              awayTeamId: qfForSF1?.home.team.id ?? bracket.byes[0].team.id,
              scheduledDate: date,
              scheduledTime: time,
              existingSeriesId: sf1Existing?.id,
            })
            onRefresh()
          }}
        />
        <PlayoffScheduleCard
          label="SF 2"
          description={
            isFiveTeam
              ? `${bracket.byes[1].team.name} vs ${bracket.byes[2]?.team.name ?? "A definir"}`
              : `Ganador CF 2 vs ${bracket.byes[1].team.name}`
          }
          existing={sf2Existing}
          onSave={async (date, time) => {
            await upsertPlayoffSeries({
              categoryId,
              phase: "semifinal",
              homeTeamId: isFiveTeam ? bracket.byes[1].team.id : (qfForSF2?.home.team.id ?? bracket.byes[1].team.id),
              awayTeamId: isFiveTeam ? (bracket.byes[2]?.team.id ?? bracket.byes[1].team.id) : bracket.byes[1].team.id,
              scheduledDate: date,
              scheduledTime: time,
              existingSeriesId: sf2Existing?.id,
            })
            onRefresh()
          }}
        />
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final</p>
          <PlayoffScheduleCard
            label="Final"
            description="Ganador SF 1 vs Ganador SF 2"
            existing={finalExisting}
            onSave={async (date, time) => {
              await upsertPlayoffSeries({
                categoryId,
                phase: "final",
                homeTeamId: bracket.byes[0].team.id,
                awayTeamId: bracket.byes[1].team.id,
                scheduledDate: date,
                scheduledTime: time,
                existingSeriesId: finalExisting?.id,
              })
              onRefresh()
            }}
          />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">3er y 4to Puesto</p>
          <PlayoffScheduleCard
            label="3° / 4°"
            description={
              sf1LoserName && sf2LoserName
                ? `${sf1LoserName} vs ${sf2LoserName}`
                : "Perdedor SF 1 vs Perdedor SF 2"
            }
            existing={thirdPlaceExisting}
            onSave={async (date, time) => {
              await upsertPlayoffSeries({
                categoryId,
                phase: "third_place",
                // Usar los perdedores reales si se conocen; sino placeholder (1° y 2°)
                homeTeamId: sf1LoserId ?? bracket.byes[0].team.id,
                awayTeamId: sf2LoserId ?? bracket.byes[1].team.id,
                scheduledDate: date,
                scheduledTime: time,
                existingSeriesId: thirdPlaceExisting?.id,
              })
              onRefresh()
            }}
          />
        </div>
      </div>
    </div>
  )
}

function PlayoffScheduleCard({
  label,
  description,
  existing,
  onSave,
}: {
  label: string
  description: string
  existing?: PlayoffSeriesForAdmin
  onSave: (date: string, time: string) => Promise<void>
}) {
  const [date, setDate] = useState(existing?.scheduledDate ?? "")
  const [time, setTime] = useState(existing?.scheduledTime ?? "")
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!date) return
    setSaving(true)
    await onSave(date, time)
    setSaving(false)
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{label}</Badge>
        {existing?.scheduledDate && (
          <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/10">Programado</Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Hora</Label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9" />
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full"
        disabled={!date || saving}
        onClick={handleSave}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : existing ? <Save className="size-4" /> : <Plus className="size-4" />}
        {existing ? "Actualizar fecha" : "Programar"}
      </Button>
      {existing?.scheduledDate && (
        <p className="text-xs text-muted-foreground">
          <Clock className="size-3 inline mr-1" />
          {formatDate(existing.scheduledDate)}
          {existing.scheduledTime ? ` ${formatTime(existing.scheduledTime)}` : ""}
        </p>
      )}
    </div>
  )
}

// ─── Playoff Series Editor (same logic as SeriesEditor in result-loader) ─────

function PlayoffSeriesEditor({
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
  form,
  saving,
  onChange,
  onSave,
}: {
  homeTeamId: string
  awayTeamId: string
  homeTeamName: string
  awayTeamName: string
  homePlayers: PlayerInfo[]
  awayPlayers: PlayerInfo[]
  form: SeriesForm
  saving: boolean
  onChange: (updater: (prev: SeriesForm) => SeriesForm) => void
  onSave: () => void
}) {
  const homeCourts = form.courts.filter((c) => c.winnerTeamId === homeTeamId).length
  const awayCourts = form.courts.filter((c) => c.winnerTeamId === awayTeamId).length
  const decided = homeCourts >= 2 || awayCourts >= 2
  const allSet = form.isGeneralWalkover
    ? !!form.walkoverWinnerId
    : form.courts.every((c) => c.winnerTeamId !== null)
  const winner =
    homeCourts > awayCourts ? homeTeamName : awayCourts > homeCourts ? awayTeamName : null

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
      return { ...prev, isGeneralWalkover: true, walkoverWinnerId: teamId, courts, saved: false }
    })
  }

  return (
    <div className="space-y-4 pt-2 border-t border-border">
      {!form.isGeneralWalkover && (
        <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resultado</span>
          <span className="font-heading text-xl font-extrabold text-foreground">
            {homeCourts}<span className="px-1 text-muted-foreground">–</span>{awayCourts}
          </span>
          {decided && winner && (
            <Badge className="ml-auto gap-1 bg-primary/10 text-primary hover:bg-primary/10">
              <Trophy className="size-3" />Gana {winner}
            </Badge>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border p-3">
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <ShieldAlert className="size-4 text-accent" />W.O. general
        </span>
        <div className="ml-auto flex gap-2">
          <Button type="button" size="sm"
            variant={form.walkoverWinnerId === homeTeamId ? "default" : "outline"}
            onClick={() => setGeneralWo(form.walkoverWinnerId === homeTeamId ? null : homeTeamId)}>
            {homeTeamName}
          </Button>
          <Button type="button" size="sm"
            variant={form.walkoverWinnerId === awayTeamId ? "default" : "outline"}
            onClick={() => setGeneralWo(form.walkoverWinnerId === awayTeamId ? null : awayTeamId)}>
            {awayTeamName}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {form.courts.map((court, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border border-l-4 border-l-winter bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MapPin className="size-3.5 text-winter" />Cancha {i + 1}
              </span>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground">
                <Checkbox
                  checked={court.wo}
                  onCheckedChange={(v) => setCourt(i, { wo: v === true, score: v === true ? "W.O." : "" })}
                />W.O.
              </label>
            </div>

            <PlayerPairSelector label={homeTeamName} tone="primary" players={homePlayers}
              value={[court.homePlayer1Id, court.homePlayer2Id]}
              onChange={([p1, p2]) => setCourt(i, { homePlayer1Id: p1, homePlayer2Id: p2 })} />
            <PlayerPairSelector label={awayTeamName} tone="accent" players={awayPlayers}
              value={[court.awayPlayer1Id, court.awayPlayer2Id]}
              onChange={([p1, p2]) => setCourt(i, { awayPlayer1Id: p1, awayPlayer2Id: p2 })} />

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Resultado</Label>
              <Input value={court.score} placeholder="6-4 6-3" disabled={court.wo}
                onChange={(e) => setCourt(i, { score: e.target.value })} className="h-9" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" size="sm"
                variant={court.winnerTeamId === homeTeamId ? "default" : "outline"}
                onClick={() => setCourt(i, { winnerTeamId: homeTeamId })} className="text-xs">
                Gana {homeTeamName}
              </Button>
              <Button type="button" size="sm"
                variant={court.winnerTeamId === awayTeamId ? "default" : "outline"}
                onClick={() => setCourt(i, { winnerTeamId: awayTeamId })} className="text-xs">
                Gana {awayTeamName}
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
        <Button type="button" disabled={!allSet || saving} onClick={onSave}
          className="bg-primary text-primary-foreground hover:bg-primary/90">
          {saving ? <Loader2 className="size-4 animate-spin" /> : form.saved ? <Check className="size-4" /> : <Save className="size-4" />}
          {form.saved ? "Actualizar" : "Guardar resultado"}
        </Button>
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SeedBadge({ seed }: { seed: number }) {
  return (
    <span className="shrink-0 inline-flex items-center justify-center size-5 rounded-full bg-muted font-bold text-muted-foreground text-[10px]">
      {seed}°
    </span>
  )
}

const NULL_VALUE = "__null__"

function PlayerPairSelector({
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
          tone === "primary" ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent"
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
              const next: [string | null, string | null] = [...value] as [string | null, string | null]
              next[idx] = v === NULL_VALUE ? null : v
              onChange(next)
            }}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Sin asignar">
                {value[idx] != null
                  ? players.find((p) => p.id === value[idx])?.displayName
                  : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NULL_VALUE}>Sin asignar</SelectItem>
              {players.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>
    </div>
  )
}
