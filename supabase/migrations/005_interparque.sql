-- Interparque: modalidad de partidos de single exclusiva para alumnos del club.
-- Módulo aislado (ver ADR-006): tablas propias, jugadores propios (no se
-- reusa `players` de Liga de Invierno).

create table public.interparque_players (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null,
  last_name     text not null,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.interparque_matches (
  id                uuid primary key default gen_random_uuid(),
  player_a_id       uuid not null references public.interparque_players(id),
  player_b_id       uuid not null references public.interparque_players(id),
  match_date        date,
  score             text,        -- ej: "6-2 6-7 10-8" o "6-0 6-0"
  status            text not null default 'scheduled'
                     check (status in ('scheduled', 'completed')),
  winner_player_id  uuid references public.interparque_players(id),
  games_a           integer not null default 0,
  games_b           integer not null default 0,
  points_a          integer not null default 0,
  points_b          integer not null default 0,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint interparque_matches_players_distinct check (player_a_id <> player_b_id)
);

create index interparque_matches_match_date_idx on public.interparque_matches (match_date);

alter table public.interparque_players enable row level security;
create policy "public_select_interparque_players" on public.interparque_players for select using (true);
create policy "auth_insert_interparque_players" on public.interparque_players for insert to authenticated with check (true);
create policy "auth_update_interparque_players" on public.interparque_players for update to authenticated using (true) with check (true);
create policy "auth_delete_interparque_players" on public.interparque_players for delete to authenticated using (true);

alter table public.interparque_matches enable row level security;
create policy "public_select_interparque_matches" on public.interparque_matches for select using (true);
create policy "auth_insert_interparque_matches" on public.interparque_matches for insert to authenticated with check (true);
create policy "auth_update_interparque_matches" on public.interparque_matches for update to authenticated using (true) with check (true);
create policy "auth_delete_interparque_matches" on public.interparque_matches for delete to authenticated using (true);
