-- ============================================================
-- Fecha de nacimiento (opcional y privada) en la inscripción a la Liga
--
-- - liga_registration_players.birth_date: lo que declara el capitán, opcional.
-- - player_private.birth_date: dato privado (igual que el DNI, `players` tiene
--   lectura pública y NO lleva este dato). `dni` sigue siendo NOT NULL
--   (definición de 013); birth_date es nullable.
-- - approve_liga_registration(): igual a 013, y además copia birth_date a
--   player_private al insertar y en jugadores existentes que la tengan vacía.
--   Nunca pisa un valor no nulo.
-- ============================================================

-- 1. Columnas
alter table public.liga_registration_players
  add column if not exists birth_date date;
alter table public.player_private
  add column if not exists birth_date date;

-- 2. Aprobación atómica (idéntica a 013, más el copiado de birth_date)
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
      insert into public.player_private (player_id, dni, birth_date)
      values (v_player_id, v_player.dni, v_player.birth_date);
    else
      v_player_id := v_player.resolved_player_id;
      -- Si el jugador no tenía DNI, se guarda; si ya tiene uno, no se pisa.
      if not exists (select 1 from public.player_private where player_id = v_player_id) then
        select player_id into v_dni_owner from public.player_private where dni = v_player.dni;
        if found then
          raise exception 'El DNI % ya está cargado en otro jugador.', v_player.dni;
        end if;
        insert into public.player_private (player_id, dni, birth_date)
        values (v_player_id, v_player.dni, v_player.birth_date);
      elsif v_player.birth_date is not null then
        -- Solo se completa si estaba vacía: nunca se pisa un valor existente.
        update public.player_private
          set birth_date = v_player.birth_date, updated_at = now()
          where player_id = v_player_id and birth_date is null;
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
