import type { MmKnockout, MmKnockoutMatch } from "@/lib/mid-master/types"

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00")
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

interface Props {
  knockout: MmKnockout
}

export function KnockoutBracket({ knockout }: Props) {
  const { semifinal1, semifinal2, final } = knockout

  return (
    <div className="border border-mm-border bg-mm-surface">
      <div className="border-b border-mm-border px-5 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-mm-text-faint">
          Cuadro final
        </p>
      </div>

      {/* Desktop: 3 columns — SF1 | Final | SF2 */}
      <div className="hidden grid-cols-3 divide-x divide-mm-border md:grid">
        <BracketColumn match={semifinal1} />
        <BracketColumn match={final} center />
        <BracketColumn match={semifinal2} />
      </div>

      {/* Mobile: stacked */}
      <div className="divide-y divide-mm-border md:hidden">
        <BracketColumn match={semifinal1} />
        <BracketColumn match={semifinal2} />
        <BracketColumn match={final} />
      </div>
    </div>
  )
}

function BracketColumn({
  match,
  center,
}: {
  match: MmKnockoutMatch
  center?: boolean
}) {
  const winnerA = match.status === "completed" && match.winnerId === match.participantAId
  const winnerB = match.status === "completed" && match.winnerId === match.participantBId
  const isFinal = match.phase === "final"

  return (
    <div className={`px-5 py-6 ${center ? "flex flex-col items-center text-center" : ""}`}>
      {/* Phase label */}
      <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.18em] text-mm-text-faint">
        {match.label}
      </p>

      {/* Participant A */}
      <BracketSlot
        label={match.participantALabel}
        isWinner={winnerA}
        isPending={!match.participantAId}
        center={center}
      />

      {/* Divider / Score */}
      <div className="my-2 flex items-center gap-3">
        <div className="flex-1 border-t border-mm-border" />
        {match.score ? (
          <span className="shrink-0 font-mono text-xs text-mm-gold">
            {match.score}
          </span>
        ) : (
          <span className="shrink-0 text-[10px] text-mm-text-faint">vs</span>
        )}
        <div className="flex-1 border-t border-mm-border" />
      </div>

      {/* Participant B */}
      <BracketSlot
        label={match.participantBLabel}
        isWinner={winnerB}
        isPending={!match.participantBId}
        center={center}
      />

      {/* Date */}
      {match.scheduledDate && (
        <p className="mt-3 text-[11px] text-mm-text-faint">
          {formatDate(match.scheduledDate)}
          {match.scheduledTime && ` · ${match.scheduledTime}`}
        </p>
      )}

      {/* Status badge */}
      {!match.scheduledDate && match.status !== "completed" && (
        <p className="mt-3 text-[11px] text-mm-text-faint">
          {isFinal ? "Se define al final de las semifinales" : "Por definir"}
        </p>
      )}
    </div>
  )
}

function BracketSlot({
  label,
  isWinner,
  isPending,
  center,
}: {
  label: string
  isWinner: boolean
  isPending: boolean
  center?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-2 border border-mm-border px-3 py-2.5 ${center ? "justify-center" : ""} ${isWinner ? "border-mm-gold/50 bg-mm-green-deep" : "bg-mm-bg"}`}
    >
      {isWinner && (
        <span className="size-1.5 shrink-0 rounded-full bg-mm-gold" />
      )}
      <span
        className={`text-sm ${isWinner ? "font-medium text-mm-gold-light" : isPending ? "italic text-mm-text-faint" : "text-mm-text"}`}
      >
        {label}
      </span>
    </div>
  )
}
