-- ============================================================
-- Cierra la escritura de las tablas nuevas del Circuito del Parque y de
-- mid_master_editions (migraciones 007 y 008).
--
-- Antes: "for all to authenticated using (true)" — cualquier usuario con
-- sesión (no solo admins) podía escribir con la anon key desde el browser,
-- salteando las server actions. Si el proyecto tiene habilitado el signup
-- público, eso es cualquiera.
--
-- Ahora: sin policies de escritura. Con RLS habilitado eso deja la
-- escritura solo al service_role (bypasea RLS), que usan exclusivamente las
-- server actions de app/actions/*, y esas validan el rol admin primero
-- (lib/auth/requireAdmin.ts). Ninguna escritura de la app a estas tablas
-- usa el cliente anon/authenticated, así que no rompe el panel.
--
-- No se usa un chequeo por rol en el JWT a propósito: isAdminUser() acepta
-- el rol en user_metadata, que el propio usuario puede editar.
--
-- La lectura pública (public_select_*) no cambia.
-- ============================================================

drop policy if exists "auth_all_circuito_editions"        on public.circuito_editions;
drop policy if exists "auth_all_circuito_categories"      on public.circuito_categories;
drop policy if exists "auth_all_circuito_participants"    on public.circuito_participants;
drop policy if exists "auth_all_circuito_matches"         on public.circuito_matches;
drop policy if exists "auth_all_circuito_ranking_points"  on public.circuito_ranking_points;

drop policy if exists "auth_insert_mid_master_editions" on public.mid_master_editions;
drop policy if exists "auth_update_mid_master_editions" on public.mid_master_editions;
drop policy if exists "auth_delete_mid_master_editions" on public.mid_master_editions;
