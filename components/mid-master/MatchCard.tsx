import type { MmMatch, MmParticipant } from "@/lib/mid-master/types"
import { parseSetScores } from "./parseSetScores"

interface Props {
  match: MmMatch
  participants: MmParticipant[]
}

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function getParticipant(participants: MmParticipant[], id: string): string {
  return participants.find((p) => p.id === id)?.displayName ?? "—"
}

export function MatchCard({ match, participants }: Props) {
  const nameA = getParticipant(participants, match.participantAId)
  const nameB = getParticipant(participants, match.participantBId)
  const isCompleted = match.status === "played" || match.status === "walkover"
  const winnerA = isCompleted && match.winnerId === match.participantAId
  const winnerB = isCompleted && match.winnerId === match.participantBId
  const sets = isCompleted ? parseSetScores(match.score) : []

  const when =
    match.scheduledDate &&
    `${formatDate(match.scheduledDate)}${match.scheduledTime ? `, ${match.scheduledTime} h` : ""}`

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 border-b border-mm-border-strong py-2.5">
      {when && <span className="col-span-2 text-[13px] text-mm-text-muted">{when}</span>}

      <span className={`text-[15px] ${winnerA ? "font-bold text-mm-gold-light" : "text-mm-text"}`}>
        {nameA}
      </span>
      <ScoreCells sets={sets} side="a" rawScore={isCompleted ? match.score : undefined} />

      <span className={`text-[15px] ${winnerB ? "font-bold text-mm-gold-light" : "text-mm-text"}`}>
        {nameB}
      </span>
      {isCompleted ? (
        <ScoreCells sets={sets} side="b" rawScore={match.score} />
      ) : (
        <span className="text-right text-xs text-mm-text-muted">vs</span>
      )}
    </li>
  )
}

function ScoreCells({
  sets,
  side,
  rawScore,
}: {
  sets: ReturnType<typeof parseSetScores>
  side: "a" | "b"
  rawScore?: string
}) {
  if (sets.length > 0) {
    return (
      <span className="flex justify-end gap-2.5 font-heading text-[18px] font-semibold tabular-nums text-mm-text-muted">
        {sets.map((set, i) => {
          const value = side === "a" ? set.a : set.b
          const isSetWinner = side === "a" ? set.a > set.b : set.b > set.a
          return (
            <b key={i} className={`inline-block w-3.5 text-center font-semibold ${isSetWinner ? "text-mm-text" : ""}`}>
              {value}
            </b>
          )
        })}
      </span>
    )
  }
  if (rawScore) {
    return <span className="text-right text-sm tabular-nums text-mm-text-muted">{rawScore}</span>
  }
  return null
}
