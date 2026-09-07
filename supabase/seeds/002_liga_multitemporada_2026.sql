-- ============================================================
-- Seed — Liga Multi-Temporada
-- Renombra la edición activa existente a "liga-invierno-2026" y
-- crea las 3 ediciones restantes del selector (Sprint L1).
-- Requiere haber aplicado 005_liga_multitemporada.sql antes.
-- ============================================================

-- La edición 2026 ya existe (creada en Sprint 7) con slug "liga-invierno".
-- Se renombra a "liga-invierno-2026" para el esquema multi-temporada.
-- Status se mantiene "active": faltan cargar los resultados de las finales,
-- y en "finished" el admin deshabilita la carga de resultados.
update public.tournaments
  set slug = 'liga-invierno-2026'
  where slug = 'liga-invierno';

-- Liga de Invierno 2025 — cerrada. Sin categorías/resultados todavía
-- (se cargan en Sprint L7, con los datos que provea el club).
insert into public.tournaments (name, slug, season, status)
values ('Liga de Invierno', 'liga-invierno-2025', 2025, 'finished')
on conflict (slug) do nothing;

-- Liga de Verano 2025-2026 — cerrada. Ídem, sin datos todavía.
insert into public.tournaments (name, slug, season, status)
values ('Liga de Verano', 'liga-verano-2025-2026', 2025, 'finished')
on conflict (slug) do nothing;

-- Liga de Verano 2026-2027 — próxima. Placeholder "Próximamente" (Sprint L5).
insert into public.tournaments (name, slug, season, status)
values ('Liga de Verano', 'liga-verano-2026-2027', 2026, 'upcoming')
on conflict (slug) do nothing;
