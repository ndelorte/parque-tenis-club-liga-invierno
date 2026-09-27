import type { AnnualRanking } from "@/lib/circuito/buildAnnualRanking"
import { isGrandSlamMonth } from "@/lib/circuito/pointsTable"

interface Props {
  ranking: AnnualRanking
  categoryLabel: string
  highlightTop?: number
}

const MONTH_ABBR_FORMATTER = new Intl.DateTimeFormat("es-AR", { month: "short" })

function monthAbbr(month: number): string {
  const label = MONTH_ABBR_FORMATTER.format(new Date(2000, month - 1, 1)).replace(".", "")
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Ranking anual de una categoría con el detalle por torneo — ver
// product/refactor-visual/maquetas/fase-2/Ranking.dc.html. Con muchos
// torneos no entra en el celular: scrollea en horizontal con la columna del
// jugador fija.
export function RankingByTournamentTable({ ranking, categoryLabel, highlightTop }: Props) {
  const { entries, tournaments } = ranking
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay puntos cargados.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border-[1.5px] border-draw-line bg-card text-sm">
        <caption className="caption-top pb-3 text-left text-sm text-muted-foreground">
          {categoryLabel}
          {highlightTop !== undefined &&
            `. Los ${highlightTop} primeros, arriba de la línea, clasifican a la Final Master.`}
        </caption>
        <thead>
          <tr className="border-b-2 border-draw-line text-xs font-semibold text-muted-foreground">
            <th scope="col" className="px-2 py-2.5 text-left">
              #
            </th>
            <th scope="col" className="sticky left-0 z-10 bg-card px-3 py-2.5 text-left">
              Jugador
            </th>
            <th scope="col" className="px-3 py-2.5 text-right">
              Total
            </th>
            {tournaments.map((t) => (
              <th
                key={t.editionId}
                scope="col"
                className={`whitespace-nowrap px-3 py-2.5 text-right align-bottom font-medium ${
                  isGrandSlamMonth(t.month) ? "border-t-4 border-t-accent" : ""
                }`}
              >
                {monthAbbr(t.month)}
                <span className="block text-[11px] font-normal">{t.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const cut = highlightTop !== undefined && i === highlightTop - 1
            return (
              <tr key={entry.playerId} className={`border-b border-border last:border-0 ${cut ? "border-b-[3px] border-b-draw-line" : ""}`}>
                <td className="px-2 py-2.5 text-left font-heading text-lg font-bold tabular-nums text-foreground">
                  {i + 1}
                </td>
                <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-card px-3 py-2.5 text-left font-normal text-foreground">
                  {entry.playerName}
                </th>
                <td className="px-3 py-2.5 text-right text-base font-bold tabular-nums text-foreground">{entry.points}</td>
                {tournaments.map((t) => {
                  const points = entry.pointsByEdition[t.editionId]
                  return (
                    <td key={t.editionId} className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                      {points ?? "—"}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
