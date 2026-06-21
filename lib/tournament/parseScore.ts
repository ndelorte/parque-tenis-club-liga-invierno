export interface ParsedScore {
  sets: Array<{ home: number; away: number }>;
  home_sets_won: number;
  away_sets_won: number;
  home_games_won: number;
  away_games_won: number;
}

export function parseScore(score: string): ParsedScore {
  if (!score || !score.trim()) throw new Error("Score vacío");

  const parts = score.trim().split(/\s+/);

  if (parts.length < 2) throw new Error(`Score inválido: debe tener al menos 2 sets, recibido "${score}"`);
  if (parts.length > 3) throw new Error(`Score inválido: no puede tener más de 3 sets, recibido "${score}"`);

  const sets = parts.map((part) => {
    if (!part.includes("-")) throw new Error(`Set mal formateado: "${part}"`);
    const [homeStr, awayStr] = part.split("-");
    const home = parseInt(homeStr, 10);
    const away = parseInt(awayStr, 10);
    if (isNaN(home) || isNaN(away)) throw new Error(`Score inválido: "${part}"`);
    if (home === away) throw new Error(`Set empatado inválido: "${part}"`);
    return { home, away };
  });

  if (sets.length === 3) {
    const third = sets[2];
    const valid =
      (third.home === 7 && third.away === 6) || (third.home === 6 && third.away === 7);
    if (!valid)
      throw new Error(
        `Tercer set inválido: debe ser 7-6 o 6-7, recibido "${parts[2]}"`,
      );
  }

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
