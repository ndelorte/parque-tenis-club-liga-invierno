import { CourtMatch, Series, StandingsRow, TournamentRules, DEFAULT_RULES } from "./types";
import { aggregateSeriesMatches } from "./calculateCourtMatchResult";

export function sortStandings(
  standings: StandingsRow[],
  series: Series[],
  courtMatches: CourtMatch[],
  rules: TournamentRules = DEFAULT_RULES
): StandingsRow[] {
  const sorted = [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.courts_diff !== a.courts_diff) return b.courts_diff - a.courts_diff;
    if (b.sets_diff !== a.sets_diff) return b.sets_diff - a.sets_diff;
    if (b.games_diff !== a.games_diff) return b.games_diff - a.games_diff;
    return 0;
  });

  // Resolve H2H ties for groups with identical main criteria
  let i = 0;
  while (i < sorted.length) {
    let j = i + 1;
    while (j < sorted.length && isTied(sorted[i], sorted[j])) j++;

    if (j - i > 1) {
      const tiedGroup = sorted.slice(i, j);
      const resolvedGroup = sortByH2H(tiedGroup, series, courtMatches, rules);
      for (let k = 0; k < resolvedGroup.length; k++) {
        sorted[i + k] = resolvedGroup[k];
      }
    }
    i = j;
  }

  for (let pos = 0; pos < sorted.length; pos++) {
    sorted[pos] = { ...sorted[pos], position: pos + 1 };
  }

  return sorted;
}

function isTied(a: StandingsRow, b: StandingsRow): boolean {
  return (
    a.points === b.points &&
    a.courts_diff === b.courts_diff &&
    a.sets_diff === b.sets_diff &&
    a.games_diff === b.games_diff
  );
}

function sortByH2H(
  tiedTeams: StandingsRow[],
  series: Series[],
  courtMatches: CourtMatch[],
  rules: TournamentRules
): StandingsRow[] {
  const teamIds = new Set(tiedTeams.map((t) => t.team_id));

  const matchesBySeries = new Map<string, CourtMatch[]>();
  for (const match of courtMatches) {
    const s = series.find((s) => s.id === match.series_id);
    if (s && teamIds.has(s.home_team_id) && teamIds.has(s.away_team_id)) {
      if (!matchesBySeries.has(match.series_id)) matchesBySeries.set(match.series_id, []);
      matchesBySeries.get(match.series_id)!.push(match);
    }
  }

  const h2hStats = new Map<
    string,
    { points: number; courts_diff: number; sets_diff: number; games_diff: number }
  >();
  for (const team of tiedTeams) {
    h2hStats.set(team.team_id, { points: 0, courts_diff: 0, sets_diff: 0, games_diff: 0 });
  }

  for (const s of series) {
    if (!teamIds.has(s.home_team_id) || !teamIds.has(s.away_team_id)) continue;

    const homeStats = h2hStats.get(s.home_team_id)!;
    const awayStats = h2hStats.get(s.away_team_id)!;

    if (s.is_general_walkover && s.walkover_winner_team_id) {
      const winnerIsHome = s.walkover_winner_team_id === s.home_team_id;
      if (winnerIsHome) {
        homeStats.points += rules.pointsForWin;
        homeStats.courts_diff += rules.walkoverCourtsWon;
        homeStats.sets_diff += rules.walkoverSetsWon;
        homeStats.games_diff += rules.walkoverGamesWon;
        awayStats.points += rules.pointsForWalkover;
        awayStats.courts_diff -= rules.walkoverCourtsWon;
        awayStats.sets_diff -= rules.walkoverSetsWon;
        awayStats.games_diff -= rules.walkoverGamesWon;
      } else {
        awayStats.points += rules.pointsForWin;
        awayStats.courts_diff += rules.walkoverCourtsWon;
        awayStats.sets_diff += rules.walkoverSetsWon;
        awayStats.games_diff += rules.walkoverGamesWon;
        homeStats.points += rules.pointsForWalkover;
        homeStats.courts_diff -= rules.walkoverCourtsWon;
        homeStats.sets_diff -= rules.walkoverSetsWon;
        homeStats.games_diff -= rules.walkoverGamesWon;
      }
    } else if (s.status === "completed") {
      const matches = matchesBySeries.get(s.id) ?? [];
      const { home_courts, away_courts, home_sets, away_sets, home_games, away_games } =
        aggregateSeriesMatches(matches);

      if (home_courts > away_courts) {
        homeStats.points += rules.pointsForWin;
        awayStats.points += rules.pointsForLoss;
      } else {
        awayStats.points += rules.pointsForWin;
        homeStats.points += rules.pointsForLoss;
      }

      homeStats.courts_diff += home_courts - away_courts;
      homeStats.sets_diff += home_sets - away_sets;
      homeStats.games_diff += home_games - away_games;
      awayStats.courts_diff += away_courts - home_courts;
      awayStats.sets_diff += away_sets - home_sets;
      awayStats.games_diff += away_games - home_games;
    }
  }

  return [...tiedTeams].sort((a, b) => {
    const aH2H = h2hStats.get(a.team_id)!;
    const bH2H = h2hStats.get(b.team_id)!;
    if (bH2H.points !== aH2H.points) return bH2H.points - aH2H.points;
    if (bH2H.courts_diff !== aH2H.courts_diff) return bH2H.courts_diff - aH2H.courts_diff;
    if (bH2H.sets_diff !== aH2H.sets_diff) return bH2H.sets_diff - aH2H.sets_diff;
    if (bH2H.games_diff !== aH2H.games_diff) return bH2H.games_diff - aH2H.games_diff;
    return 0;
  });
}
