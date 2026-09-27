export interface ZoneStandingsRow {
  id: string
  name: string
  played: number
  wins: number
  setsDiff: string
  gamesDiff: string
  qualifies: boolean
}

export interface ZoneMatchRow {
  id: string
  winnerName: string
  loserName: string
  score: string
}

// Tabla de posiciones + partidos de una zona (formatos 4/5/6-7 inscriptos) —
// product/refactor-visual/maquetas/fase-2/Zonas.dc.html.
export function ZoneStandingsTable({
  zoneName,
  rows,
  matches,
}: {
  zoneName: string
  rows: ZoneStandingsRow[]
  matches: ZoneMatchRow[]
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-3xl font-extrabold uppercase text-foreground">{zoneName}</h2>
      <table className="w-full border-collapse border-[1.5px] border-draw-line bg-card text-sm">
        <caption className="sr-only">Posiciones de la {zoneName}</caption>
        <thead>
          <tr className="border-b-2 border-draw-line text-xs font-semibold text-muted-foreground">
            <th scope="col" className="px-3 py-2.5 text-left">
              Jugador
            </th>
            <th scope="col" className="px-3 py-2.5 text-right">
              PJ
            </th>
            <th scope="col" className="px-3 py-2.5 text-right">
              PG
            </th>
            <th scope="col" className="px-3 py-2.5 text-right">
              Sets
            </th>
            <th scope="col" className="px-3 py-2.5 text-right">
              Games
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td
                className={`px-3 py-2.5 text-left tabular-nums ${row.qualifies ? "font-bold text-foreground shadow-[inset_4px_0_0_var(--color-clay)]" : "text-foreground"}`}
              >
                {row.name}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{row.played}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{row.wins}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{row.setsDiff}</td>
              <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{row.gamesDiff}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul aria-label={`Partidos de la ${zoneName}`} className="m-0 flex list-none flex-col gap-1.5 p-0">
        {matches.map((m) => (
          <li key={m.id} className="flex justify-between gap-3 border-b border-dashed border-border py-2 text-sm">
            <span>
              <strong className="font-semibold text-foreground">{m.winnerName}</strong> le ganó a {m.loserName}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">{m.score}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
