-- ============================================================
-- Gestión de inscripciones y equipos desde el panel (Fase V3)
-- Ver product/plan-liga-verano-inscripcion.md
--
-- - liga_registrations.status suma 'withdrawn' (equipo dado de baja) y la
--   columna opcional rejection_reason (motivo interno del rechazo).
-- - liga_registration_events: historial legible de cambios por inscripción.
--   RLS activada y sin policies: solo service_role.
-- - RPC para cada cambio de varios pasos: hacen el cambio Y escriben el
--   evento del historial en la misma transacción. El resumen legible
--   (p_events = [{kind, summary}]) lo arma la app; p_actor es el email del admin.
--
-- Todas las funciones son security definer, con search_path fijo, y solo las
-- ejecuta service_role (mismo criterio que 013, 014 y 015).
-- Las migraciones las aplica el organizador a mano en Supabase.
-- ============================================================

-- 1. Estado 'withdrawn' + motivo del rechazo
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.liga_registrations'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%status%'
  loop
    execute format('alter table public.liga_registrations drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.liga_registrations
  add constraint liga_registrations_status_check
  check (status in ('pending', 'approved', 'rejected', 'withdrawn'));

alter table public.liga_registrations
  add column if not exists rejection_reason text
  check (rejection_reason is null or char_length(rejection_reason) <= 500);

-- 2. Historial
create table if not exists public.liga_registration_events (
  id               uuid        primary key default gen_random_uuid(),
  registration_id  uuid        not null references public.liga_registrations(id) on delete cascade,
  -- clock_timestamp() y no now(): varios eventos de una misma transacción
  -- tienen que quedar ordenados.
  at               timestamptz not null default clock_timestamp(),
  actor            text        not null check (char_length(actor) between 1 and 200),
  kind             text        not null check (char_length(kind) between 1 and 40),
  summary          text        not null check (char_length(summary) between 1 and 600)
);

create index if not exists liga_registration_events_reg_idx
  on public.liga_registration_events (registration_id, at desc);

alter table public.liga_registration_events enable row level security;

-- 3. Helper interno: inserta los eventos de un cambio
create or replace function public.liga_log_events(
  p_registration_id uuid,
  p_actor           text,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event jsonb;
begin
  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    return;
  end if;
  for v_event in select * from jsonb_array_elements(p_events)
  loop
    insert into public.liga_registration_events (registration_id, actor, kind, summary)
    values (
      p_registration_id,
      coalesce(nullif(trim(p_actor), ''), 'desconocido'),
      coalesce(v_event->>'kind', 'info'),
      v_event->>'summary'
    );
  end loop;
end;
$$;

revoke all on function public.liga_log_events(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.liga_log_events(uuid, text, jsonb) to service_role;

-- 4. Datos generales (equipo, teléfono, observaciones). Pendiente o aprobada.
--    El slug del equipo no cambia al renombrarlo (no se rompen los links).
create or replace function public.update_liga_registration_info(
  p_registration_id uuid,
  p_actor           text,
  p_team_name       text,
  p_captain_phone   text,
  p_notes           text,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.liga_registrations%rowtype;
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status not in ('pending', 'approved') then
    raise exception 'Esta inscripción ya no se puede editar.';
  end if;

  update public.liga_registrations
    set team_name = p_team_name,
        captain_phone = p_captain_phone,
        notes = p_notes,
        updated_at = now()
    where id = p_registration_id;

  if v_reg.status = 'approved' and v_reg.team_id is not null then
    update public.teams set name = p_team_name, updated_at = now() where id = v_reg.team_id;
  end if;

  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.update_liga_registration_info(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.update_liga_registration_info(uuid, text, text, text, text, jsonb) to service_role;

-- 5. Cambio de categoría. Con el cuadro sorteado (la categoría tiene series)
--    queda bloqueado: es una regla del reglamento, no se infiere.
create or replace function public.change_liga_registration_category(
  p_registration_id uuid,
  p_actor           text,
  p_category_id     uuid,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg    public.liga_registrations%rowtype;
  v_slug   text;
  v_base   text;
  v_n      int := 1;
  v_clash  text;
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status not in ('pending', 'approved') then
    raise exception 'Esta inscripción ya no se puede editar.';
  end if;
  if v_reg.category_id = p_category_id then
    return;
  end if;
  if not exists (
    select 1 from public.categories where id = p_category_id and tournament_id = v_reg.tournament_id
  ) then
    raise exception 'La categoría no es de esta edición.';
  end if;

  if v_reg.status = 'approved' and v_reg.team_id is not null then
    if exists (select 1 from public.series where category_id in (v_reg.category_id, p_category_id)) then
      raise exception 'El cuadro ya está sorteado: no se puede cambiar de categoría.';
    end if;

    -- Nadie del plantel puede estar activo en otro equipo de la nueva categoría
    select t.name into v_clash
    from public.team_players mine
    join public.team_players tp on tp.player_id = mine.player_id and tp.active
    join public.teams t on t.id = tp.team_id and t.active
    where mine.team_id = v_reg.team_id and mine.active
      and t.category_id = p_category_id and t.id <> v_reg.team_id
    limit 1;
    if v_clash is not null then
      raise exception 'Alguien del plantel ya juega en "%" en la categoría de destino.', v_clash;
    end if;

    -- El slug es único por categoría: solo cambia si choca
    select slug into v_base from public.teams where id = v_reg.team_id;
    v_slug := v_base;
    while exists (
      select 1 from public.teams where category_id = p_category_id and slug = v_slug and id <> v_reg.team_id
    ) loop
      v_n := v_n + 1;
      v_slug := v_base || '-' || v_n;
    end loop;

    update public.teams
      set category_id = p_category_id, slug = v_slug, updated_at = now()
      where id = v_reg.team_id;
  end if;

  update public.liga_registrations
    set category_id = p_category_id, updated_at = now()
    where id = p_registration_id;

  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.change_liga_registration_category(uuid, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.change_liga_registration_category(uuid, text, uuid, jsonb) to service_role;

-- 6. Jugadores de una solicitud PENDIENTE: recibe la lista completa deseada
--    [{id|null, first_name, last_name, dni, birth_date?, is_captain}]. Quita los que no
--    están, agrega los nuevos y actualiza el resto; un jugador cuyo nombre o
--    DNI cambió vuelve a resolution = 'pending'. birth_date (opcional, date) es
--    lo declarado en la solicitud: si la clave viene, se guarda (null la borra);
--    si no viene, se conserva. Cambiarla NO pide revalidar al jugador.
create or replace function public.save_liga_registration_players(
  p_registration_id uuid,
  p_actor           text,
  p_players         jsonb,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg     public.liga_registrations%rowtype;
  v_item    jsonb;
  v_idx     int := 0;
  v_id      uuid;
  v_old     public.liga_registration_players%rowtype;
  v_first   text;
  v_last    text;
  v_dni     text;
  v_birth   date;
  v_cap     boolean;
  v_captains int := 0;
  v_keep    uuid[] := '{}';
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status <> 'pending' then
    raise exception 'Los jugadores de una solicitud solo se editan mientras está pendiente.';
  end if;
  if p_players is null or jsonb_typeof(p_players) <> 'array'
     or jsonb_array_length(p_players) < 1 or jsonb_array_length(p_players) > 50 then
    raise exception 'La lista de jugadores es inválida.';
  end if;

  -- Validaciones de toda la lista antes de tocar nada
  for v_item in select * from jsonb_array_elements(p_players)
  loop
    if coalesce(trim(v_item->>'first_name'), '') = '' or coalesce(trim(v_item->>'last_name'), '') = '' then
      raise exception 'Todos los jugadores necesitan nombre y apellido.';
    end if;
    if coalesce(v_item->>'dni', '') !~ '^[0-9]{7,8}$' then
      raise exception 'El DNI de % tiene que tener 7 u 8 dígitos.', (v_item->>'last_name') || ' ' || (v_item->>'first_name');
    end if;
    if nullif(v_item->>'birth_date', '') is not null then
      if (v_item->>'birth_date') !~ '^\d{4}-\d{2}-\d{2}$'
         or (v_item->>'birth_date')::date > current_date
         or (v_item->>'birth_date')::date < date '1920-01-01' then
        raise exception 'La fecha de nacimiento de % es inválida.', (v_item->>'last_name') || ' ' || (v_item->>'first_name');
      end if;
    end if;
    if coalesce((v_item->>'is_captain')::boolean, false) then
      v_captains := v_captains + 1;
    end if;
  end loop;
  if v_captains <> 1 then
    raise exception 'Tiene que haber exactamente un capitán.';
  end if;
  if (select count(distinct e->>'dni') from jsonb_array_elements(p_players) e) <> jsonb_array_length(p_players) then
    raise exception 'Hay un DNI repetido en la inscripción.';
  end if;

  -- Ids que se conservan
  for v_item in select * from jsonb_array_elements(p_players)
  loop
    if v_item->>'id' is not null then
      v_id := (v_item->>'id')::uuid;
      if not exists (
        select 1 from public.liga_registration_players where id = v_id and registration_id = p_registration_id
      ) then
        raise exception 'Un jugador de la lista no pertenece a esta inscripción.';
      end if;
      v_keep := v_keep || v_id;
    end if;
  end loop;

  delete from public.liga_registration_players
    where registration_id = p_registration_id and not (id = any (v_keep));
  -- Se libera el capitán antes de asignar el nuevo (índice único parcial)
  update public.liga_registration_players set is_captain = false where registration_id = p_registration_id;

  for v_item in select * from jsonb_array_elements(p_players)
  loop
    v_first := regexp_replace(trim(v_item->>'first_name'), '\s+', ' ', 'g');
    v_last  := regexp_replace(trim(v_item->>'last_name'), '\s+', ' ', 'g');
    v_dni   := v_item->>'dni';
    v_birth := nullif(v_item->>'birth_date', '')::date;
    v_cap   := coalesce((v_item->>'is_captain')::boolean, false);

    if v_item->>'id' is not null then
      select * into v_old from public.liga_registration_players where id = (v_item->>'id')::uuid;
      if (v_old.first_name, v_old.last_name, v_old.dni) is distinct from (v_first, v_last, v_dni) then
        update public.liga_registration_players
          set first_name = v_first, last_name = v_last, dni = v_dni,
              is_captain = v_cap, sort_order = v_idx,
              resolution = 'pending', resolved_player_id = null
          where id = v_old.id;
      else
        update public.liga_registration_players
          set is_captain = v_cap, sort_order = v_idx
          where id = v_old.id;
      end if;
      if v_item ? 'birth_date' then
        update public.liga_registration_players set birth_date = v_birth where id = v_old.id;
      end if;
    else
      insert into public.liga_registration_players
        (registration_id, first_name, last_name, dni, birth_date, is_captain, sort_order)
      values (p_registration_id, v_first, v_last, v_dni, v_birth, v_cap, v_idx);
    end if;
    v_idx := v_idx + 1;
  end loop;

  update public.liga_registrations set updated_at = now() where id = p_registration_id;
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.save_liga_registration_players(uuid, text, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_liga_registration_players(uuid, text, jsonb, jsonb) to service_role;

-- 7. Aprobar (015) + historial en la misma transacción
create or replace function public.approve_liga_registration_logged(
  p_registration_id uuid,
  p_medals          jsonb,
  p_actor           text,
  p_events          jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  v_team_id := public.approve_liga_registration(p_registration_id, p_medals);
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
  return v_team_id;
end;
$$;

revoke all on function public.approve_liga_registration_logged(uuid, jsonb, text, jsonb) from public, anon, authenticated;
grant execute on function public.approve_liga_registration_logged(uuid, jsonb, text, jsonb) to service_role;

-- 8. Rechazar (con motivo interno opcional) y reabrir
create or replace function public.reject_liga_registration(
  p_registration_id uuid,
  p_actor           text,
  p_reason          text,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_status <> 'pending' then
    raise exception 'La inscripción ya fue revisada.';
  end if;
  update public.liga_registrations
    set status = 'rejected', rejection_reason = nullif(trim(p_reason), ''),
        reviewed_at = now(), updated_at = now()
    where id = p_registration_id;
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.reject_liga_registration(uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.reject_liga_registration(uuid, text, text, jsonb) to service_role;

create or replace function public.reopen_liga_registration(
  p_registration_id uuid,
  p_actor           text,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status into v_status from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_status <> 'rejected' then
    raise exception 'Solo se puede reabrir una inscripción rechazada.';
  end if;
  update public.liga_registrations
    set status = 'pending', rejection_reason = null, reviewed_at = null, updated_at = now()
    where id = p_registration_id;
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.reopen_liga_registration(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.reopen_liga_registration(uuid, text, jsonb) to service_role;

-- 9. Plantel de un equipo aprobado ----------------------------------------

-- Agregar un jugador: p_mode = 'existing' (p_player_id) o 'new' (se crea).
-- p_birth_date (opcional): se guarda en player_private al crear el jugador o
-- al completar uno que no tenía; nunca pisa una fecha existente.
create or replace function public.add_liga_team_player(
  p_registration_id uuid,
  p_actor           text,
  p_first_name      text,
  p_last_name       text,
  p_dni             text,
  p_mode            text,
  p_player_id       uuid,
  p_events          jsonb,
  p_birth_date      date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg       public.liga_registrations%rowtype;
  v_cat       uuid;
  v_player_id uuid;
  v_owner     uuid;
  v_other     text;
  v_first     text := regexp_replace(trim(coalesce(p_first_name, '')), '\s+', ' ', 'g');
  v_last      text := regexp_replace(trim(coalesce(p_last_name, '')), '\s+', ' ', 'g');
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status <> 'approved' or v_reg.team_id is null then
    raise exception 'El plantel se edita una vez aprobada la inscripción.';
  end if;
  if coalesce(p_dni, '') !~ '^[0-9]{7,8}$' then
    raise exception 'El DNI tiene que tener 7 u 8 dígitos.';
  end if;
  select category_id into v_cat from public.teams where id = v_reg.team_id;

  if p_mode = 'existing' then
    if p_player_id is null or not exists (select 1 from public.players where id = p_player_id) then
      raise exception 'El jugador elegido no existe.';
    end if;
    v_player_id := p_player_id;
    -- Si no tenía DNI se guarda; si ya tiene uno, no se pisa.
    if not exists (select 1 from public.player_private where player_id = v_player_id) then
      select player_id into v_owner from public.player_private where dni = p_dni;
      if found then
        raise exception 'El DNI % ya está cargado en otro jugador.', p_dni;
      end if;
      insert into public.player_private (player_id, dni, birth_date) values (v_player_id, p_dni, p_birth_date);
    elsif p_birth_date is not null then
      update public.player_private
        set birth_date = p_birth_date, updated_at = now()
        where player_id = v_player_id and birth_date is null;
    end if;
  elsif p_mode = 'new' then
    if v_first = '' or v_last = '' then
      raise exception 'Completá nombre y apellido.';
    end if;
    select player_id into v_owner from public.player_private where dni = p_dni;
    if found then
      raise exception 'El DNI % ya está cargado en otro jugador.', p_dni;
    end if;
    insert into public.players (first_name, last_name, display_name, active)
    values (v_first, v_last, v_last || ' ' || v_first, true)
    returning id into v_player_id;
    insert into public.player_private (player_id, dni, birth_date) values (v_player_id, p_dni, p_birth_date);
  else
    raise exception 'Modo de alta inválido.';
  end if;

  -- Un jugador no puede estar activo en dos equipos de la misma categoría
  select t.name into v_other
  from public.team_players tp
  join public.teams t on t.id = tp.team_id and t.active
  where tp.player_id = v_player_id and tp.active
    and t.category_id = v_cat and t.id <> v_reg.team_id
  limit 1;
  if v_other is not null then
    raise exception 'Ya juega en "%" en esta categoría.', v_other;
  end if;

  if exists (select 1 from public.team_players where team_id = v_reg.team_id and player_id = v_player_id) then
    update public.team_players
      set active = true, updated_at = now()
      where team_id = v_reg.team_id and player_id = v_player_id;
  else
    insert into public.team_players (team_id, player_id, is_captain, active)
    values (v_reg.team_id, v_player_id, false, true);
  end if;

  update public.liga_registrations set updated_at = now() where id = p_registration_id;
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
  return v_player_id;
end;
$$;

revoke all on function public.add_liga_team_player(uuid, text, text, text, text, text, uuid, jsonb, date) from public, anon, authenticated;
grant execute on function public.add_liga_team_player(uuid, text, text, text, text, text, uuid, jsonb, date) to service_role;

-- Quitar un jugador del plantel (team_players.active = false). No quita al capitán.
create or replace function public.remove_liga_team_player(
  p_registration_id uuid,
  p_actor           text,
  p_player_id       uuid,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.liga_registrations%rowtype;
  v_tp  public.team_players%rowtype;
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status <> 'approved' or v_reg.team_id is null then
    raise exception 'El plantel se edita una vez aprobada la inscripción.';
  end if;
  select * into v_tp from public.team_players
    where team_id = v_reg.team_id and player_id = p_player_id and active;
  if not found then
    raise exception 'Ese jugador no está en el plantel.';
  end if;
  if v_tp.is_captain then
    raise exception 'Es el capitán del equipo: elegí otro capitán antes de quitarlo.';
  end if;
  update public.team_players set active = false, updated_at = now() where id = v_tp.id;
  update public.liga_registrations set updated_at = now() where id = p_registration_id;
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.remove_liga_team_player(uuid, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.remove_liga_team_player(uuid, text, uuid, jsonb) to service_role;

-- Cambiar el capitán: exactamente uno en team_players y teams.captain_name.
create or replace function public.set_liga_team_captain(
  p_registration_id uuid,
  p_actor           text,
  p_player_id       uuid,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg  public.liga_registrations%rowtype;
  v_name text;
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status <> 'approved' or v_reg.team_id is null then
    raise exception 'El capitán se cambia una vez aprobada la inscripción.';
  end if;
  if not exists (
    select 1 from public.team_players where team_id = v_reg.team_id and player_id = p_player_id and active
  ) then
    raise exception 'El capitán tiene que ser un jugador del plantel.';
  end if;
  select display_name into v_name from public.players where id = p_player_id;

  update public.team_players
    set is_captain = (player_id = p_player_id), updated_at = now()
    where team_id = v_reg.team_id and (is_captain or player_id = p_player_id);
  update public.teams set captain_name = v_name, updated_at = now() where id = v_reg.team_id;
  update public.liga_registrations set updated_at = now() where id = p_registration_id;
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.set_liga_team_captain(uuid, text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.set_liga_team_captain(uuid, text, uuid, jsonb) to service_role;

-- Corregir nombre / apellido / DNI de un jugador del plantel. La ficha del
-- jugador (players) es una sola para Liga y Circuito. Un DNI que ya es de otro
-- jugador no se pisa. p_birth_date: corrección explícita del admin, SÍ pisa la
-- fecha guardada; null significa "no tocar" (no se puede borrar desde acá).
create or replace function public.correct_liga_team_player(
  p_registration_id uuid,
  p_actor           text,
  p_player_id       uuid,
  p_first_name      text,
  p_last_name       text,
  p_dni             text,
  p_events          jsonb,
  p_birth_date      date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg   public.liga_registrations%rowtype;
  v_first text := regexp_replace(trim(coalesce(p_first_name, '')), '\s+', ' ', 'g');
  v_last  text := regexp_replace(trim(coalesce(p_last_name, '')), '\s+', ' ', 'g');
  v_owner uuid;
  v_cur   text;
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status <> 'approved' or v_reg.team_id is null then
    raise exception 'El plantel se edita una vez aprobada la inscripción.';
  end if;
  if not exists (
    select 1 from public.team_players where team_id = v_reg.team_id and player_id = p_player_id and active
  ) then
    raise exception 'Ese jugador no está en el plantel.';
  end if;
  if v_first = '' or v_last = '' then
    raise exception 'Completá nombre y apellido.';
  end if;
  if coalesce(p_dni, '') !~ '^[0-9]{7,8}$' then
    raise exception 'El DNI tiene que tener 7 u 8 dígitos.';
  end if;

  select dni into v_cur from public.player_private where player_id = p_player_id;
  if v_cur is distinct from p_dni then
    select player_id into v_owner from public.player_private where dni = p_dni and player_id <> p_player_id;
    if found then
      raise exception 'El DNI % ya es de otro jugador: no se puede pisar.', p_dni;
    end if;
    if v_cur is null then
      insert into public.player_private (player_id, dni, birth_date) values (p_player_id, p_dni, p_birth_date);
    else
      update public.player_private set dni = p_dni, updated_at = now() where player_id = p_player_id;
    end if;
  end if;

  if p_birth_date is not null then
    update public.player_private set birth_date = p_birth_date, updated_at = now() where player_id = p_player_id;
  end if;

  update public.players
    set first_name = v_first, last_name = v_last, display_name = v_last || ' ' || v_first, updated_at = now()
    where id = p_player_id;

  update public.teams
    set captain_name = v_last || ' ' || v_first, updated_at = now()
    where id = v_reg.team_id
      and exists (
        select 1 from public.team_players
        where team_id = v_reg.team_id and player_id = p_player_id and is_captain and active
      );

  update public.liga_registrations set updated_at = now() where id = p_registration_id;
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.correct_liga_team_player(uuid, text, uuid, text, text, text, jsonb, date) from public, anon, authenticated;
grant execute on function public.correct_liga_team_player(uuid, text, uuid, text, text, text, jsonb, date) to service_role;

-- Dar de baja el equipo: teams.active = false, plantel inactivo (igual que la
-- baja del panel Jugadores) y la inscripción pasa a 'withdrawn'. NO toca
-- series ni tabla de posiciones: qué pasa con los partidos es una regla
-- deportiva y no se infiere.
create or replace function public.withdraw_liga_team(
  p_registration_id uuid,
  p_actor           text,
  p_events          jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reg public.liga_registrations%rowtype;
begin
  select * into v_reg from public.liga_registrations where id = p_registration_id for update;
  if not found then
    raise exception 'La inscripción no existe.';
  end if;
  if v_reg.status <> 'approved' or v_reg.team_id is null then
    raise exception 'Solo se puede dar de baja un equipo aprobado.';
  end if;
  update public.teams set active = false, updated_at = now() where id = v_reg.team_id;
  update public.team_players set active = false, updated_at = now() where team_id = v_reg.team_id and active;
  update public.liga_registrations set status = 'withdrawn', updated_at = now() where id = p_registration_id;
  perform public.liga_log_events(p_registration_id, p_actor, p_events);
end;
$$;

revoke all on function public.withdraw_liga_team(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.withdraw_liga_team(uuid, text, jsonb) to service_role;
