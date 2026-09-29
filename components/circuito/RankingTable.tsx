import { cn } from "@/lib/utils"

interface Props {
  // tournamentsPlayed/Won: criterios de desempate del ranking anual (OQ-38),
  // se muestran para que se entienda el orden entre empatados en puntos.
  entries: Array<{
    playerId: string
    playerName: string
    points: number
    tournamentsPlayed?: number
    tournamentsWon?: number
  }>
  highlightTop?: number
  // "especiales": piel dorado/negro de Final Master (identidad Especiales,
  // ver components/mid-master/). Reusa este mismo componente en vez de
  // duplicarlo — Final Master no tiene su propia tabla de ranking.
  variant?: "circuito" | "especiales"
}

export function RankingTable({ entries, highlightTop, variant = "circuito" }: Props) {
  const isEspeciales = variant === "especiales"

  if (entries.length === 0) {
    return (
      <p className={cn("text-sm", isEspeciales ? "text-mm-text-muted" : "text-muted-foreground")}>
        Todavía no hay puntos cargados.
      </p>
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden",
        isEspeciales ? "border border-mm-border-strong bg-mm-surface" : "rounded-lg border border-border bg-card",
      )}
    >
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1
        const isHighlighted = highlightTop != null && i < highlightTop
        return (
          <div
            key={entry.playerId}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 text-sm",
              isEspeciales
                ? cn(isLast ? "border-b-2 border-mm-gold" : "border-b border-mm-border", isHighlighted && "bg-mm-gold-wash/50")
                : cn(!isLast && "border-b border-border", isHighlighted && "bg-brand-light/30"),
            )}
          >
            <span
              className={cn(
                "w-6 shrink-0 tabular-nums",
                isEspeciales ? "font-heading font-semibold text-mm-text-muted" : "font-mono text-muted-foreground",
              )}
            >
              {i + 1}
            </span>
            <span className={cn("flex-1", isEspeciales ? "text-mm-text" : "text-foreground")}>
              {entry.playerName}
              {entry.tournamentsPlayed !== undefined && (
                <span className={cn("block text-xs", isEspeciales ? "text-mm-text-muted" : "text-muted-foreground")}>
                  {entry.tournamentsPlayed} {entry.tournamentsPlayed === 1 ? "torneo" : "torneos"}
                  {entry.tournamentsWon ? ` · ${entry.tournamentsWon} ${entry.tournamentsWon === 1 ? "ganado" : "ganados"}` : ""}
                </span>
              )}
            </span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                isEspeciales ? "font-heading text-base text-mm-gold-light" : "font-mono text-foreground",
              )}
            >
              {entry.points}
            </span>
          </div>
        )
      })}
    </div>
  )
}
