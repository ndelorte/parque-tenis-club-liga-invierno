-- ============================================================
-- Sprint C2 (fix) — RLS para mid_master_editions
-- La tabla se creó sin RLS habilitado explícitamente y el cliente
-- anon devolvía 0 filas (bloqueada por el proyecto por defecto).
-- Mismo patrón que 002_rls.sql: lectura pública, escritura autenticada.
-- ============================================================

alter table public.mid_master_editions enable row level security;

create policy "public_select_mid_master_editions"
  on public.mid_master_editions for select using (true);

create policy "auth_insert_mid_master_editions"
  on public.mid_master_editions for insert to authenticated with check (true);

create policy "auth_update_mid_master_editions"
  on public.mid_master_editions for update to authenticated using (true) with check (true);

create policy "auth_delete_mid_master_editions"
  on public.mid_master_editions for delete to authenticated using (true);
