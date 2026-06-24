import { CourtMatch, Series, StandingsRow, Team, TournamentRules, DEFAULT_RULES } from "./types";
import { aggregateSeriesMatches } from "./calculateCourtMatchResult";

export function calculateStandings(
  teams: Team[],
  series: Series[],
  courtMatches: CourtMatch[],
  rules: TournamentRules = DEFAULT_RULES
): StandingsRow[] {
  const rowMap = new Map<string, StandingsRow>();

  for (const team of teams) {
    rowMap.set(team.id, {
      team_id: team.id,
      team,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
      courts_won: 0,
      courts_lost: 0,
      courts_diff: 0,
      sets_won: 0,
      sets_lost: 0,
      sets_diff: 0,
      games_won: 0,
      games_lost: 0,
      games_diff: 0,
      position: 0,
    });
  }

  const matchesBySeries = new Map<string, CourtMatch[]>();
  for (const match of courtMatches) {
    if (!matchesBySeries.has(match.series_id)) {
      matchesBySeries.set(match.series_id, []);
    }
    matchesBySeries.get(match.series_id)!.push(match);
  }

  for (const s of series) {
    const homeRow = rowMap.get(s.home_team_id);
    const awayRow = rowMap.get(s.away_team_id);
    if (!homeRow || !awayRow) continue;

    if (s.is_general_walkover && s.walkover_winner_team_id) {
      const winnerIsHome = s.walkover_winner_team_id === s.home_team_id;
      const winnerRow = winnerIsHome ? homeRow : awayRow;
      const loserRow = winnerIsHome ? awayRow : homeRow;

      winnerRow.played++;
      winnerRow.won++;
      winnerRow.points += rules.pointsForWin;
      winnerRow.courts_won += rules.walkoverCourtsWon;
      winnerRow.sets_won += rules.walkoverSetsWon;
      winnerRow.games_won += rules.walkoverGamesWon;

      loserRow.played++;
      loserRow.lost++;
      loserRow.points += rules.pointsForWalkover;
      loserRow.courts_lost += rules.walkoverCourtsWon;
      loserRow.sets_lost += rules.walkoverSetsWon;
      loserRow.games_lost += rules.walkoverGamesWon;
    } else if (s.status === "completed") {
      const seriesMatches = matchesBySeries.get(s.id) ?? [];
      if (seriesMatches.length === 0) continue;

      const { home_courts, away_courts, home_sets, away_sets, home_games, away_games } =
        aggregateSeriesMatches(seriesMatches);

      homeRow.played++;
      awayRow.played++;
      homeRow.courts_won += home_courts;
      homeRow.courts_lost += away_courts;
      awayRow.courts_won += away_courts;
      awayRow.courts_lost += home_courts;
      homeRow.sets_won += home_sets;
      homeRow.sets_lost += away_sets;
      awayRow.sets_won += away_sets;
      awayRow.sets_lost += home_sets;
      homeRow.games_won += home_games;
      homeRow.games_lost += away_games;
      awayRow.games_won += away_games;
      awayRow.games_lost += home_games;

      if (home_courts > away_courts) {
        homeRow.won++;
        awayRow.lost++;
        homeRow.points += rules.pointsForWin;
        awayRow.points += rules.pointsForLoss;
      } else {
        awayRow.won++;
        homeRow.lost++;
        awayRow.points += rules.pointsForWin;
        homeRow.points += rules.pointsForLoss;
      }
    }
  }

  for (const row of rowMap.values()) {
    row.courts_diff = row.courts_won - row.courts_lost;
    row.sets_diff = row.sets_won - row.sets_lost;
    row.games_diff = row.games_won - row.games_lost;
  }

  return Array.from(rowMap.values());
}
