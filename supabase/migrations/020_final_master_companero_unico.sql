-- ============================================================
-- Final Master: un compañero (player_2_id) no se repite en la categoría.
--
-- Complementa el índice (category_id, player_id) de la 019: evita que dos
-- parejas de la misma categoría tengan el mismo compañero ante dos cambios
-- simultáneos. Las server actions traducen la violación (código 23505) a
-- "Otro cambio se hizo al mismo tiempo; recargá la página."
--
-- El cruce entre filas (un jugador como player_id en una pareja y como
-- player_2_id en otra) no lo cubre un índice: lo valida la action
-- (hay un solo admin operando, el riesgo de carrera es mínimo).
--
-- Idempotente y segura: si hay duplicados emite un NOTICE y omite el índice;
-- corregí a mano y volvé a correrla.
--
-- Se corre a mano en el SQL editor de Supabase.
-- ============================================================

do $$
begin
  -- Detectar duplicados:
  --   select category_id, player_2_id, count(*) from public.mid_master_participants
  --   where player_2_id is not null group by 1, 2 having count(*) > 1;
  if exists (
    select 1 from public.mid_master_participants
    where player_2_id is not null
    group by category_id, player_2_id having count(*) > 1
  ) then
    raise notice 'OMITIDO mid_master_participants_category_player2_uidx: hay compañeros duplicados (category_id, player_2_id).';
  else
    create unique index if not exists mid_master_participants_category_player2_uidx
      on public.mid_master_participants (category_id, player_2_id)
      where player_2_id is not null;
  end if;
end
$$;
