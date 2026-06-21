-- ============================================================
-- Parque Tenis Club Web — Row Level Security
-- Sprint 7
-- ============================================================
-- Política general:
--   • SELECT: público sin autenticación (Liga de Invierno es pública)
--   • INSERT / UPDATE / DELETE: solo usuarios autenticados (admins)
--   • El service_role key bypasea RLS por defecto (para scripts y admin server)
-- ============================================================

alter table public.tournaments        enable row level security;
alter table public.categories         enable row level security;
alter table public.teams              enable row level security;
alter table public.players            enable row level security;
alter table public.team_players       enable row level security;
alter table public.rounds             enable row level security;
alter table public.series             enable row level security;
alter table public.court_matches      enable row level security;
alter table public.standings_snapshot enable row level security;

-- ── Lectura pública ───────────────────────────────────────────
create policy "public_select_tournaments"
  on public.tournaments for select using (true);

create policy "public_select_categories"
  on public.categories for select using (true);

create policy "public_select_teams"
  on public.teams for select using (true);

-- players: solo display_name es público. El modelo no tiene teléfono,
-- pero se devuelven solo los campos necesarios en las queries de /lib/data.
create policy "public_select_players"
  on public.players for select using (true);

create policy "public_select_team_players"
  on public.team_players for select using (true);

create policy "public_select_rounds"
  on public.rounds for select using (true);

create policy "public_select_series"
  on public.series for select using (true);

create policy "public_select_court_matches"
  on public.court_matches for select using (true);

create policy "public_select_standings"
  on public.standings_snapshot for select using (true);

-- ── Escritura solo para autenticados ─────────────────────────
create policy "auth_insert_tournaments"
  on public.tournaments for insert to authenticated with check (true);
create policy "auth_update_tournaments"
  on public.tournaments for update to authenticated using (true) with check (true);
create policy "auth_delete_tournaments"
  on public.tournaments for delete to authenticated using (true);

create policy "auth_insert_categories"
  on public.categories for insert to authenticated with check (true);
create policy "auth_update_categories"
  on public.categories for update to authenticated using (true) with check (true);
create policy "auth_delete_categories"
  on public.categories for delete to authenticated using (true);

create policy "auth_insert_teams"
  on public.teams for insert to authenticated with check (true);
create policy "auth_update_teams"
  on public.teams for update to authenticated using (true) with check (true);
create policy "auth_delete_teams"
  on public.teams for delete to authenticated using (true);

create policy "auth_insert_players"
  on public.players for insert to authenticated with check (true);
create policy "auth_update_players"
  on public.players for update to authenticated using (true) with check (true);
create policy "auth_delete_players"
  on public.players for delete to authenticated using (true);

create policy "auth_insert_team_players"
  on public.team_players for insert to authenticated with check (true);
create policy "auth_update_team_players"
  on public.team_players for update to authenticated using (true) with check (true);
create policy "auth_delete_team_players"
  on public.team_players for delete to authenticated using (true);

create policy "auth_insert_rounds"
  on public.rounds for insert to authenticated with check (true);
create policy "auth_update_rounds"
  on public.rounds for update to authenticated using (true) with check (true);
create policy "auth_delete_rounds"
  on public.rounds for delete to authenticated using (true);

create policy "auth_insert_series"
  on public.series for insert to authenticated with check (true);
create policy "auth_update_series"
  on public.series for update to authenticated using (true) with check (true);
create policy "auth_delete_series"
  on public.series for delete to authenticated using (true);

create policy "auth_insert_court_matches"
  on public.court_matches for insert to authenticated with check (true);
create policy "auth_update_court_matches"
  on public.court_matches for update to authenticated using (true) with check (true);
create policy "auth_delete_court_matches"
  on public.court_matches for delete to authenticated using (true);

create policy "auth_insert_standings"
  on public.standings_snapshot for insert to authenticated with check (true);
create policy "auth_update_standings"
  on public.standings_snapshot for update to authenticated using (true) with check (true);
create policy "auth_delete_standings"
  on public.standings_snapshot for delete to authenticated using (true);
