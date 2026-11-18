-- ============================================================
-- Final Master: integridad del sorteo (índices únicos).
--
-- Evita que dos clics/pestañas simultáneas dejen zonas, partidos o inscriptos
-- duplicados. Las server actions traducen la violación (código 23505) a
-- "Otro cambio se hizo al mismo tiempo; recargá la página."
--
-- Aplica también al Mid Master: sus datos reales cumplen las condiciones
-- (por categoría: zonas A y B, 2 semifinales con match_order 1 y 2 y una final
-- con match_order 1; los partidos de zona no repiten pareja). Los índices con
-- match_order ignoran las filas con match_order null (en unique, null != null).
--
-- Idempotente y segura: cada índice se crea solo si no hay duplicados que lo
-- impidan; si los hay, emite un NOTICE con el nombre del índice omitido y la
-- migración sigue con los demás. Con el NOTICE, corregí los duplicados a mano
-- (consulta de detección en el comentario de cada índice) y volvé a correrla.
--
-- Nota de seguridad aceptada: la RLS de la 017 deja leer mid_master_* por la
-- API pública (anon), incluido el borrador del Final Master (inscriptos,
-- zonas y partidos antes de publicar). Son nombres de jugadores y UUID, no hay
-- datos sensibles; el borrador no se muestra en la web pero es legible por API.
-- Decisión aceptada, no se cambia acá.
--
-- Se corre a mano en el SQL editor de Supabase.
-- ============================================================

do $$
begin
  -- 1. Zonas: un nombre de zona por categoría.
  -- Detectar duplicados:
  --   select category_id, name, count(*) from public.mid_master_groups
  --   group by 1, 2 having count(*) > 1;
  if exists (
    select 1 from public.mid_master_groups group by category_id, name having count(*) > 1
  ) then
    raise notice 'OMITIDO mid_master_groups_category_name_uidx: hay zonas duplicadas (category_id, name).';
  else
    create unique index if not exists mid_master_groups_category_name_uidx
      on public.mid_master_groups (category_id, name);
  end if;

  -- 2. Cuadro final (partidos sin zona): un partido por fase y orden en la categoría.
  -- Detectar duplicados:
  --   select category_id, phase, match_order, count(*) from public.mid_master_matches
  --   where group_id is null group by 1, 2, 3 having count(*) > 1;
  if exists (
    select 1 from public.mid_master_matches
    where group_id is null
    group by category_id, phase, match_order having count(*) > 1
  ) then
    raise notice 'OMITIDO mid_master_matches_knockout_uidx: hay partidos de cuadro final duplicados (category_id, phase, match_order).';
  else
    create unique index if not exists mid_master_matches_knockout_uidx
      on public.mid_master_matches (category_id, phase, match_order)
      where group_id is null;
  end if;

  -- 3. Partidos de zona: una pareja no se repite dentro de la zona.
  -- Detectar duplicados:
  --   select group_id, participant_1_id, participant_2_id, count(*) from public.mid_master_matches
  --   where group_id is not null group by 1, 2, 3 having count(*) > 1;
  if exists (
    select 1 from public.mid_master_matches
    where group_id is not null
    group by group_id, participant_1_id, participant_2_id having count(*) > 1
  ) then
    raise notice 'OMITIDO mid_master_matches_zone_uidx: hay partidos de zona duplicados (group_id, participant_1_id, participant_2_id).';
  else
    create unique index if not exists mid_master_matches_zone_uidx
      on public.mid_master_matches (group_id, participant_1_id, participant_2_id)
      where group_id is not null;
  end if;

  -- 4. Inscriptos: un jugador no se inscribe dos veces en la categoría
  -- (solo filas con player_id: el Mid Master no lo usa, queda null).
  -- Detectar duplicados:
  --   select category_id, player_id, count(*) from public.mid_master_participants
  --   where player_id is not null group by 1, 2 having count(*) > 1;
  if exists (
    select 1 from public.mid_master_participants
    where player_id is not null
    group by category_id, player_id having count(*) > 1
  ) then
    raise notice 'OMITIDO mid_master_participants_category_player_uidx: hay inscriptos duplicados (category_id, player_id).';
  else
    create unique index if not exists mid_master_participants_category_player_uidx
      on public.mid_master_participants (category_id, player_id)
      where player_id is not null;
  end if;
end
$$;
