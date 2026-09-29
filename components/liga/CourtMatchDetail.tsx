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
    <div className="rounded-md border border-border bg-card p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Cancha {courtMatch.court_number}
        </span>
        {courtMatch.is_court_walkover && (
          <span className="text-xs bg-pending-soft text-pending px-1.5 py-0.5 rounded font-medium">
            WO cancha
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className={homeWon ? "min-w-0 font-semibold text-foreground" : "min-w-0 text-muted-foreground"}>
          {homeTeamName}
        </span>
        <span className="shrink-0 text-xs font-bold tabular-nums text-foreground">{courtMatch.score || "—"}</span>
        <span className={!homeWon ? "min-w-0 text-right font-semibold text-foreground" : "min-w-0 text-right text-muted-foreground"}>
          {awayTeamName}
        </span>
      </div>

      {/* Jugadores */}
      {(courtMatch.home_player_1 || courtMatch.home_player_2 || courtMatch.away_player_1 || courtMatch.away_player_2) && (
        <div className="mt-1.5 text-xs text-muted-foreground flex gap-4 flex-wrap">
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
