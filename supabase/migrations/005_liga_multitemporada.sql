-- ============================================================
-- Liga Multi-Temporada — Sprint L1
-- Habilita status 'upcoming' en tournaments y resuelve el bug de
-- categories.slug único global (rompe con 2 ediciones que
-- comparten slug de categoría, ej. "caballeros-a" en 2025 y 2026).
-- ============================================================

-- tournaments.status: agregar 'upcoming'
alter table public.tournaments
  drop constraint tournaments_status_check;

alter table public.tournaments
  add constraint tournaments_status_check
  check (status in ('active', 'finished', 'upcoming'));

-- categories.slug: de único global a único por torneo
alter table public.categories
  drop constraint categories_slug_key;

alter table public.categories
  add constraint categories_tournament_slug_key
  unique (tournament_id, slug);
