-- ============================================================
-- Inscripción online a la Liga (Fase V1)
-- Ver product/plan-liga-verano-inscripcion.md
--
-- - tournaments: configuración de la inscripción (abierta, cierre, min/max).
-- - liga_registrations / liga_registration_players: solicitudes del público,
--   pendientes de validación del organizador.
-- - player_private: DNI de los jugadores. Va aparte de `players` porque esa
--   tabla tiene lectura pública (002_rls.sql). Teléfono y DNI nunca se
--   exponen al cliente.
-- - approve_liga_registration(): crea equipo + jugadores nuevos + DNI +
--   team_players y marca la solicitud como aprobada, todo en una sola
--   transacción (si algo falla, no queda nada a medias).
--
-- RLS: activada y sin policies para anon/authenticated (mismo criterio que
-- 010_circuito_rls_solo_service_role.sql). Todo pasa por server actions con
-- la service role.
-- ============================================================

-- 1. Configuración de la inscripción por edición
alter table public.tournaments
  add column if not exists registration_open        boolean not null default false,
  add column if not exists registration_deadline    date,
  add column if not exists registration_min_players int,
  add column if not exists registration_max_players int;

alter table public.tournaments
  drop constraint if exists tournaments_registration_players_check;
alter table public.tournaments
  add constraint tournaments_registration_players_check check (
    (registration_min_players is null or registration_min_players >= 1)
    and (registration_max_players is null or registration_max_players >= 1)
    and (registration_min_players is null or registration_max_players is null
         or registration_min_players <= registration_max_players)
  );

