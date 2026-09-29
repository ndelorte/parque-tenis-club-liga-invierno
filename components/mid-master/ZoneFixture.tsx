import type { MmZone } from "@/lib/mid-master/types"
import { MatchCard } from "./MatchCard"

interface Props {
  zone: MmZone
}

export function ZoneFixture({ zone }: Props) {
  if (zone.matches.length === 0) {
    return <p className="text-xs text-mm-text-muted">Sin partidos programados.</p>
  }

  return (
    <ol className="mt-4 grid gap-0 border-t border-mm-border-strong" aria-label={`Partidos de la ${zone.name.toLowerCase()}`}>
      {zone.matches.map((match) => (
        <MatchCard key={match.id} match={match} participants={zone.participants} />
      ))}
    </ol>
  )
}
