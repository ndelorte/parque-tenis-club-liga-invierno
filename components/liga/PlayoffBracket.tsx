import { Trophy, Clock, CheckCircle2, AlertCircle, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProvisionalBracket, QuarterFinalMatchup, PlayoffSlot } from "@/lib/playoffs/types"

type ThirdPlace = {
  homeTeamName?: string
  awayTeamName?: string
  scheduledDate?: string
  scheduledTime?: string
  status?: string
}

interface Props {
  bracket: ProvisionalBracket
  thirdPlace?: ThirdPlace
}

export function PlayoffBracket({ bracket, thirdPlace }: Props) {
  return (
    <div>
      <div className="mb-4">
        <h3 className="font-semibold text-gray-800">Fase Final</h3>
        <p className="text-sm text-gray-500 mt-0.5">Con las posiciones actuales provisorias</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-10">
        {/* Bracket principal */}
        <div className="space-y-3 max-w-xl flex-1">
          <ByeRow slot={bracket.byes[0]} />
          <QFRow qf={bracket.quarterfinals[0]} />
          <QFRow qf={bracket.quarterfinals[1]} />
          <ByeRow slot={bracket.byes[1]} />
        </div>

        {/* 3er y 4to puesto — siempre visible, desconectado del bracket principal */}
        <div className="lg:w-72 lg:shrink-0">
          <p className="text-xs text-gray-400 mb-2 italic">Partido separado</p>
          <ThirdPlaceCard thirdPlace={thirdPlace} />
        </div>
      </div>
    </div>
  )
}

function ByeRow({ slot }: { slot: PlayoffSlot }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <SeedBadge seed={slot.seed} />
      <span className="font-medium text-gray-900 flex-1 min-w-0 truncate">
        {slot.team.name}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-primary bg-primary/10 rounded-md px-2 py-0.5">
        BYE — Pasa a Semifinal
      </span>
    </div>
  )
}

function QFRow({ qf }: { qf: QuarterFinalMatchup }) {
  const isCompleted = qf.status === "completed" || qf.status === "walkover"
  const isScheduled = qf.status === "scheduled"

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 space-y-2",
        isCompleted
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cuartos de Final
        </span>
        <StatusPill status={qf.status} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <TeamSlot slot={qf.home} winnerId={qf.winnerTeamId} />
        <span className="text-muted-foreground font-medium text-sm">vs</span>
        <TeamSlot slot={qf.away} winnerId={qf.winnerTeamId} />
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="size-3.5 shrink-0" />
        {qf.scheduledDate ? (
          <span>
            {formatDate(qf.scheduledDate)}
            {qf.scheduledTime ? ` — ${formatTime(qf.scheduledTime)}` : ""}
          </span>
        ) : (
          <span className="italic">Fecha a confirmar</span>
        )}
      </div>

      {isScheduled && !isCompleted && (
        <p className="text-xs text-muted-foreground italic">
          Resultado pendiente
        </p>
      )}
    </div>
  )
}

function ThirdPlaceCard({ thirdPlace }: { thirdPlace?: ThirdPlace }) {
  const isCompleted = thirdPlace?.status === "completed" || thirdPlace?.status === "walkover"
  const isScheduled = thirdPlace?.status === "scheduled" || thirdPlace?.status === "rescheduled"

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 space-y-2",
        isCompleted
          ? "border-amber-300/60 bg-amber-50/60"
          : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Medal className="size-3.5 text-amber-500" />
          3er y 4to Puesto
        </span>
        {isCompleted && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <CheckCircle2 className="size-3.5" />
            Jugado
          </span>
        )}
        {isScheduled && !isCompleted && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
            <AlertCircle className="size-3.5" />
            Programado
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap text-sm font-medium text-gray-800">
        <span className="truncate max-w-[120px] sm:max-w-none">
          {thirdPlace?.homeTeamName ?? <span className="italic font-normal text-muted-foreground">A definir</span>}
        </span>
        <span className="text-muted-foreground">vs</span>
        <span className="truncate max-w-[120px] sm:max-w-none">
          {thirdPlace?.awayTeamName ?? <span className="italic font-normal text-muted-foreground">A definir</span>}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="size-3.5 shrink-0" />
        {thirdPlace?.scheduledDate ? (
          <span>
            {formatDate(thirdPlace.scheduledDate)}
            {thirdPlace.scheduledTime ? ` — ${formatTime(thirdPlace.scheduledTime)}` : ""}
          </span>
        ) : (
          <span className="italic">Fecha a confirmar</span>
        )}
      </div>
    </div>
  )
}

function TeamSlot({ slot, winnerId }: { slot: PlayoffSlot; winnerId?: string }) {
  const isWinner = winnerId === slot.team.id
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        isWinner ? "font-bold text-primary" : "font-medium text-gray-800",
      )}
    >
      <SeedBadge seed={slot.seed} small />
      <span className="truncate max-w-[120px] sm:max-w-none">{slot.team.name}</span>
      {isWinner && <Trophy className="size-3.5 text-primary shrink-0" />}
    </span>
  )
}

function SeedBadge({ seed, small }: { seed: number; small?: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-full bg-muted font-bold text-muted-foreground",
        small ? "size-5 text-[10px]" : "size-6 text-xs",
      )}
    >
      {seed}°
    </span>
  )
}

function StatusPill({ status }: { status: QuarterFinalMatchup["status"] }) {
  if (status === "completed" || status === "walkover") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
        <CheckCircle2 className="size-3.5" />
        Jugado
      </span>
    )
  }
  if (status === "scheduled") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
        <AlertCircle className="size-3.5" />
        Programado
      </span>
    )
  }
  return null
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

function formatTime(time: string): string {
  return time.slice(0, 5) + " hs"
}