-- 2. Solicitudes de inscripción
create table if not exists public.liga_registrations (
  id             uuid        primary key default gen_random_uuid(),
  tournament_id  uuid        not null references public.tournaments(id) on delete cascade,
  category_id    uuid        not null references public.categories(id) on delete cascade,
  team_name      text        not null check (char_length(team_name) between 1 and 80),
  captain_phone  text        not null check (char_length(captain_phone) between 6 and 30),
  notes          text        check (notes is null or char_length(notes) <= 1000),
  status         text        not null default 'pending'
                             check (status in ('pending', 'approved', 'rejected')),
  team_id        uuid        references public.teams(id) on delete set null,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists liga_registrations_tournament_status_idx
  on public.liga_registrations (tournament_id, status, created_at);

create table if not exists public.liga_registration_players (
  id                  uuid    primary key default gen_random_uuid(),
  registration_id     uuid    not null references public.liga_registrations(id) on delete cascade,
  first_name          text    not null check (char_length(first_name) between 1 and 60),
  last_name           text    not null check (char_length(last_name) between 1 and 60),
  dni                 text    not null check (dni ~ '^[0-9]{7,8}$'),
  is_captain          boolean not null default false,
  sort_order          int     not null default 0,
  resolved_player_id  uuid    references public.players(id) on delete set null,
  resolution          text    not null default 'pending'
                              check (resolution in ('pending', 'existing', 'new')),
  -- 'existing' exige el jugador elegido.
  check (resolution <> 'existing' or resolved_player_id is not null)
);

create index if not exists liga_registration_players_reg_idx
  on public.liga_registration_players (registration_id, sort_order);

-- Exactamente un capitán por inscripción (a lo sumo uno acá; que haya uno
-- lo valida la app y approve_liga_registration).
create unique index if not exists liga_registration_players_one_captain_idx
  on public.liga_registration_players (registration_id) where is_captain;

-- 3. DNI privado
create table if not exists public.player_private (
  player_id   uuid        primary key references public.players(id) on delete cascade,
  dni         text        not null unique check (dni ~ '^[0-9]{7,8}$'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 4. RLS: activada, sin policies → solo service_role
alter table public.liga_registrations         enable row level security;
alter table public.liga_registration_players  enable row level security;
alter table public.player_private             enable row level security;

-- 5. Aprobación atómica
create or replace function public.approve_liga_registration(p_registration_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg        public.liga_registrations%rowtype;
  v_player     public.liga_registration_players%rowtype;
  v_team_id    uuid;
  v_player_id  uuid;
  v_base_slug  text;
  v_slug       text;
  v_n          int := 1;
  v_captain    text := '';
  v_other_team text;
  v_dni_owner  uuid;
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status <> 'pending' then
    raise exception 'La inscripción ya fue revisada.';
  end if;
  if exists (select 1 from public.liga_registration_players
             where registration_id = p_registration_id and resolution = 'pending') then
    raise exception 'Faltan resolver jugadores.';
  end if;
  if (select count(*) from public.liga_registration_players
      where registration_id = p_registration_id and is_captain) <> 1 then
    raise exception 'La inscripción tiene que tener exactamente un capitán.';
  end if;

  -- Slug único dentro de la categoría
  v_base_slug := trim(both '-' from regexp_replace(
    lower(translate(v_reg.team_name,
      'áéíóúüñÁÉÍÓÚÜÑàèìòùâêîôû', 'aeiouunaeiouunaeiouaeiou')),
    '[^a-z0-9]+', '-', 'g'));
  if v_base_slug = '' then v_base_slug := 'equipo'; end if;
  v_slug := v_base_slug;
  while exists (select 1 from public.teams where category_id = v_reg.category_id and slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base_slug || '-' || v_n;
  end loop;

  insert into public.teams (category_id, name, slug, active)
  values (v_reg.category_id, v_reg.team_name, v_slug, true)
  returning id into v_team_id;

  for v_player in
    select * from public.liga_registration_players
    where registration_id = p_registration_id
    order by sort_order, id
  loop
    if v_player.resolution = 'new' then
      -- El DNI no puede pertenecer ya a otro jugador
      select player_id into v_dni_owner from public.player_private where dni = v_player.dni;
      if found then
        raise exception 'El DNI % ya está cargado en otro jugador.', v_player.dni;
      end if;
      insert into public.players (first_name, last_name, display_name, active)
      values (v_player.first_name, v_player.last_name, v_player.last_name || ' ' || v_player.first_name, true)
      returning id into v_player_id;
      insert into public.player_private (player_id, dni) values (v_player_id, v_player.dni);
    else
      v_player_id := v_player.resolved_player_id;
      -- Si el jugador no tenía DNI, se guarda; si ya tiene uno, no se pisa.
      if not exists (select 1 from public.player_private where player_id = v_player_id) then
        select player_id into v_dni_owner from public.player_private where dni = v_player.dni;
        if found then
          raise exception 'El DNI % ya está cargado en otro jugador.', v_player.dni;
        end if;
        insert into public.player_private (player_id, dni) values (v_player_id, v_player.dni);
      end if;
    end if;

    -- Un jugador no puede estar activo en dos equipos de la misma categoría
    select t.name into v_other_team
    from public.team_players tp
    join public.teams t on t.id = tp.team_id
    where tp.player_id = v_player_id and tp.active
      and t.category_id = v_reg.category_id and t.id <> v_team_id
    limit 1;
    if v_other_team is not null then
      raise exception '% ya juega en "%" en esta categoría.',
        v_player.last_name || ' ' || v_player.first_name, v_other_team;
    end if;

    insert into public.team_players (team_id, player_id, is_captain, active)
    values (v_team_id, v_player_id, v_player.is_captain, true);

    update public.liga_registration_players
      set resolved_player_id = v_player_id
      where id = v_player.id;

    if v_player.is_captain then
      select display_name into v_captain from public.players where id = v_player_id;
    end if;
  end loop;

  update public.teams set captain_name = v_captain where id = v_team_id;

  update public.liga_registrations
    set status = 'approved', team_id = v_team_id, reviewed_at = now(), updated_at = now()
    where id = p_registration_id;

  return v_team_id;
end;
$$;

revoke all on function public.approve_liga_registration(uuid) from public, anon, authenticated;
grant execute on function public.approve_liga_registration(uuid) to service_role;
