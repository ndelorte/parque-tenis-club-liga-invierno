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
    <div
      className="overflow-x-auto"
      role="region"
      aria-label={`Tabla de la ${zone.name.toLowerCase()}`}
      tabIndex={0}
    >
      <table className="w-full min-w-[480px] text-[15px]">
        <thead>
          <tr>
            <th scope="col" className="w-8 border-b border-mm-gold-muted py-2 text-left text-[13px] font-semibold text-mm-text-muted">
              <span className="sr-only">Posición</span>#
            </th>
            <th scope="col" className="border-b border-mm-gold-muted py-2 pr-2 text-left text-[13px] font-semibold text-mm-text-muted">
              Jugador
            </th>
            <th scope="col" className="border-b border-mm-gold-muted py-2 text-right text-[13px] font-semibold text-mm-text-muted">
              <abbr title="Partidos jugados" className="no-underline">PJ</abbr>
            </th>
            <th scope="col" className="border-b border-mm-gold-muted py-2 text-right text-[13px] font-semibold text-mm-text-muted">
              <abbr title="Partidos ganados" className="no-underline">PG</abbr>
            </th>
            <th scope="col" className="border-b border-mm-gold-muted py-2 text-right text-[13px] font-semibold text-mm-text-muted">
              <abbr title="Partidos perdidos" className="no-underline">PP</abbr>
            </th>
            <th scope="col" className="border-b border-mm-gold-muted py-2 text-right text-[13px] font-semibold text-mm-text-muted">
              Sets
            </th>
            <th scope="col" className="border-b border-mm-gold-muted py-2 text-right text-[13px] font-semibold text-mm-text-muted">
              <abbr title="Diferencia de games" className="no-underline">Dif. g</abbr>
            </th>
          </tr>
        </thead>
        <tbody>
          {zone.standings.map((row) => {
            const name = getParticipantName(zone, row.participantId)
            return (
              <tr key={row.participantId} className="border-b border-mm-border-strong">
                <td className={`h-12 py-0 pr-2 text-left font-heading text-[19px] font-semibold tabular-nums ${row.advances ? "text-mm-gold-light" : "text-mm-text-muted"}`}>
                  {row.position}
                </td>
                <td className="h-12 py-0 pr-2 text-left font-sans text-[15px]">
                  <span className={row.advances ? "font-bold text-mm-text" : "font-medium text-mm-text"}>
                    {name}
                  </span>
                  {row.advances && (
                    <span className="ml-2 inline-block rounded-sm border border-mm-gold-muted px-1.5 py-px align-middle text-[12px] font-bold text-mm-gold-light">
                      Semis
                    </span>
                  )}
                </td>
                <td className="h-12 py-0 text-right font-heading text-[19px] font-semibold tabular-nums text-mm-text">
                  {row.played}
                </td>
                <td className="h-12 py-0 text-right font-heading text-[19px] font-semibold tabular-nums text-mm-text">
                  {row.won}
                </td>
                <td className="h-12 py-0 text-right font-heading text-[19px] font-semibold tabular-nums text-mm-text">
                  {row.lost}
                </td>
                <td className="h-12 py-0 text-right font-heading text-[19px] font-semibold tabular-nums text-mm-text">
                  {row.setsWon}-{row.setsLost}
                </td>
                <td className="h-12 py-0 text-right font-heading text-[19px] font-semibold tabular-nums">
                  <DiffCell value={row.gamesDiff} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {!hasResults && (
        <p className="mt-3 text-xs text-mm-text-muted">Sin resultados cargados todavía.</p>
      )}
    </div>
  )
}

function DiffCell({ value }: { value: number }) {
  if (value > 0) return <span className="text-mm-win">+{value}</span>
  if (value < 0) return <span className="text-mm-loss">{value}</span>
  return <span className="text-mm-text-muted">0</span>
}
