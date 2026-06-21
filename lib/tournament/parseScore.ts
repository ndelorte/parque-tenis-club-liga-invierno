export interface ParsedScore {
  sets: Array<{ home: number; away: number }>;
  home_sets_won: number;
  away_sets_won: number;
  home_games_won: number;
  away_games_won: number;
}

export function parseScore(score: string): ParsedScore {
  const parts = score.trim().split(/\s+/);
  const sets = parts.map((part) => {
    const [homeStr, awayStr] = part.split("-");
    const home = parseInt(homeStr, 10);
    const away = parseInt(awayStr, 10);
    if (isNaN(home) || isNaN(away)) throw new Error(`Score inválido: "${part}"`);
    return { home, away };
  });

  let home_sets_won = 0;
  let away_sets_won = 0;
  let home_games_won = 0;
  let away_games_won = 0;

  for (const set of sets) {
    if (set.home > set.away) home_sets_won++;
    else away_sets_won++;
    home_games_won += set.home;
    away_games_won += set.away;
  }

  return { sets, home_sets_won, away_sets_won, home_games_won, away_games_won };
}
