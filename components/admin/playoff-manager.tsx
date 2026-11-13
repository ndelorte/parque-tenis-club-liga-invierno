"use client"

import { useState, useTransition, useEffect } from "react"
import Link from "next/link"
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
import { InlineError } from "@/components/admin/states"
import {
  type CategoryForAdmin,
  type PlayoffSeriesForAdmin,
  type StandingForAdmin,
  type TeamForAdmin,
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
  generateProvisionalBracket,
  mergeProvisionalBracketWithScheduledMatches,
} from "@/lib/playoffs/generateProvisionalBracket"
import type { ProvisionalBracket, QuarterFinalMatchup } from "@/lib/playoffs/types"
import type { StandingsRow } from "@/lib/tournament/types"
import { canMarkCourtWalkover } from "@/lib/tournament/courtWalkoverRule"

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

// Resultado del último intento de guardado de una serie (se muestra junto al
// botón de guardar).
type SaveFeedback =
  | { status: "saved"; warning?: string }
  | { status: "error"; message: string }

type ActionResult = { success: boolean; error?: string }

const UNAUTHORIZED = "No autorizado"
const UNEXPECTED_SAVE_ERROR = "No se pudo guardar el resultado. Revisá la conexión y probá de nuevo."
const UNEXPECTED_SCHEDULE_ERROR = "No se pudo guardar la fecha. Revisá la conexión y probá de nuevo."

