-- ============================================================
-- Seed inicial — Mid Master 2026
-- Crea edición, categorías, zonas, participantes y fixture.
-- Los nombres de participantes son placeholders — reemplazarlos
-- desde /panel-master/categorias/[slug].
-- ============================================================

-- Edición
insert into public.mm_editions (name, slug, year, status, description)
values ('Mid Master', 'mid-master', 2026, 'active', 'Torneo de mitad de temporada 2026');

-- ── Helper: crea zonas + participantes + fixture para una categoría ──────────
-- Se repite por categoría usando el slug para referenciar.

-- ── Single Caballeros Primera ─────────────────────────────────────────────────
do $$
declare
  cat_id  uuid;
  za_id   uuid;
  zb_id   uuid;
  pa      uuid[]; -- participantes zona A
  pb      uuid[]; -- participantes zona B
  i       int;
  j       int;
begin
  select id into cat_id from mm_categories where slug = 'single-caballeros-primera';
  if cat_id is null then
    insert into mm_categories (edition_id, name, slug, short_name, type, zone_size, sort_order)
    values ((select id from mm_editions where slug = 'mid-master'),
            'Single Caballeros Primera', 'single-caballeros-primera', 'Cab. Primera', 'singles', 4, 1)
    returning id into cat_id;
  end if;

  insert into mm_zones (category_id, name) values (cat_id, 'Zona A') returning id into za_id;
  insert into mm_zones (category_id, name) values (cat_id, 'Zona B') returning id into zb_id;

  pa := array[]::uuid[];
  for i in 1..4 loop
    declare pid uuid;
    begin
      insert into mm_participants (zone_id, display_name) values (za_id, 'Zona A · Participante ' || i) returning id into pid;
      pa := pa || pid;
    end;
  end loop;

  pb := array[]::uuid[];
  for i in 1..4 loop
    declare pid uuid;
    begin
      insert into mm_participants (zone_id, display_name) values (zb_id, 'Zona B · Participante ' || i) returning id into pid;
      pb := pb || pid;
    end;
  end loop;

  -- Round-robin zona A
  for i in 1..4 loop
    for j in (i+1)..4 loop
      insert into mm_matches (category_id, zone_id, phase, participant_a_id, participant_b_id,
        participant_a_label, participant_b_label)
      values (cat_id, za_id, 'zone', pa[i], pa[j],
        (select display_name from mm_participants where id = pa[i]),
        (select display_name from mm_participants where id = pa[j]));
    end loop;
  end loop;

  -- Round-robin zona B
  for i in 1..4 loop
    for j in (i+1)..4 loop
      insert into mm_matches (category_id, zone_id, phase, participant_a_id, participant_b_id,
        participant_a_label, participant_b_label)
      values (cat_id, zb_id, 'zone', pb[i], pb[j],
        (select display_name from mm_participants where id = pb[i]),
        (select display_name from mm_participants where id = pb[j]));
    end loop;
  end loop;

  -- Knockout
  insert into mm_matches (category_id, phase, participant_a_label, participant_b_label)
  values
    (cat_id, 'semifinal', '1° Zona A', '2° Zona B'),
    (cat_id, 'semifinal', '1° Zona B', '2° Zona A'),
    (cat_id, 'final',     'Ganador SF 1', 'Ganador SF 2');
end;
$$;

-- Macro para categorías de 4 por zona
create or replace function _mm_seed_cat4(p_slug text, p_name text, p_short text, p_type text, p_order int)
returns void language plpgsql as $$
declare
  cat_id  uuid;
  za_id   uuid;
  zb_id   uuid;
  pa      uuid[];
  pb      uuid[];
  i int; j int; pid uuid;
