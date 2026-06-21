import { parseScore } from "./parseScore";

export interface CourtMatchResult {
  home_sets_won: number;
  away_sets_won: number;
  home_games_won: number;
  away_games_won: number;
  winner_side: "home" | "away";
}

export function calculateCourtMatchResult(match: {
  score: string;
  is_court_walkover?: boolean;
}): CourtMatchResult {
  const parsed = parseScore(match.score);
  const winner_side: "home" | "away" =
    parsed.home_sets_won > parsed.away_sets_won ? "home" : "away";
  return {
    home_sets_won: parsed.home_sets_won,
    away_sets_won: parsed.away_sets_won,
    home_games_won: parsed.home_games_won,
    away_games_won: parsed.away_games_won,
    winner_side,
  };
}
