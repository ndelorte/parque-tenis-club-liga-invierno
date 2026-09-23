interface Props {
  entries: Array<{ playerId: string; playerName: string; points: number }>
  highlightTop?: number
}

export function RankingTable({ entries, highlightTop }: Props) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay puntos cargados.</p>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {entries.map((entry, i) => (
        <div
          key={entry.playerId}
          className={`flex items-center gap-3 border-b border-border px-4 py-2.5 text-sm last:border-0 ${
            highlightTop && i < highlightTop ? "bg-brand-light/30" : ""
          }`}
        >
          <span className="w-6 shrink-0 font-mono text-muted-foreground">{i + 1}</span>
          <span className="flex-1 text-foreground">{entry.playerName}</span>
          <span className="font-mono font-semibold text-foreground">{entry.points}</span>
        </div>
      ))}
    </div>
  )
}
