import { DEFAULT_RULES, TournamentRules } from "./types";

export interface WalkoverSeriesResult {
  winner_team_id: string;
  loser_team_id: string;
  winner_points: number;
  loser_points: number;
  winner_courts: number;
  loser_courts: number;
  winner_sets: number;
  loser_sets: number;
  winner_games: number;
  loser_games: number;
}

export function calculateWalkoverSeriesResult(
  winnerTeamId: string,
  loserTeamId: string,
  rules: TournamentRules = DEFAULT_RULES
): WalkoverSeriesResult {
  return {
    winner_team_id: winnerTeamId,
    loser_team_id: loserTeamId,
    winner_points: rules.pointsForWin,
    loser_points: rules.pointsForWalkover,
    winner_courts: rules.walkoverCourtsWon,
    loser_courts: 0,
    winner_sets: rules.walkoverSetsWon,
    loser_sets: 0,
    winner_games: rules.walkoverGamesWon,
    loser_games: 0,
  };
}
