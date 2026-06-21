import type {
  Tournament,
  Category,
  Team,
  Player,
  TeamPlayer,
  Round,
  Series,
  CourtMatch,
  StandingsRow,
} from "@/lib/tournament/types";

// ─── Tournament ──────────────────────────────────────────────────────────────

export const mockTournament: Tournament = {
  id: "t1",
  name: "Liga de Invierno",
  slug: "liga-invierno",
  season: 2026,
  status: "active",
  description: "Torneo por equipos de dobles. Todos contra todos, ida y vuelta.",
  start_date: "2026-07-10",
  end_date: "2026-09-30",
};

// ─── Categories ──────────────────────────────────────────────────────────────

export const mockCategories: Category[] = [
  {
    id: "cat-ca",
    tournament_id: "t1",
    name: "Caballeros A",
    slug: "caballeros-a",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    sort_order: 1,
  },
  {
    id: "cat-cb",
    tournament_id: "t1",
    name: "Caballeros B",
    slug: "caballeros-b",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    sort_order: 2,
  },
  {
    id: "cat-da",
    tournament_id: "t1",
    name: "Damas A",
    slug: "damas-a",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    sort_order: 3,
  },
  {
    id: "cat-db",
    tournament_id: "t1",
    name: "Damas B",
    slug: "damas-b",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    sort_order: 4,
  },
  {
    id: "cat-ma",
    tournament_id: "t1",
    name: "Mixto A",
    slug: "mixto-a",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 6,
    sort_order: 5,
  },
  {
    id: "cat-mb",
    tournament_id: "t1",
    name: "Mixto B",
    slug: "mixto-b",
    phase_format: "round_robin",
    regular_phase_type: "home_away",
    teams_count: 5, // única categoría con 5 equipos
    sort_order: 6,
  },
];

// ─── Teams — Caballeros A ─────────────────────────────────────────────────────

export const mockTeamsCaballerosA: Team[] = [
  { id: "t-ca-1", category_id: "cat-ca", name: "Los Tigres", slug: "los-tigres", captain_name: "Martín Pérez", active: true },
  { id: "t-ca-2", category_id: "cat-ca", name: "La Bestia", slug: "la-bestia", captain_name: "Diego Romero", active: true },
  { id: "t-ca-3", category_id: "cat-ca", name: "Los Gladiadores", slug: "los-gladiadores", captain_name: "Lucas Sánchez", active: true },
  { id: "t-ca-4", category_id: "cat-ca", name: "Team Raptor", slug: "team-raptor", captain_name: "Nicolás García", active: true },
  { id: "t-ca-5", category_id: "cat-ca", name: "Los Cóndores", slug: "los-condores", captain_name: "Sebastián López", active: true },
  { id: "t-ca-6", category_id: "cat-ca", name: "Los Leones", slug: "los-leones", captain_name: "Andrés Martínez", active: true },
];

// ─── Teams — Mixto B (5 equipos) ─────────────────────────────────────────────

export const mockTeamsMixtoB: Team[] = [
  { id: "t-mb-1", category_id: "cat-mb", name: "Doble Mixto 1", slug: "doble-mixto-1", captain_name: "Carlos Ruiz", active: true },
  { id: "t-mb-2", category_id: "cat-mb", name: "Doble Mixto 2", slug: "doble-mixto-2", captain_name: "Pablo Díaz", active: true },
  { id: "t-mb-3", category_id: "cat-mb", name: "Doble Mixto 3", slug: "doble-mixto-3", captain_name: "Fernando Torres", active: true },
  { id: "t-mb-4", category_id: "cat-mb", name: "Doble Mixto 4", slug: "doble-mixto-4", captain_name: "Ricardo Flores", active: true },
  { id: "t-mb-5", category_id: "cat-mb", name: "Doble Mixto 5", slug: "doble-mixto-5", captain_name: "Gustavo Herrera", active: true },
];

// Mapa de todos los equipos por slug para lookup rápido
export const mockTeamsMap: Record<string, Team> = [
  ...mockTeamsCaballerosA,
  ...mockTeamsMixtoB,
].reduce((acc, t) => ({ ...acc, [t.id]: t }), {});

// ─── Players — Caballeros A (muestra) ────────────────────────────────────────

