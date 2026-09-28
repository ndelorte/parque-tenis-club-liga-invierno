import type { StandingsRow } from "@/lib/tournament/types";

interface StandingsTableProps {
  standings: StandingsRow[];
}

export function StandingsTable({ standings }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Sin resultados cargados todavía.
      </p>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto rounded-lg border border-border" role="region" aria-label="Tabla de posiciones" tabIndex={0}>
      <table className="w-full min-w-[640px] text-sm tabular-nums">
        <caption className="sr-only">Posiciones, partidos jugados, ganados, perdidos y diferencias</caption>
        <thead className="bg-surface border-b border-border">
          <tr>
            <th className="text-left px-3 py-2.5 font-semibold text-foreground w-8">#</th>
            <th scope="col" className="sticky left-0 z-10 min-w-36 bg-surface px-3 py-2.5 text-left font-semibold text-foreground">Equipo</th>
            <th className="text-center px-2 py-2.5 font-semibold text-foreground" title="Partidos jugados">PJ</th>
            <th className="text-center px-2 py-2.5 font-semibold text-foreground" title="Ganados">PG</th>
            <th className="text-center px-2 py-2.5 font-semibold text-foreground" title="Perdidos">PP</th>
            <th className="text-center px-2 py-2.5 font-semibold text-foreground font-bold" title="Puntos">Pts</th>
            <th className="text-center px-2 py-2.5 font-semibold text-foreground" title="Diferencia de canchas">Dif</th>
            {/* Columnas expandidas — ocultas en mobile */}
            <th className="hidden md:table-cell text-center px-2 py-2.5 font-semibold text-muted-foreground text-xs" title="Canchas ganadas/perdidas">Canchas</th>
            <th className="hidden md:table-cell text-center px-2 py-2.5 font-semibold text-muted-foreground text-xs" title="Sets ganados/perdidos">Sets</th>
            <th className="hidden md:table-cell text-center px-2 py-2.5 font-semibold text-muted-foreground text-xs" title="Games ganados/perdidos">Games</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.team_id}
              className="border-b border-border last:border-0 hover:bg-surface transition-colors"
            >
              <td className="px-3 py-2.5 text-muted-foreground font-medium">{row.position}</td>
              <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-2.5 text-left font-semibold text-foreground">{row.team.name}</th>
              <td className="text-center px-2 py-2.5 text-foreground">{row.played}</td>
              <td className="text-center px-2 py-2.5 text-foreground">{row.won}</td>
              <td className="text-center px-2 py-2.5 text-foreground">{row.lost}</td>
              <td className="text-center px-2 py-2.5 font-bold text-brand">{row.points}</td>
              <td className={`text-center px-2 py-2.5 font-medium ${row.courts_diff > 0 ? "text-win" : row.courts_diff < 0 ? "text-loss" : "text-muted-foreground"}`}>
                {row.courts_diff > 0 ? `+${row.courts_diff}` : row.courts_diff}
              </td>
              <td className="hidden md:table-cell text-center px-2 py-2.5 text-muted-foreground text-xs">
                {row.courts_won}/{row.courts_lost}
              </td>
              <td className="hidden md:table-cell text-center px-2 py-2.5 text-muted-foreground text-xs">
                {row.sets_won}/{row.sets_lost}
              </td>
              <td className="hidden md:table-cell text-center px-2 py-2.5 text-muted-foreground text-xs">
                {row.games_won}/{row.games_lost}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
