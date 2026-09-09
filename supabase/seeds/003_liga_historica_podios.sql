-- ============================================================
-- Podios históricos — Sprint L7
-- Carga el podio (campeón/subcampeón/tercer puesto) de las
-- ediciones anteriores, provisto por el organizador (2026-09-09).
-- Requiere haber aplicado 007_categories_manual_podium.sql antes.
--
-- No pisa datos reales: getPodiumForCategory() (lib/data/playoffs.ts)
-- siempre prioriza la serie "final"/"third_place" digitalizada por
-- sobre estos campos manuales.
-- ============================================================

-- Liga de Verano 2024/2025 — no existía como torneo en el selector
-- multi-temporada. Se crea ya cerrada.
insert into public.tournaments (name, slug, season, status)
values ('Liga de Verano', 'liga-verano-2024-2025', 2024, 'finished')
on conflict (slug) do nothing;

-- Categorías + podio por edición. `on conflict` solo actualiza los 3
-- campos manuales: para liga-invierno-2026 (categorías ya existentes,
-- con fixture real) no toca teams_count/phase_format/etc.
insert into public.categories
  (tournament_id, name, slug, phase_format, regular_phase_type, teams_count,
   quarterfinals_enabled, sort_order,
   manual_champion_name, manual_runner_up_name, manual_third_place_name)
values
  -- Liga de Invierno 2025
  ((select id from public.tournaments where slug = 'liga-invierno-2025'),
   'Damas A', 'damas-a', 'round_robin', 'home_away', 6, false, 0,
   'Pinamar', 'El Rejunte', 'Segundo Set'),
  ((select id from public.tournaments where slug = 'liga-invierno-2025'),
   'Damas B', 'damas-b', 'round_robin', 'home_away', 6, false, 1,
   'Ducilo A', 'Gin Tonic', 'Dream Team'),
  ((select id from public.tournaments where slug = 'liga-invierno-2025'),
   'Caballeros A', 'caballeros-a', 'round_robin', 'home_away', 6, false, 2,
   'Parque Tenis', 'Los Mismos de Siempre', 'Hay Equipo'),
  ((select id from public.tournaments where slug = 'liga-invierno-2025'),
   'Caballeros B', 'caballeros-b', 'round_robin', 'home_away', 6, false, 3,
   'Fincas de Iraola 2', 'Lo Ganamos en el Súper', 'Cuerda Floja'),
  ((select id from public.tournaments where slug = 'liga-invierno-2025'),
   'Mixto', 'mixto', 'round_robin', 'home_away', 6, false, 4,
   'Cande&co', 'El Reencuentro', 'Mezcladito'),

  -- Liga de Verano 2025/2026
  ((select id from public.tournaments where slug = 'liga-verano-2025-2026'),
   'Damas A', 'damas-a', 'round_robin', 'home_away', 6, false, 0,
   'Ese no es el pique', 'Say no more', 'Fifteen love'),
  ((select id from public.tournaments where slug = 'liga-verano-2025-2026'),
   'Damas B', 'damas-b', 'round_robin', 'home_away', 6, false, 1,
   'Juan Carlas', 'Dream Team', 'La Red de amigas'),
  ((select id from public.tournaments where slug = 'liga-verano-2025-2026'),
   'Caballeros A', 'caballeros-a', 'round_robin', 'home_away', 6, false, 2,
   'Parque tenis', 'Extraordinario equipo', 'Los arizu'),
  ((select id from public.tournaments where slug = 'liga-verano-2025-2026'),
   'Caballeros B', 'caballeros-b', 'round_robin', 'home_away', 6, false, 3,
   'Finito tenis', 'Mostrame el pique', 'Team goat'),
  ((select id from public.tournaments where slug = 'liga-verano-2025-2026'),
   'Mixto A', 'mixto-a', 'round_robin', 'home_away', 6, false, 4,
   'After set', 'Parque mixto', 'C toma team'),
  ((select id from public.tournaments where slug = 'liga-verano-2025-2026'),
   'Mixto B', 'mixto-b', 'round_robin', 'home_away', 6, false, 5,
   'Doble falta', 'C toma team', 'Saque y red'),

  -- Liga de Verano 2024/2025 (posiciones 4tas de cada categoría no se
  -- cargan: la vista pública ahora solo muestra podio de 3 puestos)
  ((select id from public.tournaments where slug = 'liga-verano-2024-2025'),
   'Damas A', 'damas-a', 'round_robin', 'home_away', 6, false, 0,
   'Parque Tenis 2', 'Doble Falta', 'Las Mágicas'),
  ((select id from public.tournaments where slug = 'liga-verano-2024-2025'),
   'Damas B', 'damas-b', 'round_robin', 'home_away', 6, false, 1,
   'Gin Tonic Verano', 'Dream Team', 'Golden Girls'),
  ((select id from public.tournaments where slug = 'liga-verano-2024-2025'),
   'Caballeros A', 'caballeros-a', 'round_robin', 'home_away', 6, false, 2,
   'El Equipo de Miguel', 'Los Picantes', 'Los Desconocidos'),
  ((select id from public.tournaments where slug = 'liga-verano-2024-2025'),
   'Caballeros B', 'caballeros-b', 'round_robin', 'home_away', 6, false, 3,
   'Fincas 2', 'Los Muchachos', 'Fecha Libre'),

  -- Liga de Invierno 2026 — categorías ya existentes (fixture real
  -- cargado durante la temporada). Solo se completa el podio manual
  -- como respaldo: si hay series "final"/"third_place" digitalizadas,
  -- esas tienen prioridad (ver getPodiumForCategory).
  ((select id from public.tournaments where slug = 'liga-invierno-2026'),
   'Damas A', 'damas-a', 'round_robin', 'home_away', 6, false, 0,
   'Ese no es el pique', 'Las Juan Carlas', 'Red de amigas'),
  ((select id from public.tournaments where slug = 'liga-invierno-2026'),
   'Damas B', 'damas-b', 'round_robin', 'home_away', 6, false, 1,
   'Bandada de Invierno', 'Dream Team', 'La Escondida'),
  ((select id from public.tournaments where slug = 'liga-invierno-2026'),
   'Caballeros A', 'caballeros-a', 'round_robin', 'home_away', 5, false, 2,
   'Los Arizu', 'Parque Tenis', 'Tincho Mostrame el pique'),
  ((select id from public.tournaments where slug = 'liga-invierno-2026'),
   'Caballeros B', 'caballeros-b', 'round_robin', 'home_away', 6, false, 3,
   'Mostrame el pique', 'Team Goat', 'Ferretería Belloni'),
  ((select id from public.tournaments where slug = 'liga-invierno-2026'),
   'Mixto A', 'mixto-a', 'round_robin', 'home_away', 6, false, 4,
   'Doble falta', 'Parque Mixto', 'Mezcladito'),
  ((select id from public.tournaments where slug = 'liga-invierno-2026'),
   'Mixto B', 'mixto-b', 'round_robin', 'home_away', 5, false, 5,
   'Saque y red', 'Toma2team', 'Mistura sur')

on conflict (tournament_id, slug) do update set
  manual_champion_name = excluded.manual_champion_name,
  manual_runner_up_name = excluded.manual_runner_up_name,
  manual_third_place_name = excluded.manual_third_place_name;

-- Liga de Invierno 2026 ya jugó todas sus finales (podio confirmado
-- por el organizador) — se cierra la edición.
update public.tournaments
  set status = 'finished'
  where slug = 'liga-invierno-2026';