export const mockPlayersCaballerosA: Player[] = [
  { id: "p1", first_name: "Martín", last_name: "Pérez", display_name: "Martín Pérez", active: true },
  { id: "p2", first_name: "Roberto", last_name: "Pérez", display_name: "Roberto Pérez", active: true },
  { id: "p3", first_name: "Carlos", last_name: "Pérez", display_name: "Carlos Pérez", active: true },
  { id: "p4", first_name: "Diego", last_name: "Romero", display_name: "Diego Romero", active: true },
  { id: "p5", first_name: "Javier", last_name: "Romero", display_name: "Javier Romero", active: true },
  { id: "p6", first_name: "Lucas", last_name: "Sánchez", display_name: "Lucas Sánchez", active: true },
  { id: "p7", first_name: "Nicolás", last_name: "García", display_name: "Nicolás García", active: true },
  { id: "p8", first_name: "Sebastián", last_name: "López", display_name: "Sebastián López", active: true },
  { id: "p9", first_name: "Andrés", last_name: "Martínez", display_name: "Andrés Martínez", active: true },
  { id: "p10", first_name: "Pablo", last_name: "González", display_name: "Pablo González", active: true },
];

export const mockTeamPlayersCaballerosA: TeamPlayer[] = [
  { id: "tp1", team_id: "t-ca-1", player_id: "p1", is_captain: true, active: true, player: mockPlayersCaballerosA[0] },
  { id: "tp2", team_id: "t-ca-1", player_id: "p2", is_captain: false, active: true, player: mockPlayersCaballerosA[1] },
  { id: "tp3", team_id: "t-ca-1", player_id: "p3", is_captain: false, active: true, player: mockPlayersCaballerosA[2] },
  { id: "tp4", team_id: "t-ca-2", player_id: "p4", is_captain: true, active: true, player: mockPlayersCaballerosA[3] },
  { id: "tp5", team_id: "t-ca-2", player_id: "p5", is_captain: false, active: true, player: mockPlayersCaballerosA[4] },
  { id: "tp6", team_id: "t-ca-3", player_id: "p6", is_captain: true, active: true, player: mockPlayersCaballerosA[5] },
  { id: "tp7", team_id: "t-ca-4", player_id: "p7", is_captain: true, active: true, player: mockPlayersCaballerosA[6] },
  { id: "tp8", team_id: "t-ca-5", player_id: "p8", is_captain: true, active: true, player: mockPlayersCaballerosA[7] },
  { id: "tp9", team_id: "t-ca-6", player_id: "p9", is_captain: true, active: true, player: mockPlayersCaballerosA[8] },
  { id: "tp10", team_id: "t-ca-6", player_id: "p10", is_captain: false, active: true, player: mockPlayersCaballerosA[9] },
];

// ─── Rounds — Caballeros A ────────────────────────────────────────────────────

export const mockRoundsCaballerosA: Round[] = [
  { id: "r-ca-1", category_id: "cat-ca", phase: "regular", round_number: 1, name: "Fecha 1", scheduled_date: "2026-07-10", status: "completed" },
  { id: "r-ca-2", category_id: "cat-ca", phase: "regular", round_number: 2, name: "Fecha 2", scheduled_date: "2026-07-17", status: "completed" },
  { id: "r-ca-3", category_id: "cat-ca", phase: "regular", round_number: 3, name: "Fecha 3", scheduled_date: "2026-07-24", status: "scheduled" },
  { id: "r-ca-4", category_id: "cat-ca", phase: "regular", round_number: 4, name: "Fecha 4", scheduled_date: "2026-07-31", status: "scheduled" },
  { id: "r-ca-5", category_id: "cat-ca", phase: "regular", round_number: 5, name: "Fecha 5", scheduled_date: "2026-08-07", status: "scheduled" },
];

// ─── Series — Caballeros A ───────────────────────────────────────────────────

