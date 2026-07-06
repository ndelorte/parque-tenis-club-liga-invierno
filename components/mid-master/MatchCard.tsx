import type { MmMatch, MmParticipant } from "@/lib/mid-master/types"

interface Props {
  match: MmMatch
  participants: MmParticipant[]
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function getParticipant(participants: MmParticipant[], id: string): string {
  return participants.find((p) => p.id === id)?.displayName ?? "—"
}

function StatusBadge({ status }: { status: MmMatch["status"] }) {
  if (status === "played" || status === "walkover") {
    return (
      <span className="rounded-none bg-mm-green-deep px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mm-gold-light">
        Jugado
      </span>
    )
  }
  if (status === "scheduled") {
    return (
      <span className="rounded-none border border-mm-gold/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mm-gold">
        Programado
      </span>
    )
  }
  return (
    <span className="rounded-none border border-mm-border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mm-text-faint">
      Pendiente
    </span>
  )
}

export function MatchCard({ match, participants }: Props) {
  const nameA = getParticipant(participants, match.participantAId)
  const nameB = getParticipant(participants, match.participantBId)
  const isCompleted = match.status === "played"
  const winnerA = isCompleted && match.winnerId === match.participantAId
  const winnerB = isCompleted && match.winnerId === match.participantBId

  return (
    <div className="border-b border-mm-border px-0 py-3 last:border-0">
      {/* Date / time row */}
      {(match.scheduledDate || isCompleted) && (
        <div className="mb-2 flex items-center gap-3">
          {match.scheduledDate && (
            <span className="text-[11px] text-mm-text-faint">
              {formatDate(match.scheduledDate)}
              {match.scheduledTime && (
                <span className="ml-1 text-mm-text-faint">
                  · {match.scheduledTime}
                </span>
              )}
            </span>
          )}
          <StatusBadge status={match.status} />
        </div>
      )}

      {!match.scheduledDate && !isCompleted && (
        <div className="mb-2">
          <StatusBadge status={match.status} />
        </div>
      )}

      {/* Participants */}
      <div className="flex items-center gap-3">
        <span
          className={`flex-1 text-sm ${winnerA ? "font-semibold text-mm-gold-light" : "text-mm-text"}`}
        >
          {nameA}
        </span>
        {isCompleted && match.score ? (
          <span className="shrink-0 font-mono text-sm text-mm-gold">
            {match.score}
          </span>
        ) : (
          <span className="shrink-0 text-xs text-mm-text-faint">vs</span>
        )}
        <span
          className={`flex-1 text-right text-sm ${winnerB ? "font-semibold text-mm-gold-light" : "text-mm-text"}`}
        >
          {nameB}
        </span>
      </div>
    </div>
  )
}
