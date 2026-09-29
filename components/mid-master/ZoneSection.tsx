import type { MmZone } from "@/lib/mid-master/types"
import { ZoneStandingsTable } from "./ZoneStandingsTable"
import { ZoneFixture } from "./ZoneFixture"

interface Props {
  zone: MmZone
}

const PLAYED_STATUSES = new Set(["played", "walkover"])

export function ZoneSection({ zone }: Props) {
  const total = zone.matches.length
  const played = zone.matches.filter((m) => PLAYED_STATUSES.has(m.status)).length

  return (
    <div>
      <h3 className="mb-2.5 flex items-baseline gap-3 font-mm-display text-[26px] text-mm-text">
        {zone.name}
        {total > 0 && (
          <span className="font-sans text-sm font-medium text-mm-text-muted">
            <span className="tabular-nums">{played}</span> de <span className="tabular-nums">{total}</span> partidos
            jugados
          </span>
        )}
      </h3>
      <ZoneStandingsTable zone={zone} />
      <ZoneFixture zone={zone} />
    </div>
  )
}
