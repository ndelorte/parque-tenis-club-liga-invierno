-- ============================================================
-- Podio cargado a mano — Sprint L7
-- Fallback para ediciones históricas sin fixture/playoffs
-- digitalizados: si no hay serie "final"/"third_place" cargada,
-- la vista de edición cerrada usa estos 3 campos.
-- No pisa el dato derivado: getPodiumForCategory() en
-- lib/data/playoffs.ts prioriza siempre las series reales.
-- ============================================================

alter table public.categories
  add column manual_champion_name text,
  add column manual_runner_up_name text,
  add column manual_third_place_name text;
