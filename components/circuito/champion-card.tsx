import { Trophy } from "lucide-react"

interface Props {
  champion: { name: string } | null
  finalScore?: string | null
  points?: number
  // Variante horizontal compacta (celular): incluye una etiqueta arriba del
  // nombre ("Campeón"/"Campeona"), la decide quien la usa.
  compact?: boolean
  label?: string
}

// Tarjeta de campeón del cuadro — última columna del árbol de escritorio, y
// banner compacto arriba de la vista por rondas del celular.
export function ChampionCard({ champion, finalScore, points, compact, label }: Props) {
  if (!champion) {
    if (compact) return null
    return (
      <div className="flex flex-1 items-center">
        <div className="flex w-full flex-col gap-1.5 rounded-md border-2 border-dashed border-border p-5 text-muted-foreground">
          <Trophy aria-hidden="true" className="size-8" />
          <span className="font-heading text-2xl font-extrabold">Por definir</span>
          <span className="text-sm">Se define en la final.</span>
        </div>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3.5 rounded-md bg-board p-3.5 text-board-foreground">
        <Trophy aria-hidden="true" className="size-7 shrink-0 text-ball" />
        <div className="flex min-w-0 flex-col gap-0.5">
          {label && <span className="text-[13px] text-board-foreground/80">{label}</span>}
          <span className="truncate font-heading text-xl font-extrabold leading-none">{champion.name}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center">
      <div className="flex w-full flex-col gap-2.5 rounded-md border-[3px] border-draw-line bg-board p-5 text-board-foreground">
        <Trophy aria-hidden="true" className="size-9 text-ball" />
        <span className="font-heading text-3xl font-extrabold leading-[0.95]">{champion.name}</span>
        {finalScore && <span className="text-sm tabular-nums text-board-foreground/80">Final: {finalScore}</span>}
        {points !== undefined && (
          <span className="text-sm tabular-nums text-board-foreground/80">{points} puntos para el ranking</span>
        )}
      </div>
    </div>
  )
}
