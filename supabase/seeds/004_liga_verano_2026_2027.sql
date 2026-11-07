-- ============================================================
-- Liga de Verano 2026/2027 — categorías + inscripción abierta
-- Requiere haber aplicado 013_liga_inscripcion.sql antes.
-- Idempotente: se puede correr más de una vez.
--
-- teams_count = 6 por defecto: ajustarlo cuando se conozcan los inscriptos.
-- Invierno 2026 está `finished`, así que pasar esta edición a `active` no
-- rompe el supuesto de una sola edición activa.
-- ============================================================

insert into public.categories
  (tournament_id, name, slug, phase_format, regular_phase_type, teams_count,
   quarterfinals_enabled, sort_order)
values
  ((select id from public.tournaments where slug = 'liga-verano-2026-2027'),
   'Damas A', 'damas-a', 'round_robin', 'home_away', 6, false, 0),
  ((select id from public.tournaments where slug = 'liga-verano-2026-2027'),
   'Damas B', 'damas-b', 'round_robin', 'home_away', 6, false, 1),
  ((select id from public.tournaments where slug = 'liga-verano-2026-2027'),
   'Caballeros A', 'caballeros-a', 'round_robin', 'home_away', 6, false, 2),
  ((select id from public.tournaments where slug = 'liga-verano-2026-2027'),
   'Caballeros B', 'caballeros-b', 'round_robin', 'home_away', 6, false, 3),
  ((select id from public.tournaments where slug = 'liga-verano-2026-2027'),
   'Mixto A', 'mixto-a', 'round_robin', 'home_away', 6, false, 4),
  ((select id from public.tournaments where slug = 'liga-verano-2026-2027'),
   'Mixto B', 'mixto-b', 'round_robin', 'home_away', 6, false, 5)
on conflict (tournament_id, slug) do nothing;

update public.tournaments
  set status = 'active',
      registration_open = true
  where slug = 'liga-verano-2026-2027';
