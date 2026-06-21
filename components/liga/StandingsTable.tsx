import type { StandingsRow } from "@/lib/tournament/types";

interface StandingsTableProps {
  standings: StandingsRow[];
}

export function StandingsTable({ standings }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4">
        Sin resultados cargados todavía.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface border-b border-border">
          <tr>
            <th className="text-left px-3 py-2.5 font-semibold text-gray-700 w-8">#</th>
            <th className="text-left px-3 py-2.5 font-semibold text-gray-700">Equipo</th>
            <th className="text-center px-2 py-2.5 font-semibold text-gray-700" title="Partidos jugados">PJ</th>
            <th className="text-center px-2 py-2.5 font-semibold text-gray-700" title="Ganados">PG</th>
            <th className="text-center px-2 py-2.5 font-semibold text-gray-700" title="Perdidos">PP</th>
            <th className="text-center px-2 py-2.5 font-semibold text-gray-700 font-bold" title="Puntos">Pts</th>
            <th className="text-center px-2 py-2.5 font-semibold text-gray-700" title="Diferencia de canchas">Dif</th>
            {/* Columnas expandidas — ocultas en mobile */}
            <th className="hidden md:table-cell text-center px-2 py-2.5 font-semibold text-gray-500 text-xs" title="Canchas ganadas/perdidas">Canchas</th>
            <th className="hidden md:table-cell text-center px-2 py-2.5 font-semibold text-gray-500 text-xs" title="Sets ganados/perdidos">Sets</th>
            <th className="hidden md:table-cell text-center px-2 py-2.5 font-semibold text-gray-500 text-xs" title="Games ganados/perdidos">Games</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.team_id}
              className="border-b border-border last:border-0 hover:bg-surface transition-colors"
            >
              <td className="px-3 py-2.5 text-gray-500 font-medium">{row.position}</td>
              <td className="px-3 py-2.5 font-medium text-gray-900">{row.team.name}</td>
              <td className="text-center px-2 py-2.5 text-gray-700">{row.played}</td>
              <td className="text-center px-2 py-2.5 text-gray-700">{row.won}</td>
              <td className="text-center px-2 py-2.5 text-gray-700">{row.lost}</td>
              <td className="text-center px-2 py-2.5 font-bold text-brand">{row.points}</td>
              <td className={`text-center px-2 py-2.5 font-medium ${row.courts_diff > 0 ? "text-green-600" : row.courts_diff < 0 ? "text-red-500" : "text-gray-500"}`}>
                {row.courts_diff > 0 ? `+${row.courts_diff}` : row.courts_diff}
              </td>
              <td className="hidden md:table-cell text-center px-2 py-2.5 text-gray-500 text-xs">
                {row.courts_won}/{row.courts_lost}
              </td>
              <td className="hidden md:table-cell text-center px-2 py-2.5 text-gray-500 text-xs">
                {row.sets_won}/{row.sets_lost}
              </td>
              <td className="hidden md:table-cell text-center px-2 py-2.5 text-gray-500 text-xs">
                {row.games_won}/{row.games_lost}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