begin
  insert into mm_categories (edition_id, name, slug, short_name, type, zone_size, sort_order)
  values ((select id from mm_editions where slug = 'mid-master'),
          p_name, p_slug, p_short, p_type, 4, p_order)
  returning id into cat_id;

  insert into mm_zones (category_id, name) values (cat_id, 'Zona A') returning id into za_id;
  insert into mm_zones (category_id, name) values (cat_id, 'Zona B') returning id into zb_id;

  pa := array[]::uuid[];
  for i in 1..4 loop
    insert into mm_participants (zone_id, display_name) values (za_id, 'Zona A · Participante ' || i) returning id into pid;
    pa := pa || pid;
  end loop;

  pb := array[]::uuid[];
  for i in 1..4 loop
    insert into mm_participants (zone_id, display_name) values (zb_id, 'Zona B · Participante ' || i) returning id into pid;
    pb := pb || pid;
  end loop;

  for i in 1..4 loop for j in (i+1)..4 loop
    insert into mm_matches (category_id, zone_id, phase, participant_a_id, participant_b_id, participant_a_label, participant_b_label)
    values (cat_id, za_id, 'zone', pa[i], pa[j],
      (select display_name from mm_participants where id = pa[i]),
      (select display_name from mm_participants where id = pa[j]));
    insert into mm_matches (category_id, zone_id, phase, participant_a_id, participant_b_id, participant_a_label, participant_b_label)
    values (cat_id, zb_id, 'zone', pb[i], pb[j],
      (select display_name from mm_participants where id = pb[i]),
      (select display_name from mm_participants where id = pb[j]));
  end loop; end loop;

  insert into mm_matches (category_id, phase, participant_a_label, participant_b_label) values
    (cat_id, 'semifinal', '1° Zona A', '2° Zona B'),
    (cat_id, 'semifinal', '1° Zona B', '2° Zona A'),
    (cat_id, 'final',     'Ganador SF 1', 'Ganador SF 2');
end;
$$;

-- Macro para Single Damas Segunda (3 por zona)
create or replace function _mm_seed_damas3(p_slug text, p_name text, p_short text, p_order int)
returns void language plpgsql as $$
declare
  cat_id  uuid;
  za_id   uuid;
  zb_id   uuid;
  pa      uuid[];
  pb      uuid[];
  i int; j int; pid uuid;
begin
  insert into mm_categories (edition_id, name, slug, short_name, type, zone_size, sort_order)
  values ((select id from mm_editions where slug = 'mid-master'),
          p_name, p_slug, p_short, 'singles', 3, p_order)
  returning id into cat_id;

  insert into mm_zones (category_id, name) values (cat_id, 'Zona A') returning id into za_id;
  insert into mm_zones (category_id, name) values (cat_id, 'Zona B') returning id into zb_id;

  pa := array[]::uuid[];
  for i in 1..3 loop
    insert into mm_participants (zone_id, display_name) values (za_id, 'Zona A · Participante ' || i) returning id into pid;
    pa := pa || pid;
  end loop;

  pb := array[]::uuid[];
  for i in 1..3 loop
    insert into mm_participants (zone_id, display_name) values (zb_id, 'Zona B · Participante ' || i) returning id into pid;
    pb := pb || pid;
  end loop;

  for i in 1..3 loop for j in (i+1)..3 loop
    insert into mm_matches (category_id, zone_id, phase, participant_a_id, participant_b_id, participant_a_label, participant_b_label)
    values (cat_id, za_id, 'zone', pa[i], pa[j],
      (select display_name from mm_participants where id = pa[i]),
      (select display_name from mm_participants where id = pa[j]));
    insert into mm_matches (category_id, zone_id, phase, participant_a_id, participant_b_id, participant_a_label, participant_b_label)
    values (cat_id, zb_id, 'zone', pb[i], pb[j],
      (select display_name from mm_participants where id = pb[i]),
      (select display_name from mm_participants where id = pb[j]));
  end loop; end loop;

  insert into mm_matches (category_id, phase, participant_a_label, participant_b_label) values
    (cat_id, 'semifinal', '1° Zona A', '2° Zona B'),
    (cat_id, 'semifinal', '1° Zona B', '2° Zona A'),
    (cat_id, 'final',     'Ganador SF 1', 'Ganador SF 2');
end;
$$;

-- Ejecutar para cada categoría
-- (Single Caballeros Primera ya fue creada arriba como ejemplo)
select _mm_seed_cat4('single-caballeros-intermedia', 'Single Caballeros Intermedia', 'Cab. Intermedia', 'singles', 2);
select _mm_seed_cat4('single-caballeros-segunda',    'Single Caballeros Segunda',    'Cab. Segunda',    'singles', 3);
select _mm_seed_cat4('single-caballeros-tercera',    'Single Caballeros Tercera',    'Cab. Tercera',    'singles', 4);
select _mm_seed_cat4('single-caballeros-50',         'Single Caballeros +50',        'Cab. +50',        'singles', 5);
select _mm_seed_damas3('single-damas-segunda',       'Single Damas Segunda',         'Damas Segunda',           6);
select _mm_seed_cat4('doble-caballeros-segunda',     'Doble Caballeros Segunda',     'Doble Cab. Seg.',  'doubles', 7);
select _mm_seed_cat4('doble-mixto-segunda',          'Doble Mixto Segunda',          'Doble Mixto Seg.', 'doubles', 8);

-- Limpiar funciones auxiliares
drop function _mm_seed_cat4;
drop function _mm_seed_damas3;