// Error de una action del panel; "No autorizado" = la sesión venció.
function ActionErrorMessage({ message, className }: { message: string; className?: string }) {
  return (
    <InlineError className={className}>
      {message === UNAUTHORIZED ? (
        <>
          Tu sesión venció.{" "}
          <Link href="/panel-liga/login" className="underline underline-offset-2">
            Volvé a ingresar.
          </Link>
        </>
      ) : (
        message
      )}
    </InlineError>
  )
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
  const [teams, setTeams] = useState<TeamForAdmin[]>([])
  const [isPending, startTransition] = useTransition()
  const [bracket, setBracket] = useState<ProvisionalBracket | null>(null)
  const [bracketError, setBracketError] = useState<string | null>(null)
  // Vive acá (no en BracketSection) porque guardar recarga los datos y
  // desmonta la sección: así el aviso de guardado sobrevive al refresh.
  const [feedback, setFeedback] = useState<Record<string, SaveFeedback | undefined>>({})
  const [announcement, setAnnouncement] = useState("")

  function handleFeedback(seriesId: string, next: SaveFeedback | undefined) {
    setFeedback((prev) => ({ ...prev, [seriesId]: next }))
    if (next?.status === "saved") {
      setAnnouncement(next.warning ? `Resultado guardado. ${next.warning}` : "Resultado guardado.")
    } else if (next === undefined) {
      setAnnouncement("")
    }
  }

  function loadData(catId: string) {
    startTransition(async () => {
      const [s, ps, teams] = await Promise.all([
        getStandingsForAdmin(catId),
        getPlayoffSeriesForAdmin(catId),
        getTeamsForAdmin(catId),
      ])
      setPlayoffSeries(ps)
      setTeams(teams)

      // Usar standings reales si hay tantos como equipos, sino usar equipos en orden como provisional
      const teamCount = teams.length
      const effectiveStandings: StandingForAdmin[] =
        s.length >= teamCount
          ? s
          : teams.map((t, i) => ({ teamId: t.id, teamName: t.name, position: i + 1 }))

      try {
        const rows = standingsToRows(effectiveStandings)
        const generated = generateProvisionalBracket(rows, rows.length)
        const merged = mergeProvisionalBracketWithScheduledMatches(
          generated,
          ps
            .filter((p) => p.phase === "quarterfinal")
            .map((p) => ({
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

      <p role="status" className="sr-only">
        {announcement}
      </p>

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
          key={categoryId}
          bracket={bracket}
          categoryId={categoryId}
          playoffSeries={playoffSeries}
          teams={teams}
          feedback={feedback}
          onFeedback={handleFeedback}
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
  teams,
  feedback,
  onFeedback,
  onRefresh,
}: {
  bracket: ProvisionalBracket
  categoryId: string
  playoffSeries: PlayoffSeriesForAdmin[]
  teams: TeamForAdmin[]
  feedback: Record<string, SaveFeedback | undefined>
  onFeedback: (seriesId: string, next: SaveFeedback | undefined) => void
  onRefresh: () => void
}) {
  const [forms, setForms] = useState<Record<string, SeriesForm>>(() => {
    const init: Record<string, SeriesForm> = {}
    for (const s of playoffSeries) init[s.id] = playoffSeriesToForm(s)
    return init
  })
  const [savingId, setSavingId] = useState<string | null>(null)

  // Re-populate forms for any new series that appear after a refresh
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForms((prev) => {
      const next = { ...prev }
      for (const s of playoffSeries) {
        if (!next[s.id]) {
          next[s.id] = playoffSeriesToForm(s)
        }
      }
      return next
    })
  }, [playoffSeries])

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
    onFeedback(seriesId, undefined)
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
    let next: SaveFeedback
    let saved = false
    try {
      const result = await saveSeriesResult({
        seriesId,
        homeTeamId,
        awayTeamId,
        isGeneralWalkover: form.isGeneralWalkover,
        walkoverWinnerId: form.walkoverWinnerId,
        courts,
      })
      if (result.success) {
        saved = true
        updateForm(seriesId, (prev) => ({ ...prev, saved: true }))
        next = { status: "saved", warning: result.warning }
      } else {
        next = { status: "error", message: result.error ?? UNEXPECTED_SAVE_ERROR }
      }
    } catch (e) {
      console.error("No se pudo guardar el resultado de playoff", e)
      next = { status: "error", message: UNEXPECTED_SAVE_ERROR }
    } finally {
      setSavingId(null)
    }
    onFeedback(seriesId, next)
    if (saved) onRefresh()
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
          existingSeries={
            qf.seriesId
              ? playoffSeries.find((s) => s.id === qf.seriesId && s.phase === "quarterfinal")
              : playoffSeries.find(
                  (s) =>
                    s.phase === "quarterfinal" &&
                    ((s.homeTeam.id === qf.home.team.id && s.awayTeam.id === qf.away.team.id) ||
                      (s.homeTeam.id === qf.away.team.id && s.awayTeam.id === qf.home.team.id)),
                )
          }
          form={forms[qf.seriesId ?? ""] ?? null}
          saving={savingId === qf.seriesId}
          feedback={qf.seriesId ? feedback[qf.seriesId] : undefined}
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
        teams={teams}
        onRefresh={onRefresh}
        forms={forms}
        savingId={savingId}
        feedback={feedback}
        onFormChange={updateForm}
        onSaveSeries={handleSaveSeries}
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
  feedback,
  onFormChange,
  onSaveSeries,
  onRefresh,
}: {
  qf: QuarterFinalMatchup
  categoryId: string
  existingSeries?: PlayoffSeriesForAdmin
  form: SeriesForm | null
  saving: boolean
  feedback?: SaveFeedback
  onFormChange: (updater: (prev: SeriesForm) => SeriesForm) => void
  onSaveSeries: (seriesId: string, homeTeamId: string, awayTeamId: string) => void
  onRefresh: () => void
}) {
  const [scheduleDate, setScheduleDate] = useState(existingSeries?.scheduledDate ?? "")
  const [scheduleTime, setScheduleTime] = useState(existingSeries?.scheduledTime ?? "")
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [isScheduling, startScheduling] = useTransition()
  const [showResult, setShowResult] = useState(false)

  // Sync inputs cuando existingSeries llega o cambia después de un refresh
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScheduleDate(existingSeries?.scheduledDate ?? "")
    setScheduleTime(existingSeries?.scheduledTime ?? "")
  }, [existingSeries?.scheduledDate, existingSeries?.scheduledTime])

  // If series already exists (from DB), use its home/away — otherwise use bracket order
  const homeTeamId = existingSeries?.homeTeam.id ?? qf.home.team.id
  const awayTeamId = existingSeries?.awayTeam.id ?? qf.away.team.id
  const homeTeamName = existingSeries?.homeTeam.name ?? qf.home.team.name
  const awayTeamName = existingSeries?.awayTeam.name ?? qf.away.team.name
  const homePlayers: PlayerInfo[] = existingSeries?.homeTeam.players ?? []
  const awayPlayers: PlayerInfo[] = existingSeries?.awayTeam.players ?? []

  async function handleSchedule() {
    if (!scheduleDate) return
    setScheduleError(null)
    startScheduling(async () => {
      let result: ActionResult
      try {
        if (existingSeries) {
          result = await updateSeriesSchedule(existingSeries.id, scheduleDate, scheduleTime)
        } else {
          result = await createQuarterFinalSeries(categoryId, qf.home.team.id, qf.away.team.id, scheduleDate, scheduleTime)
        }
      } catch (e) {
        console.error("No se pudo guardar la fecha de cuartos", e)
        result = { success: false, error: UNEXPECTED_SCHEDULE_ERROR }
      }
      if (!result.success) {
        setScheduleError(result.error ?? "Error al guardar la fecha")
        return
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
            <Badge variant="outline" className="text-xs text-pending border-pending">Programado</Badge>
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
          {scheduleError && <ActionErrorMessage message={scheduleError} />}
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
                feedback={feedback}
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
  teams,
  onRefresh,
  forms,
  savingId,
  feedback,
  onFormChange,
  onSaveSeries,
}: {
  bracket: ProvisionalBracket
  categoryId: string
  playoffSeries: PlayoffSeriesForAdmin[]
  teams: TeamForAdmin[]
  onRefresh: () => void
  forms: Record<string, SeriesForm>
  savingId: string | null
  feedback: Record<string, SaveFeedback | undefined>
  onFormChange: (seriesId: string, updater: (prev: SeriesForm) => SeriesForm) => void
  onSaveSeries: (seriesId: string, homeTeamId: string, awayTeamId: string) => void
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

  // Ganadores reales de cuartos (derivados de winnerTeamId, no del equipo local)
  const qfForSF1WinnerTeam = qfForSF1?.winnerTeamId
    ? (qfForSF1.home.team.id === qfForSF1.winnerTeamId ? qfForSF1.home.team : qfForSF1.away.team)
    : null
  const qfForSF2WinnerTeam = qfForSF2?.winnerTeamId
    ? (qfForSF2.home.team.id === qfForSF2.winnerTeamId ? qfForSF2.home.team : qfForSF2.away.team)
    : null

  const finalExisting = playoffSeries.find((s) => s.phase === "final")
  const thirdPlaceExisting = playoffSeries.find((s) => s.phase === "third_place")

  // Ganadores de semifinales (para asignar correctamente a la final)
  const sf1WinnerId = sf1Existing?.winnerTeamId ?? null
  const sf1WinnerName = sf1WinnerId
    ? (sf1Existing?.homeTeam.id === sf1WinnerId ? sf1Existing?.homeTeam.name : sf1Existing?.awayTeam.name) ?? "?"
    : null
  const sf1WinnerPlayers: PlayerInfo[] = sf1WinnerId
    ? (sf1Existing?.homeTeam.id === sf1WinnerId ? sf1Existing?.homeTeam.players : sf1Existing?.awayTeam.players) ?? []
    : []

  const sf2WinnerId = sf2Existing?.winnerTeamId ?? null
  const sf2WinnerName = sf2WinnerId
    ? (sf2Existing?.homeTeam.id === sf2WinnerId ? sf2Existing?.homeTeam.name : sf2Existing?.awayTeam.name) ?? "?"
    : null
  const sf2WinnerPlayers: PlayerInfo[] = sf2WinnerId
    ? (sf2Existing?.homeTeam.id === sf2WinnerId ? sf2Existing?.homeTeam.players : sf2Existing?.awayTeam.players) ?? []
    : []

  // Perdedores de semifinales
  const sf1LoserId = sf1Existing?.winnerTeamId
    ? (sf1Existing.homeTeam.id === sf1Existing.winnerTeamId ? sf1Existing.awayTeam.id : sf1Existing.homeTeam.id)
    : null
  const sf1LoserName = sf1LoserId
    ? (sf1Existing?.homeTeam.id === sf1LoserId ? sf1Existing?.homeTeam.name : sf1Existing?.awayTeam.name) ?? "?"
    : null
  const sf1LoserPlayers: PlayerInfo[] = sf1LoserId
    ? (sf1Existing?.homeTeam.id === sf1LoserId ? sf1Existing?.homeTeam.players : sf1Existing?.awayTeam.players) ?? []
    : []

  const sf2LoserId = sf2Existing?.winnerTeamId
    ? (sf2Existing.homeTeam.id === sf2Existing.winnerTeamId ? sf2Existing.awayTeam.id : sf2Existing.homeTeam.id)
    : null
  const sf2LoserName = sf2LoserId
    ? (sf2Existing?.homeTeam.id === sf2LoserId ? sf2Existing?.homeTeam.name : sf2Existing?.awayTeam.name) ?? "?"
    : null
  const sf2LoserPlayers: PlayerInfo[] = sf2LoserId
    ? (sf2Existing?.homeTeam.id === sf2LoserId ? sf2Existing?.homeTeam.players : sf2Existing?.awayTeam.players) ?? []
    : []

  // Crea o reprograma la serie; refresca solo si salió bien y devuelve el
  // resultado para que la tarjeta muestre el error.
  async function scheduleSeries(params: Parameters<typeof upsertPlayoffSeries>[0]): Promise<ActionResult> {
    const result = await upsertPlayoffSeries(params)
    if (result.success) onRefresh()
    return result
  }

  const blankForm: SeriesForm = {
    isGeneralWalkover: false,
    walkoverWinnerId: null,
    courts: [blankCourt(), blankCourt(), blankCourt()] as [CourtForm, CourtForm, CourtForm],
    saved: false,
  }

  return (
    <div className="space-y-4">
      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Semifinales</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SFOrFinalCard
          label="SF 1"
          description={sf1Existing
            ? `${sf1Existing.homeTeam.name} vs ${sf1Existing.awayTeam.name}`
            : `${bracket.byes[0].team.name} vs Ganador CF`
          }
          existing={sf1Existing}
          defaultHomeTeamId={sf1Existing?.homeTeam.id ?? bracket.byes[0].team.id}
          defaultAwayTeamId={sf1Existing?.awayTeam.id ?? (qfForSF1WinnerTeam?.id ?? "")}
          homePlayers={sf1Existing?.homeTeam.players ?? []}
          awayPlayers={sf1Existing?.awayTeam.players ?? []}
          teams={teams}
          form={forms[sf1Existing?.id ?? ""] ?? blankForm}
          saving={savingId === sf1Existing?.id}
          feedback={sf1Existing ? feedback[sf1Existing.id] : undefined}
          onFormChange={(updater) => { if (sf1Existing) onFormChange(sf1Existing.id, updater) }}
          onScheduleSave={(date, time, homeId, awayId) =>
            scheduleSeries({
              categoryId,
              phase: "semifinal",
              homeTeamId: homeId,
              awayTeamId: awayId,
              scheduledDate: date,
              scheduledTime: time,
              existingSeriesId: sf1Existing?.id,
            })
          }
          onResultSave={() => {
            if (sf1Existing) onSaveSeries(sf1Existing.id, sf1Existing.homeTeam.id, sf1Existing.awayTeam.id)
          }}
        />
        <SFOrFinalCard
          label="SF 2"
          description={sf2Existing
            ? `${sf2Existing.homeTeam.name} vs ${sf2Existing.awayTeam.name}`
            : isFiveTeam
              ? `${bracket.byes[1].team.name} vs ${bracket.byes[2]?.team.name ?? "A definir"}`
              : `Ganador CF 2 vs ${bracket.byes[1].team.name}`
          }
          existing={sf2Existing}
          defaultHomeTeamId={sf2Existing?.homeTeam.id ?? (isFiveTeam ? bracket.byes[1].team.id : (qfForSF2WinnerTeam?.id ?? ""))}
          defaultAwayTeamId={sf2Existing?.awayTeam.id ?? (isFiveTeam ? (bracket.byes[2]?.team.id ?? "") : bracket.byes[1].team.id)}
          homePlayers={sf2Existing?.homeTeam.players ?? []}
          awayPlayers={sf2Existing?.awayTeam.players ?? []}
          teams={teams}
          form={forms[sf2Existing?.id ?? ""] ?? blankForm}
          saving={savingId === sf2Existing?.id}
          feedback={sf2Existing ? feedback[sf2Existing.id] : undefined}
          onFormChange={(updater) => { if (sf2Existing) onFormChange(sf2Existing.id, updater) }}
          onScheduleSave={(date, time, homeId, awayId) =>
            scheduleSeries({
              categoryId,
              phase: "semifinal",
              homeTeamId: homeId,
              awayTeamId: awayId,
              scheduledDate: date,
              scheduledTime: time,
              existingSeriesId: sf2Existing?.id,
            })
          }
          onResultSave={() => {
            if (sf2Existing) onSaveSeries(sf2Existing.id, sf2Existing.homeTeam.id, sf2Existing.awayTeam.id)
          }}
        />
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Final</p>
          <SFOrFinalCard
            label="Final"
            description={sf1WinnerName && sf2WinnerName
              ? `${sf1WinnerName} vs ${sf2WinnerName}`
              : "Ganador SF 1 vs Ganador SF 2"
            }
            existing={finalExisting}
            defaultHomeTeamId={finalExisting?.homeTeam.id ?? sf1WinnerId ?? ""}
            defaultAwayTeamId={finalExisting?.awayTeam.id ?? sf2WinnerId ?? ""}
            homePlayers={finalExisting?.homeTeam.players ?? sf1WinnerPlayers}
            awayPlayers={finalExisting?.awayTeam.players ?? sf2WinnerPlayers}
            teams={teams}
            form={forms[finalExisting?.id ?? ""] ?? blankForm}
            saving={savingId === finalExisting?.id}
            feedback={finalExisting ? feedback[finalExisting.id] : undefined}
            onFormChange={(updater) => { if (finalExisting) onFormChange(finalExisting.id, updater) }}
            onScheduleSave={(date, time, homeId, awayId) =>
              scheduleSeries({
                categoryId,
                phase: "final",
                homeTeamId: homeId,
                awayTeamId: awayId,
                scheduledDate: date,
                scheduledTime: time,
                existingSeriesId: finalExisting?.id,
              })
            }
            onResultSave={() => {
              if (finalExisting) onSaveSeries(finalExisting.id, finalExisting.homeTeam.id, finalExisting.awayTeam.id)
            }}
          />
        </div>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">3er y 4to Puesto</p>
          <SFOrFinalCard
            label="3° / 4°"
            description={sf1LoserName && sf2LoserName
              ? `${sf1LoserName} vs ${sf2LoserName}`
              : "Perdedor SF 1 vs Perdedor SF 2"
            }
            existing={thirdPlaceExisting}
            defaultHomeTeamId={thirdPlaceExisting?.homeTeam.id ?? sf1LoserId ?? ""}
            defaultAwayTeamId={thirdPlaceExisting?.awayTeam.id ?? sf2LoserId ?? ""}
            homePlayers={thirdPlaceExisting?.homeTeam.players ?? sf1LoserPlayers}
            awayPlayers={thirdPlaceExisting?.awayTeam.players ?? sf2LoserPlayers}
            teams={teams}
            form={forms[thirdPlaceExisting?.id ?? ""] ?? blankForm}
            saving={savingId === thirdPlaceExisting?.id}
            feedback={thirdPlaceExisting ? feedback[thirdPlaceExisting.id] : undefined}
            onFormChange={(updater) => { if (thirdPlaceExisting) onFormChange(thirdPlaceExisting.id, updater) }}
            onScheduleSave={(date, time, homeId, awayId) =>
              scheduleSeries({
                categoryId,
                phase: "third_place",
                homeTeamId: homeId,
                awayTeamId: awayId,
                scheduledDate: date,
                scheduledTime: time,
                existingSeriesId: thirdPlaceExisting?.id,
              })
            }
            onResultSave={() => {
              if (thirdPlaceExisting) onSaveSeries(thirdPlaceExisting.id, thirdPlaceExisting.homeTeam.id, thirdPlaceExisting.awayTeam.id)
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── SF / Final card (schedule + result editor) ───────────────────────────────

function SFOrFinalCard({
  label,
  description,
  existing,
  defaultHomeTeamId,
  defaultAwayTeamId,
  homePlayers,
  awayPlayers,
  teams,
  form,
  saving,
  feedback,
  onFormChange,
  onScheduleSave,
  onResultSave,
}: {
  label: string
  description: string
  existing?: PlayoffSeriesForAdmin
  defaultHomeTeamId: string
  defaultAwayTeamId: string
  homePlayers: PlayerInfo[]
  awayPlayers: PlayerInfo[]
  teams: { id: string; name: string }[]
  form: SeriesForm
  saving: boolean
  feedback?: SaveFeedback
  onFormChange: (updater: (prev: SeriesForm) => SeriesForm) => void
  onScheduleSave: (date: string, time: string, homeTeamId: string, awayTeamId: string) => Promise<ActionResult>
  onResultSave: () => void
}) {
  const [date, setDate] = useState(existing?.scheduledDate ?? "")
  const [time, setTime] = useState(existing?.scheduledTime ?? "")
  const [selectedHomeId, setSelectedHomeId] = useState(defaultHomeTeamId)
  const [selectedAwayId, setSelectedAwayId] = useState(defaultAwayTeamId)
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDate(existing?.scheduledDate ?? "")
    setTime(existing?.scheduledTime ?? "")
  }, [existing?.scheduledDate, existing?.scheduledTime])

  // When series is created, sync selected IDs from DB data. Depende solo de
  // existing?.id (no del objeto completo) a propósito: re-sincroniza cuando
  // cambia la serie, no en cada render con una referencia nueva de `existing`.
  useEffect(() => {
    if (existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedHomeId(existing.homeTeam.id)
      setSelectedAwayId(existing.awayTeam.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id])

  const effectiveHomeId = existing ? existing.homeTeam.id : selectedHomeId
  const effectiveAwayId = existing ? existing.awayTeam.id : selectedAwayId
  const effectiveHomeName = existing
    ? existing.homeTeam.name
    : (teams.find((t) => t.id === selectedHomeId)?.name ?? "")
  const effectiveAwayName = existing
    ? existing.awayTeam.name
    : (teams.find((t) => t.id === selectedAwayId)?.name ?? "")

  const canCreate = !existing && !!selectedHomeId && !!selectedAwayId && selectedHomeId !== selectedAwayId
  const canSchedule = !!date && (existing ? true : canCreate)

  async function handleScheduleSave() {
    if (!canSchedule) return
    setScheduleSaving(true)
    setScheduleError(null)
    try {
      const result = await onScheduleSave(date, time, effectiveHomeId, effectiveAwayId)
      if (!result.success) setScheduleError(result.error ?? UNEXPECTED_SCHEDULE_ERROR)
    } catch (e) {
      console.error("No se pudo guardar la fecha del playoff", e)
      setScheduleError(UNEXPECTED_SCHEDULE_ERROR)
    } finally {
      setScheduleSaving(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{label}</Badge>
        {existing?.status === "completed" && (
          <Badge className="text-xs bg-primary text-primary-foreground">Jugado</Badge>
        )}
        {existing?.scheduledDate && existing?.status !== "completed" && (
          <Badge className="text-xs bg-primary/10 text-primary hover:bg-primary/10">Programado</Badge>
        )}
      </div>

      {existing ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Trophy className="size-3.5 text-accent" />
            Asignar participantes
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Local</Label>
              <Select
                value={selectedHomeId || NULL_VALUE}
                onValueChange={(v: string | null) => setSelectedHomeId(!v || v === NULL_VALUE ? "" : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar equipo">
                    {selectedHomeId ? teams.find((t) => t.id === selectedHomeId)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULL_VALUE}>Sin asignar</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id} disabled={t.id === selectedAwayId}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Visitante</Label>
              <Select
                value={selectedAwayId || NULL_VALUE}
                onValueChange={(v: string | null) => setSelectedAwayId(!v || v === NULL_VALUE ? "" : v)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Seleccionar equipo">
                    {selectedAwayId ? teams.find((t) => t.id === selectedAwayId)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULL_VALUE}>Sin asignar</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id} disabled={t.id === selectedHomeId}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

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
        disabled={!canSchedule || scheduleSaving}
        onClick={handleScheduleSave}
      >
        {scheduleSaving ? <Loader2 className="size-4 animate-spin" /> : existing ? <Save className="size-4" /> : <Plus className="size-4" />}
        {existing ? "Actualizar fecha" : "Crear partido"}
      </Button>
      {scheduleError && <ActionErrorMessage message={scheduleError} />}
      {!existing && !canCreate && (
        <p className="text-xs text-muted-foreground">Seleccioná dos equipos distintos para crear el partido.</p>
      )}
      {existing?.scheduledDate && (
        <p className="text-xs text-muted-foreground">
          <Clock className="size-3 inline mr-1" />
          {formatDate(existing.scheduledDate)}
          {existing.scheduledTime ? ` ${formatTime(existing.scheduledTime)}` : ""}
        </p>
      )}

      {existing && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setShowResult((v) => !v)}
          >
            {showResult ? "Ocultar resultado" : "Cargar / editar resultado"}
          </Button>

          {showResult && (
            <PlayoffSeriesEditor
              homeTeamId={effectiveHomeId}
              awayTeamId={effectiveAwayId}
              homeTeamName={effectiveHomeName}
              awayTeamName={effectiveAwayName}
              homePlayers={homePlayers}
              awayPlayers={awayPlayers}
              form={form}
              saving={saving}
              feedback={feedback}
              onChange={onFormChange}
              onSave={onResultSave}
            />
          )}
        </>
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
  feedback,
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
  feedback?: SaveFeedback
  onChange: (updater: (prev: SeriesForm) => SeriesForm) => void
  onSave: () => void
}) {
  // "Guardado ✓" solo después de guardar en esta sesión y hasta que se edite.
  const justSaved = form.saved && feedback?.status === "saved"
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
        // Las canchas vuelven a estar en blanco (se conservan los jugadores
        // asignados): si quedaran con W.O., el servidor rechaza el guardado.
        const courts = prev.courts.map((c) => ({
          ...blankCourt(),
          homePlayer1Id: c.homePlayer1Id,
          homePlayer2Id: c.homePlayer2Id,
          awayPlayer1Id: c.awayPlayer1Id,
          awayPlayer2Id: c.awayPlayer2Id,
        })) as SeriesForm["courts"]
        return { ...prev, isGeneralWalkover: false, walkoverWinnerId: null, courts, saved: false }
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
                  disabled={!canMarkCourtWalkover(i + 1) && !court.wo}
                  title={canMarkCourtWalkover(i + 1) ? undefined : "El WO de cancha es siempre la cancha 3"}
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
          {saving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : justSaved ? null : form.saved ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Save className="size-4" aria-hidden />
          )}
          {saving ? "Guardando…" : justSaved ? "Guardado ✓" : form.saved ? "Actualizar" : "Guardar resultado"}
        </Button>
      </div>
      {/* El anuncio para lectores de pantalla está en PlayoffManager: al guardar
          se recargan los datos y este editor se desmonta. */}
      {feedback?.status === "error" && (
        <ActionErrorMessage message={feedback.message} className="justify-end text-right" />
      )}
      {justSaved && feedback?.status === "saved" && feedback.warning && (
        <InlineError className="justify-end text-right">{feedback.warning}</InlineError>
      )}
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
