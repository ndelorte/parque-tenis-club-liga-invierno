import type { MmZone } from "@/lib/mid-master/types"
import { MatchCard } from "./MatchCard"

interface Props {
  zone: MmZone
}

export function ZoneFixture({ zone }: Props) {
  if (zone.matches.length === 0) {
    return (
      <p className="text-xs text-mm-text-faint">Sin partidos programados.</p>
    )
  }

  return (
    <div>
      {zone.matches.map((match) => (
        <MatchCard key={match.id} match={match} participants={zone.participants} />
      ))}
    </div>
  )
}
