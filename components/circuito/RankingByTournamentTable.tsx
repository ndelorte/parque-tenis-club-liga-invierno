import type { AnnualRanking } from "@/lib/circuito/buildAnnualRanking"

interface Props {
  ranking: AnnualRanking
  highlightTop?: number
}

// Ranking anual de una categoría con el detalle por torneo: jugador, total
// y una columna por cada torneo mensual jugado en el año (en orden
// cronológico; los torneos que la categoría no jugó no aparecen). Con
// muchos torneos no entra en el celular: scrollea en horizontal con la
// columna del jugador fija.
export function RankingByTournamentTable({ ranking, highlightTop }: Props) {
  const { entries, tournaments } = ranking
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay puntos cargados.</p>
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th scope="col" className="sticky left-0 z-10 bg-card px-4 py-2.5 text-left font-medium">
              Jugador
            </th>
            <th scope="col" className="px-3 py-2.5 text-right font-medium text-foreground">
              Total
            </th>
            {tournaments.map((t) => (
              <th key={t.editionId} scope="col" className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
                {t.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, i) => {
            const highlighted = highlightTop !== undefined && i < highlightTop
            // Fondo opaco en la columna fija para que no se vean las otras por debajo al scrollear.
            const rowBg = highlighted ? "bg-brand-light/30" : ""
            return (
              <tr key={entry.playerId} className={`border-b border-border last:border-0 ${rowBg}`}>
                <th scope="row" className="sticky left-0 z-10 bg-card p-0 text-left font-normal">
                  <div className={`flex items-center gap-3 px-4 py-2.5 ${rowBg}`}>
                    <span className="w-6 shrink-0 font-mono text-muted-foreground">{i + 1}</span>
                    <span className="whitespace-nowrap text-foreground">{entry.playerName}</span>
                  </div>
                </th>
                <td className="px-3 py-2.5 text-right font-mono font-semibold text-foreground">{entry.points}</td>
                {tournaments.map((t) => {
                  const points = entry.pointsByEdition[t.editionId]
                  return (
                    <td key={t.editionId} className="px-3 py-2.5 text-right font-mono text-muted-foreground">
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
