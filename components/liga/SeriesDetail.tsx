import type { Series } from "@/lib/tournament/types";
import { CourtMatchDetail } from "./CourtMatchDetail";

interface SeriesDetailProps {
  series: Series;
}

export function SeriesDetail({ series }: SeriesDetailProps) {
  const courts = series.court_matches ?? [];
  return (
    <div className="space-y-3">
      {series.is_general_walkover && <p className="text-sm text-muted-foreground">
        <span className="inline-block bg-loss-soft text-loss px-2 py-0.5 rounded text-xs font-semibold mr-2">
          WO General
        </span>
        {series.walkover_winner_team_id === series.home_team_id
          ? series.away_team?.name ?? "Visitante"
          : series.home_team?.name ?? "Local"} no se presentó.{" "}
        Ganador: <strong>{series.walkover_winner_team_id === series.home_team_id
          ? series.home_team?.name ?? "Local"
          : series.away_team?.name ?? "Visitante"}</strong>
      </p>}
      {courts.length === 0 && <p className="text-sm text-muted-foreground">Sin detalle de canchas disponible.</p>}
      <div className="grid gap-3 sm:grid-cols-3">
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
    </div>
  );
}
