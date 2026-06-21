import type { CourtMatch } from "@/lib/tournament/types";

interface CourtMatchDetailProps {
  courtMatch: CourtMatch;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamId: string;
}

export function CourtMatchDetail({
  courtMatch,
  homeTeamName,
  awayTeamName,
  homeTeamId,
}: CourtMatchDetailProps) {
  const homeWon = courtMatch.winner_team_id === homeTeamId;

  return (
    <div className="bg-white rounded border border-border px-3 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Cancha {courtMatch.court_number}
        </span>
        {courtMatch.is_court_walkover && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">
            WO cancha
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-2">
        <span className={homeWon ? "font-semibold text-gray-900" : "text-gray-400"}>
          {homeTeamName}
        </span>
        <span className="text-xs text-gray-500 font-mono">{courtMatch.score}</span>
        <span className={!homeWon ? "font-semibold text-gray-900" : "text-gray-400"}>
          {awayTeamName}
        </span>
      </div>

      {/* Jugadores */}
      {(courtMatch.home_player_1 || courtMatch.home_player_2) && (
        <div className="mt-1.5 text-xs text-gray-500 flex gap-4 flex-wrap">
          <span>
            {[courtMatch.home_player_1?.display_name, courtMatch.home_player_2?.display_name]
              .filter(Boolean)
              .join(" / ")}
          </span>
          <span>
            {[courtMatch.away_player_1?.display_name, courtMatch.away_player_2?.display_name]
              .filter(Boolean)
              .join(" / ")}
          </span>
        </div>
      )}
    </div>
  );
}
