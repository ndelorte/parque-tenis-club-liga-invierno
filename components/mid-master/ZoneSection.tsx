import type { MmZone } from "@/lib/mid-master/types"
import { ZoneStandingsTable } from "./ZoneStandingsTable"
import { ZoneFixture } from "./ZoneFixture"

interface Props {
  zone: MmZone
}

export function ZoneSection({ zone }: Props) {
  return (
    <div className="rounded-none border border-mm-border bg-mm-surface">
      {/* Zone header */}
      <div className="border-b border-mm-border px-5 py-4">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-mm-text-faint">
          Zona
        </p>
        <h3 className="mt-0.5 text-base font-semibold text-mm-text">
          {zone.name}
        </h3>
      </div>

      {/* Standings */}
      <div className="border-b border-mm-border px-5 py-5">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
          Posiciones
        </p>
        <ZoneStandingsTable zone={zone} />
      </div>

      {/* Fixture */}
      <div className="px-5 py-5">
        <p className="mb-4 text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
          Fixture
        </p>
        <ZoneFixture zone={zone} />
      </div>
    </div>
  )
}