export const mockSeriesCaballerosA: Series[] = [
  // Fecha 1 — completadas
  {
    id: "s-ca-1-1", round_id: "r-ca-1", category_id: "cat-ca",
    home_team_id: "t-ca-1", away_team_id: "t-ca-2",
    scheduled_date: "2026-07-10", scheduled_time: "20:00",
    status: "completed", is_general_walkover: false,
    winner_team_id: "t-ca-1", home_courts_won: 2, away_courts_won: 1,
    home_team: mockTeamsCaballerosA[0], away_team: mockTeamsCaballerosA[1],
    round: mockRoundsCaballerosA[0],
  },
  {
    id: "s-ca-1-2", round_id: "r-ca-1", category_id: "cat-ca",
    home_team_id: "t-ca-3", away_team_id: "t-ca-4",
    scheduled_date: "2026-07-10", scheduled_time: "20:00",
    status: "completed", is_general_walkover: false,
    winner_team_id: "t-ca-4", home_courts_won: 1, away_courts_won: 2,
    home_team: mockTeamsCaballerosA[2], away_team: mockTeamsCaballerosA[3],
    round: mockRoundsCaballerosA[0],
  },
  {
    id: "s-ca-1-3", round_id: "r-ca-1", category_id: "cat-ca",
    home_team_id: "t-ca-5", away_team_id: "t-ca-6",
    scheduled_date: "2026-07-10", scheduled_time: "20:00",
    status: "completed", is_general_walkover: false,
    winner_team_id: "t-ca-5", home_courts_won: 3, away_courts_won: 0,
    home_team: mockTeamsCaballerosA[4], away_team: mockTeamsCaballerosA[5],
    round: mockRoundsCaballerosA[0],
  },
  // Fecha 2 — una completada, una reprogramada
  {
    id: "s-ca-2-1", round_id: "r-ca-2", category_id: "cat-ca",
    home_team_id: "t-ca-2", away_team_id: "t-ca-3",
    scheduled_date: "2026-07-24", scheduled_time: "20:00",
    original_scheduled_date: "2026-07-17", original_scheduled_time: "20:00",
    rescheduled_reason: "Reprogramado por lluvia",
    status: "rescheduled", is_general_walkover: false,
    home_team: mockTeamsCaballerosA[1], away_team: mockTeamsCaballerosA[2],
    round: mockRoundsCaballerosA[1],
  },
  {
    id: "s-ca-2-2", round_id: "r-ca-2", category_id: "cat-ca",
    home_team_id: "t-ca-4", away_team_id: "t-ca-5",
    scheduled_date: "2026-07-17", scheduled_time: "20:00",
    status: "completed", is_general_walkover: false,
    winner_team_id: "t-ca-4", home_courts_won: 2, away_courts_won: 1,
    home_team: mockTeamsCaballerosA[3], away_team: mockTeamsCaballerosA[4],
    round: mockRoundsCaballerosA[1],
  },
  {
    id: "s-ca-2-3", round_id: "r-ca-2", category_id: "cat-ca",
    home_team_id: "t-ca-6", away_team_id: "t-ca-1",
    scheduled_date: "2026-07-17", scheduled_time: "20:00",
    status: "walkover", is_general_walkover: true,
    walkover_winner_team_id: "t-ca-1", winner_team_id: "t-ca-1",
    home_courts_won: 0, away_courts_won: 3,
    home_team: mockTeamsCaballerosA[5], away_team: mockTeamsCaballerosA[0],
    round: mockRoundsCaballerosA[1],
  },
  // Fecha 3 — pendientes
  {
    id: "s-ca-3-1", round_id: "r-ca-3", category_id: "cat-ca",
    home_team_id: "t-ca-1", away_team_id: "t-ca-3",
    scheduled_date: "2026-07-24", scheduled_time: "20:00",
    status: "scheduled", is_general_walkover: false,
    home_team: mockTeamsCaballerosA[0], away_team: mockTeamsCaballerosA[2],
    round: mockRoundsCaballerosA[2],
  },
  {
    id: "s-ca-3-2", round_id: "r-ca-3", category_id: "cat-ca",
    home_team_id: "t-ca-2", away_team_id: "t-ca-6",
    scheduled_date: "2026-07-24", scheduled_time: "20:00",
    status: "scheduled", is_general_walkover: false,
    home_team: mockTeamsCaballerosA[1], away_team: mockTeamsCaballerosA[5],
    round: mockRoundsCaballerosA[2],
  },
];

// ─── Court matches para series completadas ────────────────────────────────────

export const mockCourtMatches: CourtMatch[] = [
  // Serie s-ca-1-1: Los Tigres 2-1 La Bestia
  { id: "cm-1", series_id: "s-ca-1-1", court_number: 1, score: "6-4 6-2", winner_team_id: "t-ca-1", is_court_walkover: false, home_sets_won: 2, away_sets_won: 0, home_games_won: 12, away_games_won: 6, home_player_1: mockPlayersCaballerosA[0], home_player_2: mockPlayersCaballerosA[1], away_player_1: mockPlayersCaballerosA[3], away_player_2: mockPlayersCaballerosA[4] },
  { id: "cm-2", series_id: "s-ca-1-1", court_number: 2, score: "3-6 4-6", winner_team_id: "t-ca-2", is_court_walkover: false, home_sets_won: 0, away_sets_won: 2, home_games_won: 7, away_games_won: 12 },
  { id: "cm-3", series_id: "s-ca-1-1", court_number: 3, score: "6-3 3-6 7-6", winner_team_id: "t-ca-1", is_court_walkover: false, home_sets_won: 2, away_sets_won: 1, home_games_won: 16, away_games_won: 15 },
  // Serie s-ca-1-3: Los Cóndores 3-0 Los Leones
  { id: "cm-4", series_id: "s-ca-1-3", court_number: 1, score: "6-1 6-0", winner_team_id: "t-ca-5", is_court_walkover: false, home_sets_won: 2, away_sets_won: 0, home_games_won: 12, away_games_won: 1 },
  { id: "cm-5", series_id: "s-ca-1-3", court_number: 2, score: "6-0 6-0", winner_team_id: "t-ca-5", is_court_walkover: true, home_sets_won: 2, away_sets_won: 0, home_games_won: 12, away_games_won: 0 },
  { id: "cm-6", series_id: "s-ca-1-3", court_number: 3, score: "6-3 6-4", winner_team_id: "t-ca-5", is_court_walkover: false, home_sets_won: 2, away_sets_won: 0, home_games_won: 12, away_games_won: 7 },
];

