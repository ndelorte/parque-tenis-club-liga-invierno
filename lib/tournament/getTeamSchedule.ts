import { CourtMatch, Series, Team } from "./types";

export interface TeamScheduleEntry {
  series: Series;
  isHome: boolean;
  opponent: Team | undefined;
  courtMatches: CourtMatch[];
}

export function getTeamSchedule(
  teamId: string,
  series: Series[],
  courtMatches: CourtMatch[]
): TeamScheduleEntry[] {
  const matchesBySeries = new Map<string, CourtMatch[]>();
  for (const match of courtMatches) {
    if (!matchesBySeries.has(match.series_id)) matchesBySeries.set(match.series_id, []);
    matchesBySeries.get(match.series_id)!.push(match);
  }

  const teamSeries = series.filter(
    (s) => s.home_team_id === teamId || s.away_team_id === teamId
  );

  return teamSeries.map((s) => {
    const isHome = s.home_team_id === teamId;
    const isPlayed = s.status === "completed" || s.status === "walkover" || s.is_general_walkover;
    const opponent = isHome ? s.away_team : s.home_team;

    return {
      series: s,
      isHome,
      opponent,
      courtMatches: isPlayed ? (matchesBySeries.get(s.id) ?? []) : [],
    };
  });
}
