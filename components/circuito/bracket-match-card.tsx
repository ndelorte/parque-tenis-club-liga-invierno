import type { BracketTreeMatch, BracketTreeSide } from "@/lib/circuito/bracketTree"
import { scoreFromWinnerSide } from "@/lib/circuito/scoreFromWinnerSide"

interface Props {
  match: BracketTreeMatch
  // Solo la 1ª ronda del cuadro principal tiene "pase libre" (bye); en las
  // demás, un lado vacío es "todavía no definido".
  compact?: boolean
}

// El score se guarda "lado A – lado B": se muestra desde el lado del ganador.
function winnerScore(match: BracketTreeMatch): string {
  const winnerSide = match.winnerId && match.winnerId === match.b?.id ? "b" : "a"
  return scoreFromWinnerSide(match.score, winnerSide)
}

function outcomeText(match: BracketTreeMatch): string {
  const { a, b, winnerId, isBye, isWalkover } = match
  const score = winnerScore(match)
  if (isBye) return `${a?.name ?? "?"} pasa libre a la próxima ronda.`
  if (winnerId) {
    const winner = winnerId === a?.id ? a : b
    const loser = winnerId === a?.id ? b : a
    if (isWalkover) return `Ganó ${winner?.name ?? "?"} por walkover.`
    return `Ganó ${winner?.name ?? "?"} a ${loser?.name ?? "?"}${score ? `, ${score}` : ""}.`
  }
  if (a && b) return `Por definir. Juegan ${a.name} y ${b.name}.`
  return "Por definir."
}

function Side({
  side,
  isWinner,
  score,
  isWalkover,
  compact,
}: {
  side: BracketTreeSide | null
  isWinner: boolean
  score: string
  isWalkover: boolean
  compact?: boolean
}) {
  const height = compact ? "min-h-11" : "min-h-[34px] py-0.5"
  return (
    <div
      className={`flex items-center gap-2 border-t border-border px-3 text-sm first:border-t-0 ${height} ${
        isWinner ? "font-bold text-foreground shadow-[inset_4px_0_0_var(--color-clay)]" : "text-muted-foreground"
      }`}
    >
      {side ? (
        <>
          <span className="w-5 shrink-0 tabular-nums text-xs text-muted-foreground">{side.seed ? `[${side.seed}]` : ""}</span>
          <span className="min-w-0 flex-1 break-words leading-tight">{side.name}</span>
          {isWinner && (
            <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">
              {isWalkover ? "W.O." : score}
            </span>
          )}
        </>
      ) : (
        <span className="italic">Por definir</span>
      )}
    </div>
  )
}

// Tarjeta de un partido del cuadro (compartida por la vista de árbol de
// escritorio y la vista por rondas de celular). El ganador se marca con
// negrita + barra izquierda de color, y además con texto para lectores de
// pantalla (no solo color/negrita).
export function BracketMatchCard({ match, compact }: Props) {
  const { a, b, winnerId, isBye, isWalkover } = match
  const score = winnerScore(match)

  return (
    <div className="relative overflow-hidden rounded border-[1.5px] border-draw-line bg-card">
      <div aria-hidden="true">
        <Side side={a} isWinner={!!winnerId && winnerId === a?.id} score={score} isWalkover={isWalkover} compact={compact} />
        {isBye ? (
          <div className={`flex items-center border-t border-border px-3 text-sm italic text-muted-foreground ${compact ? "min-h-11" : "min-h-[34px]"}`}>
            Pase libre
          </div>
        ) : (
          <Side side={b} isWinner={!!winnerId && winnerId === b?.id} score={score} isWalkover={isWalkover} compact={compact} />
        )}
      </div>
      <span className="sr-only">{outcomeText(match)}</span>
    </div>
  )
}
