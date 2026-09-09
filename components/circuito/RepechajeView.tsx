import { BracketView, type BracketViewMatch } from "./BracketView"

interface Props {
  matches: BracketViewMatch[]
  participantNames: Record<string, string>
}

// El repechaje solo existe con eliminación simple (8+ inscriptos) y nunca
// otorga puntos de ranking — ver reglas-circuito-del-parque.md.
export function RepechajeView({ matches, participantNames }: Props) {
  if (matches.length === 0) return null

  return (
    <div className="mt-8">
      <BracketView matches={matches} participantNames={participantNames} title="Repechaje" />
      <p className="mt-2 text-xs text-muted-foreground">
        El repechaje garantiza un mínimo de 2 partidos para los perdedores de 1ª ronda — no otorga
        puntos de ranking.
      </p>
    </div>
  )
}
