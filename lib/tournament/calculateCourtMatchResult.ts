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

export interface SeriesAggregation {
  home_courts: number;
  away_courts: number;
  home_sets: number;
  away_sets: number;
  home_games: number;
  away_games: number;
}

export function aggregateSeriesMatches(
  matches: Array<{ score?: string; is_court_walkover: boolean }>,
): SeriesAggregation {
  let home_courts = 0, away_courts = 0;
  let home_sets = 0, away_sets = 0;
  let home_games = 0, away_games = 0;
  for (const match of matches) {
    if (!match.score) continue;
    const result = calculateCourtMatchResult({ score: match.score, is_court_walkover: match.is_court_walkover });
    if (result.winner_side === "home") home_courts++;
    else away_courts++;
    home_sets += result.home_sets_won;
    away_sets += result.away_sets_won;
    home_games += result.home_games_won;
    away_games += result.away_games_won;
  }
  return { home_courts, away_courts, home_sets, away_sets, home_games, away_games };
}
