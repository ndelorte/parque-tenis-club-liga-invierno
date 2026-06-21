-- ============================================================
-- Parque Tenis Club Web — Schema inicial
-- Sprint 7 — Supabase Postgres
-- ============================================================

-- tournaments
create table public.tournaments (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  slug         text        not null unique,
  season       integer     not null,
  status       text        not null default 'active'
                           check (status in ('active', 'finished')),
  description  text,
  start_date   date,
  end_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- categories
create table public.categories (
  id                          uuid        primary key default gen_random_uuid(),
  tournament_id               uuid        not null references public.tournaments(id) on delete cascade,
  name                        text        not null,
  slug                        text        not null unique,
  phase_format                text        not null default 'round_robin',
  regular_phase_type          text        not null default 'home_away',
  teams_count                 integer     not null,
  direct_semifinalists_count  integer,
  quarterfinals_enabled       boolean     not null default false,
  sort_order                  integer     not null default 0,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- teams
create table public.teams (
  id            uuid        primary key default gen_random_uuid(),
  category_id   uuid        not null references public.categories(id) on delete cascade,
  name          text        not null,
  slug          text        not null,
  captain_name  text,           -- solo nombre, sin teléfono
  notes         text,           -- uso interno (no público)
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (category_id, slug)
);

-- players — sin teléfono ni datos de contacto
create table public.players (
  id            uuid        primary key default gen_random_uuid(),
  first_name    text        not null,
  last_name     text        not null,
  display_name  text        not null,   -- nombre a mostrar públicamente
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- team_players — un jugador puede estar en equipos de distintas categorías
create table public.team_players (
  id          uuid        primary key default gen_random_uuid(),
  team_id     uuid        not null references public.teams(id) on delete cascade,
  player_id   uuid        not null references public.players(id) on delete cascade,
  is_captain  boolean     not null default false,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (team_id, player_id)
);

-- rounds — fechas del torneo
create table public.rounds (
  id              uuid        primary key default gen_random_uuid(),
  category_id     uuid        not null references public.categories(id) on delete cascade,
  phase           text        not null default 'regular'
                              check (phase in ('regular', 'quarterfinal', 'semifinal', 'final')),
  round_number    integer     not null,
  name            text        not null,
  scheduled_date  date,
  status          text        not null default 'scheduled'
                              check (status in ('scheduled', 'completed', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (category_id, phase, round_number)
);

-- series — enfrentamiento entre dos equipos en una fecha
create table public.series (
  id                       uuid        primary key default gen_random_uuid(),
  round_id                 uuid        not null references public.rounds(id) on delete cascade,
  category_id              uuid        not null references public.categories(id),
  home_team_id             uuid        not null references public.teams(id),
  away_team_id             uuid        not null references public.teams(id),
  scheduled_date           date,
  scheduled_time           time,
  original_scheduled_date  date,
  original_scheduled_time  time,
  rescheduled_reason       text,
  status                   text        not null default 'scheduled'
                           check (status in ('scheduled', 'rescheduled', 'in_progress', 'completed', 'walkover', 'cancelled')),
  is_general_walkover      boolean     not null default false,
  walkover_winner_team_id  uuid        references public.teams(id),
  winner_team_id           uuid        references public.teams(id),
  home_courts_won          integer,
  away_courts_won          integer,
  notes                    text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  check (home_team_id <> away_team_id)
);

-- court_matches — resultado de cada cancha dentro de una serie
create table public.court_matches (
  id                  uuid        primary key default gen_random_uuid(),
  series_id           uuid        not null references public.series(id) on delete cascade,
  court_number        integer     not null check (court_number in (1, 2, 3)),
  home_player_1_id    uuid        references public.players(id),
  home_player_2_id    uuid        references public.players(id),
  away_player_1_id    uuid        references public.players(id),
  away_player_2_id    uuid        references public.players(id),
  score               text,       -- formato: "6-4 3-6 7-6"
  winner_team_id      uuid        references public.teams(id),
  is_court_walkover   boolean     not null default false,
  home_sets_won       integer,
  away_sets_won       integer,
  home_games_won      integer,
  away_games_won      integer,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (series_id, court_number)
);

-- standings_snapshot — tabla de posiciones calculada
-- Se recalcula completamente en cada carga/edición de resultado.
-- No se permite edición manual de puntos.
create table public.standings_snapshot (
  id           uuid        primary key default gen_random_uuid(),
  category_id  uuid        not null references public.categories(id) on delete cascade,
  team_id      uuid        not null references public.teams(id) on delete cascade,
  played       integer     not null default 0,
  won          integer     not null default 0,
  lost         integer     not null default 0,
  points       integer     not null default 0,
  courts_won   integer     not null default 0,
  courts_lost  integer     not null default 0,
  courts_diff  integer     not null default 0,
  sets_won     integer     not null default 0,
  sets_lost    integer     not null default 0,
  sets_diff    integer     not null default 0,
  games_won    integer     not null default 0,
  games_lost   integer     not null default 0,
  games_diff   integer     not null default 0,
  position     integer     not null default 0,
  updated_at   timestamptz not null default now(),
  unique (category_id, team_id)
);

-- ── Índices ──────────────────────────────────────────────────
create index on public.categories      (tournament_id);
create index on public.teams           (category_id);
create index on public.team_players    (team_id);
create index on public.team_players    (player_id);
create index on public.rounds          (category_id);
create index on public.series          (round_id);
create index on public.series          (category_id);
create index on public.series          (home_team_id);
create index on public.series          (away_team_id);
create index on public.court_matches   (series_id);
create index on public.standings_snapshot (category_id);
