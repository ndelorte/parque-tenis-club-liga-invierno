import type { Series } from "@/lib/tournament/types";
import { CourtMatchDetail } from "./CourtMatchDetail";

interface SeriesDetailProps {
  series: Series;
}

export function SeriesDetail({ series }: SeriesDetailProps) {
  if (series.is_general_walkover) {
    return (
      <div className="text-sm text-gray-600">
        <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold mr-2">
          WO General
        </span>
        {series.home_team?.name ?? series.home_team_id} no se presentó.
        Ganador: <strong>{series.away_team?.name ?? series.away_team_id}</strong>
      </div>
    );
  }

  const courts = series.court_matches ?? [];

  if (courts.length === 0) {
    return (
      <p className="text-sm text-gray-500">Sin detalle de canchas disponible.</p>
    );
  }

  return (
    <div className="space-y-2">
      {courts.map((cm) => (
        <CourtMatchDetail
          key={cm.id}
          courtMatch={cm}
          homeTeamName={series.home_team?.name ?? "Local"}
          awayTeamName={series.away_team?.name ?? "Visitante"}
          homeTeamId={series.home_team_id}
        />
      ))}
    </div>
  );
}
