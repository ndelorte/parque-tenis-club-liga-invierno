-- ============================================================
-- Cierra la escritura directa por PostgREST para el rol `authenticated`
-- en todas las tablas que todavía la tenían abierta (migraciones 002, 004
-- y 005). Completa lo que 010 hizo para circuito_* y mid_master_editions.
--
-- Qué resuelve: 002_rls.sql, 004_mid_master.sql y 005_interparque.sql
-- crearon policies "for insert/update/delete/all to authenticated using
-- (true) with check (true)". Cualquier usuario con sesión (no solo admins;
-- si el signup público está habilitado, cualquiera) podía escribir en la
-- Liga (series, court_matches, standings_snapshot, teams, players, ...) y en
-- Interparque usando la anon key + su JWT, salteando las server actions.
--
-- Ahora: sin policies de escritura. Con RLS habilitado eso deja la
-- escritura solo al service_role (bypasea RLS), que usan exclusivamente las
-- server actions de app/actions/* y lib/data/* (createAdminClient()), y esas
-- validan el rol admin primero (lib/auth/requireAdmin.ts). Ninguna escritura
-- de la app usa el cliente anon/authenticated: los createClient() de sesión
-- solo se usan para auth.getUser()/signOut() y para lecturas, que siguen
-- cubiertas por las policies public_select_* (sin "to", aplican a todos los
-- roles, incluido authenticated). No rompe el panel.
--
-- No se usa un chequeo por rol en el JWT a propósito (mismo criterio que 010):
-- la autorización vive en isAdminUser() (lib/auth/admin.ts, solo
-- app_metadata) y la única puerta de escritura es el service role.
--
-- La lectura pública (public_select_*) NO cambia.
--
-- REQUIERE BACKUP PREVIO: antes de aplicar, descargar un backup de la base
-- (Supabase → Database → Backups) o al menos exportar pg_policies (ver la
-- consulta 0 al final) para poder recrear lo que se dropea.
--
-- Idempotente: todo es "drop policy if exists", "enable row level security"
-- (no-op si ya está) y creación condicionada. Se puede re-ejecutar.
-- ============================================================

begin;

-- ── Liga (002_rls.sql) — 27 policies ─────────────────────────
drop policy if exists "auth_insert_tournaments"   on public.tournaments;
drop policy if exists "auth_update_tournaments"   on public.tournaments;
drop policy if exists "auth_delete_tournaments"   on public.tournaments;

drop policy if exists "auth_insert_categories"    on public.categories;
drop policy if exists "auth_update_categories"    on public.categories;
drop policy if exists "auth_delete_categories"    on public.categories;

drop policy if exists "auth_insert_teams"         on public.teams;
drop policy if exists "auth_update_teams"         on public.teams;
drop policy if exists "auth_delete_teams"         on public.teams;

drop policy if exists "auth_insert_players"       on public.players;
drop policy if exists "auth_update_players"       on public.players;
drop policy if exists "auth_delete_players"       on public.players;

drop policy if exists "auth_insert_team_players"  on public.team_players;
drop policy if exists "auth_update_team_players"  on public.team_players;
drop policy if exists "auth_delete_team_players"  on public.team_players;

drop policy if exists "auth_insert_rounds"        on public.rounds;
drop policy if exists "auth_update_rounds"        on public.rounds;
drop policy if exists "auth_delete_rounds"        on public.rounds;

drop policy if exists "auth_insert_series"        on public.series;
drop policy if exists "auth_update_series"        on public.series;
drop policy if exists "auth_delete_series"        on public.series;

drop policy if exists "auth_insert_court_matches" on public.court_matches;
drop policy if exists "auth_update_court_matches" on public.court_matches;
drop policy if exists "auth_delete_court_matches" on public.court_matches;

drop policy if exists "auth_insert_standings"     on public.standings_snapshot;
drop policy if exists "auth_update_standings"     on public.standings_snapshot;
drop policy if exists "auth_delete_standings"     on public.standings_snapshot;

-- ── Interparque (005_interparque.sql) — 6 policies ───────────
drop policy if exists "auth_insert_interparque_players" on public.interparque_players;
drop policy if exists "auth_update_interparque_players" on public.interparque_players;
drop policy if exists "auth_delete_interparque_players" on public.interparque_players;

drop policy if exists "auth_insert_interparque_matches" on public.interparque_matches;
drop policy if exists "auth_update_interparque_matches" on public.interparque_matches;
drop policy if exists "auth_delete_interparque_matches" on public.interparque_matches;

-- ── Mid Master viejo (004_mid_master.sql) — 8 policies ───────
-- Las tablas mm_* puede que no existan en producción (el esquema real usa
-- mid_master_*, creado a mano). "drop policy if exists" falla si la TABLA no
-- existe, así que cada drop va condicionado a to_regclass().
do $$
begin
  if to_regclass('public.mm_editions') is not null then
    drop policy if exists "auth_insert_mm_editions" on public.mm_editions;
    drop policy if exists "auth_update_mm_editions" on public.mm_editions;
  end if;

  if to_regclass('public.mm_categories') is not null then
    drop policy if exists "auth_insert_mm_categories" on public.mm_categories;
    drop policy if exists "auth_update_mm_categories" on public.mm_categories;
  end if;

  if to_regclass('public.mm_zones') is not null then
    drop policy if exists "auth_insert_mm_zones" on public.mm_zones;
  end if;

  if to_regclass('public.mm_participants') is not null then
    drop policy if exists "auth_all_mm_participants" on public.mm_participants;
  end if;

  if to_regclass('public.mm_matches') is not null then
    drop policy if exists "auth_all_mm_matches" on public.mm_matches;
  end if;

  if to_regclass('public.mm_zone_standings') is not null then
    drop policy if exists "auth_all_mm_zone_standings" on public.mm_zone_standings;
  end if;
end
$$;

-- ── Mid Master real (mid_master_categories/groups/participants/matches) ──
-- Estas cuatro tablas existen en producción pero ninguna migración las crea,
-- así que su RLS real es desconocido (puede estar deshabilitado, lo que con
-- la anon key equivale a escritura abierta para cualquiera).
--
-- Se habilita RLS y se asegura lectura pública porque las páginas públicas
-- (/circuito-del-parque/especiales/...) las leen con createPublicClient()
-- (anon key, lib/data/mid-master/index.ts). Todas las escrituras van por
-- app/actions/mid-master.ts con createAdminClient() (service role, bypasea
-- RLS) tras isRequestFromAdmin(), así que no hace falta ninguna policy de
-- escritura y NO se crea ninguna.
--
-- La policy de select se crea solo si no hay ya una policy de SELECT que
-- aplique a anon (roles public o anon): si existe, se respeta tal cual. Si
-- hay policies de escritura creadas a mano, NO se dropean a ciegas (no
-- conocemos sus nombres): se listan con un WARNING para revisarlas y
-- dropearlas por nombre exacto en una migración aparte.
do $$
declare
  t      text;
  v_pol  record;
begin
  foreach t in array array[
    'mid_master_categories',
    'mid_master_groups',
    'mid_master_participants',
    'mid_master_matches'
  ] loop
    if to_regclass('public.' || t) is null then
      raise notice '017: public.% no existe, se saltea', t;
      continue;
    end if;

    for v_pol in
      select policyname, cmd, roles
      from pg_policies
      where schemaname = 'public' and tablename = t and cmd <> 'SELECT'
    loop
      raise warning '017: public.% tiene la policy de escritura "%" (cmd %, roles %) — revisar y dropear a mano',
        t, v_pol.policyname, v_pol.cmd, v_pol.roles;
    end loop;
  end loop;
end
$$;

do $$
begin
  if to_regclass('public.mid_master_categories') is not null then
    alter table public.mid_master_categories enable row level security;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'mid_master_categories'
        and (cmd = 'SELECT' and roles && array['public', 'anon']::name[]
             or policyname = 'public_select_mid_master_categories')
    ) then
      create policy "public_select_mid_master_categories"
        on public.mid_master_categories for select using (true);
    end if;
  end if;

  if to_regclass('public.mid_master_groups') is not null then
    alter table public.mid_master_groups enable row level security;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'mid_master_groups'
        and (cmd = 'SELECT' and roles && array['public', 'anon']::name[]
             or policyname = 'public_select_mid_master_groups')
    ) then
      create policy "public_select_mid_master_groups"
        on public.mid_master_groups for select using (true);
    end if;
  end if;

  if to_regclass('public.mid_master_participants') is not null then
    alter table public.mid_master_participants enable row level security;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'mid_master_participants'
        and (cmd = 'SELECT' and roles && array['public', 'anon']::name[]
             or policyname = 'public_select_mid_master_participants')
    ) then
      create policy "public_select_mid_master_participants"
        on public.mid_master_participants for select using (true);
    end if;
  end if;

  if to_regclass('public.mid_master_matches') is not null then
    alter table public.mid_master_matches enable row level security;
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = 'mid_master_matches'
        and (cmd = 'SELECT' and roles && array['public', 'anon']::name[]
             or policyname = 'public_select_mid_master_matches')
    ) then
      create policy "public_select_mid_master_matches"
        on public.mid_master_matches for select using (true);
    end if;
  end if;
end
$$;

commit;

-- ============================================================
-- Verificación post-aplicación (correr a mano en el editor SQL)
-- ============================================================
--
-- 0) Antes de aplicar (backup de policies), guardar el resultado de:
--   select schemaname, tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname = 'public' order by tablename, policyname;
--
-- 1) No debe quedar NINGUNA policy de escritura en public (resultado vacío):
--   select tablename, policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'public' and cmd <> 'SELECT'
--   order by tablename, policyname;
--
-- 2) Todas las tablas de public con RLS habilitado (relrowsecurity = true en
--    todas las filas; cualquier false es una tabla abierta a la anon key):
--   select c.relname as tabla, c.relrowsecurity as rls_habilitado
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind in ('r', 'p')
--   order by c.relrowsecurity, c.relname;
