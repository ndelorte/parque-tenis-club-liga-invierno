-- ============================================================
-- Datos de prueba — Sprint C3 (modelo de datos del Circuito del Parque)
-- Objetivo: validar que las 5 tablas circuito_* y sus relaciones (FKs,
-- constraints, RLS) funcionan de punta a punta. No es un torneo real:
-- usa jugadoras ya existentes en `players` solo para poblar el esquema.
-- Reemplazar/borrar cuando arranque el Sprint C4 (motor de cuadros).
-- ============================================================

do $$
declare
  edition_id  uuid;
  category_id uuid;
  p_ids       uuid[];
  part_ids    uuid[];
  i           int;
begin
  insert into public.circuito_editions (slug, name, month, year, status)
  values ('test-circuito-2026-06', 'Test — Junio 2026', 6, 2026, 'active')
  returning id into edition_id;

  insert into public.circuito_categories (edition_id, name, slug, type, draw_size, sort_order)
  values (edition_id, 'Damas Segunda', 'damas-segunda', 'single', 8, 1)
  returning id into category_id;

  -- 8 jugadoras existentes en `players`, solo para poblar el esquema de prueba
  select array_agg(id) into p_ids
  from public.players
  where display_name in (
    'Rodriguez Cecilia', 'Banegas Daiana', 'Gerez Carla', 'Baum Fernanda',
    'Moreno Karina', 'Zanetti Cecilia', 'Feininger Laura', 'Staffolani Laura'
  );

  part_ids := array[]::uuid[];
  for i in 1..array_length(p_ids, 1) loop
    declare
      pid  uuid;
      dn   text;
    begin
      select display_name into dn from public.players where id = p_ids[i];
      insert into public.circuito_participants (category_id, player_id, display_name, seed)
      values (category_id, p_ids[i], dn, i)
      returning id into pid;
      part_ids := part_ids || pid;
    end;
  end loop;

  -- Ronda 1 del cuadro principal: 4 partidos. Los dos primeros ya jugados
  -- (para probar score/winner/status), los otros dos pendientes.
  insert into public.circuito_matches
    (category_id, bracket, round_number, participant_a_id, participant_b_id, score, winner_id, status)
  values
    (category_id, 'main', 1, part_ids[1], part_ids[8], '6-4 6-3', part_ids[1], 'played');

  insert into public.circuito_matches
    (category_id, bracket, round_number, participant_a_id, participant_b_id, score, winner_id, status)
  values
    (category_id, 'main', 1, part_ids[4], part_ids[5], '7-6 4-6 7-6', part_ids[4], 'played');

  insert into public.circuito_matches
    (category_id, bracket, round_number, participant_a_id, participant_b_id, status)
  values
    (category_id, 'main', 1, part_ids[3], part_ids[6], 'pending');

  insert into public.circuito_matches
    (category_id, bracket, round_number, participant_a_id, participant_b_id, status)
  values
    (category_id, 'main', 1, part_ids[2], part_ids[7], 'scheduled');

  -- Ronda 2 (semifinal): todavía sin participantes definidos (avanzan al
  -- cargar resultados — Sprint C5 / advanceWinner).
  insert into public.circuito_matches (category_id, bracket, round_number, status)
  values (category_id, 'main', 2, 'pending');

  -- Repechaje: perdedoras de 1ª ronda ya jugada (part_ids[8] y part_ids[5]), cuadro aparte.
  insert into public.circuito_matches
    (category_id, bracket, round_number, participant_a_id, participant_b_id, status)
  values
    (category_id, 'repechaje', 1, part_ids[8], part_ids[5], 'pending');

  -- Puntos de ranking de prueba (snapshot — se recalcula desde cero en Sprint C5).
  insert into public.circuito_ranking_points (player_id, category_id, edition_id, points)
  select cp.player_id, cp.category_id, cc.edition_id, 50
  from public.circuito_participants cp
  join public.circuito_categories cc on cc.id = cp.category_id
  where cp.id = part_ids[1];
end $$;