// ─── Standings — Caballeros A ─────────────────────────────────────────────────

export const mockStandingsCaballerosA: StandingsRow[] = [
  { position: 1, team_id: "t-ca-1", team: mockTeamsCaballerosA[0], played: 2, won: 2, lost: 0, points: 4, courts_won: 5, courts_lost: 1, courts_diff: 4, sets_won: 8, sets_lost: 3, sets_diff: 5, games_won: 47, games_lost: 27, games_diff: 20 },
  { position: 2, team_id: "t-ca-4", team: mockTeamsCaballerosA[3], played: 2, won: 2, lost: 0, points: 4, courts_won: 4, courts_lost: 2, courts_diff: 2, sets_won: 6, sets_lost: 4, sets_diff: 2, games_won: 38, games_lost: 30, games_diff: 8 },
  { position: 3, team_id: "t-ca-5", team: mockTeamsCaballerosA[4], played: 2, won: 1, lost: 1, points: 3, courts_won: 3, courts_lost: 3, courts_diff: 0, sets_won: 5, sets_lost: 4, sets_diff: 1, games_won: 33, games_lost: 26, games_diff: 7 },
  { position: 4, team_id: "t-ca-2", team: mockTeamsCaballerosA[1], played: 1, won: 0, lost: 1, points: 1, courts_won: 1, courts_lost: 2, courts_diff: -1, sets_won: 2, sets_lost: 4, sets_diff: -2, games_won: 18, games_lost: 28, games_diff: -10 },
  { position: 5, team_id: "t-ca-3", team: mockTeamsCaballerosA[2], played: 1, won: 0, lost: 1, points: 1, courts_won: 1, courts_lost: 2, courts_diff: -1, sets_won: 2, sets_lost: 4, sets_diff: -2, games_won: 22, games_lost: 28, games_diff: -6 },
  { position: 6, team_id: "t-ca-6", team: mockTeamsCaballerosA[5], played: 2, won: 0, lost: 2, points: 1, courts_won: 0, courts_lost: 6, courts_diff: -6, sets_won: 0, sets_lost: 12, sets_diff: -12, games_won: 8, games_lost: 72, games_diff: -64 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getTeamsByCategory(categorySlug: string): Team[] {
  const category = mockCategories.find((c) => c.slug === categorySlug);
  if (!category) return [];
  if (categorySlug === "caballeros-a") return mockTeamsCaballerosA;
  if (categorySlug === "mixto-b") return mockTeamsMixtoB;
  return [];
}

export function getSeriesByCategory(categorySlug: string): Series[] {
  if (categorySlug === "caballeros-a") return mockSeriesCaballerosA;
  return [];
}

export function getStandingsByCategory(categorySlug: string): StandingsRow[] {
  if (categorySlug === "caballeros-a") return mockStandingsCaballerosA;
  return [];
}

export function getTeamById(teamId: string): Team | undefined {
  return [...mockTeamsCaballerosA, ...mockTeamsMixtoB].find((t) => t.id === teamId);
}

export function getTeamBySlug(slug: string): Team | undefined {
  return [...mockTeamsCaballerosA, ...mockTeamsMixtoB].find((t) => t.slug === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return mockCategories.find((c) => c.slug === slug);
}

export function getSeriesForTeam(teamSlug: string): Series[] {
  const team = getTeamBySlug(teamSlug);
  if (!team) return [];
  return mockSeriesCaballerosA.filter(
    (s) => s.home_team_id === team.id || s.away_team_id === team.id
  );
}

export function getCourtMatchesForSeries(seriesId: string): CourtMatch[] {
  return mockCourtMatches.filter((cm) => cm.series_id === seriesId);
}
