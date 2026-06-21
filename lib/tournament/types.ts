export type SeriesStatus =
  | "scheduled"
  | "rescheduled"
  | "in_progress"
  | "completed"
  | "walkover"
  | "cancelled";

export type Phase = "regular" | "quarterfinal" | "semifinal" | "final";

export type RoundStatus = "scheduled" | "completed" | "cancelled";

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  season: number;
  status: "active" | "finished";
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface Category {
  id: string;
  tournament_id: string;
  name: string;
  slug: string;
  phase_format: string;
  regular_phase_type: string;
  teams_count: number;
  sort_order: number;
  direct_semifinalists_count?: number;
  quarterfinals_enabled?: boolean;
}

export interface Team {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  captain_name?: string;
  active: boolean;
}

export interface Player {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  active: boolean;
}

export interface TeamPlayer {
  id: string;
  team_id: string;
  player_id: string;
  is_captain: boolean;
  active: boolean;
  player?: Player;
}

export interface Round {
  id: string;
  category_id: string;
  phase: Phase;
  round_number: number;
  name: string;
  scheduled_date?: string;
  status: RoundStatus;
}

export interface Series {
  id: string;
  round_id: string;
  category_id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_date?: string;
  scheduled_time?: string;
  original_scheduled_date?: string;
  original_scheduled_time?: string;
  rescheduled_reason?: string;
  status: SeriesStatus;
  is_general_walkover: boolean;
  walkover_winner_team_id?: string;
  winner_team_id?: string;
  home_courts_won?: number;
  away_courts_won?: number;
  notes?: string;
  home_team?: Team;
  away_team?: Team;
  round?: Round;
  court_matches?: CourtMatch[];
}

export interface CourtMatch {
  id: string;
  series_id: string;
  court_number: 1 | 2 | 3;
  home_player_1_id?: string;
  home_player_2_id?: string;
  away_player_1_id?: string;
  away_player_2_id?: string;
  score?: string;
  winner_team_id?: string;
  is_court_walkover: boolean;
  home_sets_won?: number;
  away_sets_won?: number;
  home_games_won?: number;
  away_games_won?: number;
  home_player_1?: Player;
  home_player_2?: Player;
  away_player_1?: Player;
  away_player_2?: Player;
}

export interface StandingsRow {
  team_id: string;
  team: Team;
  played: number;
  won: number;
  lost: number;
  points: number;
  courts_won: number;
  courts_lost: number;
  courts_diff: number;
  sets_won: number;
  sets_lost: number;
  sets_diff: number;
  games_won: number;
  games_lost: number;
  games_diff: number;
  position: number;
}

export interface SeriesWithDetails extends Series {
  home_team: Team;
  away_team: Team;
  round: Round;
  court_matches: CourtMatch[];
}
