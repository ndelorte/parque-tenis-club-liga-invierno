import { calculateCourtMatchResult } from "./calculateCourtMatchResult";

export interface SeriesResult {
  winner_team_id: string;
  home_courts_won: number;
  away_courts_won: number;
}

export function calculateSeriesResult(series: {
  home_team_id: string;
  away_team_id: string;
  court_matches: Array<{ score?: string; is_court_walkover: boolean }>;
}): SeriesResult {
  let home_courts_won = 0;
  let away_courts_won = 0;

  for (const match of series.court_matches) {
    if (!match.score) continue;
    const result = calculateCourtMatchResult({
      score: match.score,
      is_court_walkover: match.is_court_walkover,
    });
    if (result.winner_side === "home") home_courts_won++;
    else away_courts_won++;
  }

  const winner_team_id =
    home_courts_won > away_courts_won
      ? series.home_team_id
      : series.away_team_id;

  return { winner_team_id, home_courts_won, away_courts_won };
}
