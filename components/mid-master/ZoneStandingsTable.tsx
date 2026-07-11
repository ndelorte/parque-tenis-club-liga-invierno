import type { MmZone } from "@/lib/mid-master/types"

interface Props {
  zone: MmZone
}

function getParticipantName(zone: MmZone, id: string): string {
  return zone.participants.find((p) => p.id === id)?.displayName ?? "—"
}

export function ZoneStandingsTable({ zone }: Props) {
  const hasResults = zone.standings.some((r) => r.played > 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="w-7 pb-3 text-left text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
              #
            </th>
            <th className="pb-3 text-left text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
              Participante
            </th>
            <th className="hidden pb-3 text-center text-[10px] font-medium uppercase tracking-widest text-mm-text-faint sm:table-cell">
              PJ
            </th>
            <th className="pb-3 text-center text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
              PG
            </th>
            <th className="hidden pb-3 text-center text-[10px] font-medium uppercase tracking-widest text-mm-text-faint sm:table-cell">
              PP
            </th>
            <th className="pb-3 text-center text-[10px] font-medium uppercase tracking-widest text-mm-text-faint">
              Sets
            </th>
            <th className="hidden pb-3 text-center text-[10px] font-medium uppercase tracking-widest text-mm-text-faint md:table-cell">
              Games
            </th>
          </tr>
        </thead>
        <tbody>
          {zone.standings.map((row) => {
            const name = getParticipantName(zone, row.participantId)
            const isLeader = row.position === 1
            return (
              <tr
                key={row.participantId}
                className="border-t border-mm-border transition-colors hover:bg-mm-surface-2"
              >
                <td className="py-3 pr-2">
                  <span
                    className={`text-sm font-bold ${isLeader ? "text-mm-gold" : "text-mm-text-faint"}`}
                  >
                    {row.position}
                  </span>
                  {row.advances && (
                    <span
                      className="ml-1 inline-block size-1.5 rounded-full bg-mm-gold align-middle"
                      title="Avanza a semifinales"
                    />
                  )}
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-sm ${row.advances && hasResults ? "font-medium text-mm-text" : "text-mm-text"}`}>
                    {name}
                  </span>
                </td>
                <td className="hidden py-3 text-center text-sm text-mm-text-muted sm:table-cell">
                  {row.played}
                </td>
                <td className="py-3 text-center text-sm font-medium text-mm-text">
                  {row.won}
                </td>
                <td className="hidden py-3 text-center text-sm text-mm-text-muted sm:table-cell">
                  {row.lost}
                </td>
                <td className="py-3 text-center text-sm tabular-nums">
                  <DiffCell value={row.setsDiff} />
                </td>
                <td className="hidden py-3 text-center text-sm tabular-nums md:table-cell">
                  <DiffCell value={row.gamesDiff} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!hasResults && (
        <p className="mt-3 text-xs text-mm-text-faint">
          Sin resultados cargados todavía.
        </p>
      )}

      <p className="mt-3 flex items-center gap-1.5 text-[10px] text-mm-text-faint">
        <span className="inline-block size-1.5 rounded-full bg-mm-gold" />
        Avanza a semifinales
      </p>
    </div>
  )
}

function DiffCell({ value }: { value: number }) {
  if (value > 0)
    return <span className="text-mm-gold-light">+{value}</span>
  if (value < 0)
    return <span className="text-mm-text-faint">{value}</span>
  return <span className="text-mm-text-muted">0</span>
}
