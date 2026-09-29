import type { MmKnockout, MmKnockoutMatch } from "@/lib/mid-master/types"
import { parseSetScores } from "./parseSetScores"

const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

interface Props {
  knockout: MmKnockout
}

/**
 * Cuadro final: semis a los lados, final al centro en desktop; en celular se
 * apila semi 1, semi 2, final (ver Opcion1-EspecialesCategoria.dc.html). Los
 * seeds ("1° Zona A", "Ganador semifinal 1", ...) son fijos por reglamento
 * (product/reglas-mid-master.md) y no dependen de los datos: no se inventa
 * nada, solo se hardcodea el texto documentado para el slot correspondiente.
 */
export function KnockoutBracket({ knockout }: Props) {
  const { semifinal1, semifinal2, final } = knockout

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.15fr_1fr] md:items-center md:gap-0">
      <BracketMatch
        match={semifinal1}
        seedA="1° Zona A"
        seedB="2° Zona B"
        className="order-1 md:order-none md:relative md:mr-7 after:content-[''] after:absolute after:top-1/2 after:right-[-29px] after:hidden after:h-px after:w-7 after:bg-mm-gold md:after:block"
      />
      <BracketMatch match={final} seedA="Ganador semifinal 1" seedB="Ganador semifinal 2" isFinal className="order-3 md:order-none" />
      <BracketMatch
        match={semifinal2}
        seedA="1° Zona B"
        seedB="2° Zona A"
        className="order-2 md:order-none md:relative md:ml-7 before:content-[''] before:absolute before:top-1/2 before:left-[-29px] before:hidden before:h-px before:w-7 before:bg-mm-gold md:before:block"
      />
    </div>
  )
}

function BracketMatch({
  match,
  seedA,
  seedB,
  isFinal,
  className = "",
}: {
  match: MmKnockoutMatch
  seedA: string
  seedB: string
  isFinal?: boolean
  className?: string
}) {
  const isCompleted = match.status === "played" || match.status === "walkover"
  const winnerA = isCompleted && match.winnerId === match.participantAId
  const winnerB = isCompleted && match.winnerId === match.participantBId
  const sets = isCompleted ? parseSetScores(match.score) : []

  return (
    <article
      className={`border bg-mm-surface ${isFinal ? "border-mm-gold" : "border-mm-border-strong"} ${className}`}
      aria-label={match.label}
    >
      <p className="flex items-center justify-between gap-2 border-b border-mm-border-strong px-3.5 py-2.5 text-sm text-mm-text-muted">
        <strong className="font-heading text-[17px] font-bold tracking-[0.01em] text-mm-gold">
          {match.label}
        </strong>
        {match.scheduledDate && (
          <span>
            {formatDate(match.scheduledDate)}
            {match.scheduledTime && `, ${match.scheduledTime} h`}
          </span>
        )}
      </p>

      <BracketSide
        seed={seedA}
        name={match.participantALabel}
        isWinner={winnerA}
        isPending={!match.participantAId}
        sets={sets}
        side="a"
        isFinal={isFinal}
      />
      <BracketSide
        seed={seedB}
        name={match.participantBLabel}
        isWinner={winnerB}
        isPending={!match.participantBId}
        sets={sets}
        side="b"
        isFinal={isFinal}
      />

      {!match.scheduledDate && !isCompleted && (
        <p className="border-t border-mm-border-strong px-3.5 py-2 text-[11px] text-mm-text-muted">
          {isFinal ? "Se define al final de las semifinales" : "Por definir"}
        </p>
      )}
    </article>
  )
}

function BracketSide({
  seed,
  name,
  isWinner,
  isPending,
  sets,
  side,
  isFinal,
}: {
  seed: string
  name: string
  isWinner: boolean
  isPending: boolean
  sets: ReturnType<typeof parseSetScores>
  side: "a" | "b"
  isFinal?: boolean
}) {
  return (
    <div
      className={`grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-t border-mm-border-strong px-3.5 py-2.5 first:border-t-0 ${
        isWinner ? "bg-mm-green-deep" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="text-[12.5px] leading-tight text-mm-text-muted">{seed}</p>
        <p
          className={`truncate text-sm ${isFinal ? "font-mm-display text-[19px]" : ""} ${
            isWinner ? "font-bold text-mm-gold-light" : isPending ? "italic text-mm-text-muted" : "text-mm-text"
          }`}
        >
          {name}
          {isWinner && <span className="sr-only"> (ganó)</span>}
        </p>
      </div>
      {sets.length > 0 && (
        <span className="flex gap-1 font-heading text-[22px] font-semibold tabular-nums text-mm-text-muted">
          {sets.map((set, i) => {
            const value = side === "a" ? set.a : set.b
            const isSetWinner = side === "a" ? set.a > set.b : set.b > set.a
            return (
              <b key={i} className={`inline-block w-[22px] text-center font-semibold ${isSetWinner ? "text-mm-text" : ""}`}>
                {value}
              </b>
            )
          })}
        </span>
      )}
    </div>
  )
}
