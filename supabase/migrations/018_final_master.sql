-- ============================================================
-- Final Master (cierre de temporada del Circuito del Parque).
--
-- El Final Master reutiliza el formato y las tablas del Mid Master
-- (mid_master_editions / _categories / _groups / _participants / _matches).
-- Se distingue por el slug de la edición: `final-master-YYYY`.
--   status 'upcoming' = borrador (el panel lo arma, la web pública NO lo muestra)
--   status 'active'   = publicado (botón "Publicar torneo" del panel)
--   status 'finished' = terminado
--
-- Cambios:
--  1. mid_master_participants.player_id / player_2_id: vínculo con `players`
--     para calcular el ranking anual de cada inscripto (dobles: los dos).
--  2. mid_master_participants.group_name pasa a admitir null: antes de armar
--     los cuadros los inscriptos todavía no tienen zona.
--
-- RLS: no hace falta tocar nada. 017 dejó lectura pública (public_select_*,
-- aplica a las columnas nuevas) y escritura solo con service role, que es lo
-- que usan las server actions del panel.
--
-- Idempotente: se puede re-ejecutar. Se corre a mano en el SQL editor.
-- ============================================================

alter table public.mid_master_participants
  add column if not exists player_id uuid references public.players(id),
  add column if not exists player_2_id uuid references public.players(id);

alter table public.mid_master_participants
  alter column group_name drop not null;
