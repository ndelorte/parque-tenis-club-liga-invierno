-- ============================================================
-- Sprint C5 — columnas que faltaban en circuito_matches para poder
-- persistir el cuadro que arma lib/circuito/generateBracket.ts y
-- propagar ganadores (lib/circuito/advanceWinner.ts) contra la DB:
--
-- - position: índice 0-based del partido dentro de su
--   (category_id, bracket, round_number). Sin esto no hay forma
--   determinística de saber a qué partido de la ronda siguiente avanza
--   el ganador (next = floor(position/2)).
-- - zone: 'A' | 'B' para los partidos de zona del formato 6-7
--   inscriptos (groups_then_knockout). null en el resto de los formatos.
-- ============================================================

alter table public.circuito_matches
  add column position integer not null default 0,
  add column zone text check (zone in ('A', 'B'));

create unique index circuito_matches_position_idx
  on public.circuito_matches (category_id, bracket, round_number, position);
