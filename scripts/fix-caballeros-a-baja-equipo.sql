-- Baja de "Los de siempre" en Caballeros A
-- Cada fecha reemplaza a Los de siempre por el equipo designado.
-- Ejecutar en Supabase SQL Editor.

DO $$
DECLARE
  cat_id          uuid;
  lds_id          uuid;
  desconocidos_id uuid;
  tincho_id       uuid;
  finito_id       uuid;
  parque_id       uuid;
  arizu_id        uuid;
BEGIN
  SELECT id INTO cat_id FROM categories WHERE slug = 'caballeros-a';

  SELECT id INTO lds_id          FROM teams WHERE category_id = cat_id AND name ILIKE '%siempre%';
  SELECT id INTO desconocidos_id FROM teams WHERE category_id = cat_id AND name ILIKE '%desconocidos%';
  SELECT id INTO tincho_id       FROM teams WHERE category_id = cat_id AND name ILIKE '%tincho%';
  SELECT id INTO finito_id       FROM teams WHERE category_id = cat_id AND name ILIKE '%finito%';
  SELECT id INTO parque_id       FROM teams WHERE category_id = cat_id AND name ILIKE '%parque%';
  SELECT id INTO arizu_id        FROM teams WHERE category_id = cat_id AND name ILIKE '%arizu%';

  -- Fecha 1: Finito vs Los de siempre  →  Finito vs Desconocidos
  UPDATE series SET away_team_id = desconocidos_id
  WHERE away_team_id = lds_id
    AND round_id IN (SELECT id FROM rounds WHERE category_id = cat_id AND round_number = 1);

  -- Fecha 2: Desconocidos vs Los de siempre  →  Desconocidos vs Tincho
  UPDATE series SET away_team_id = tincho_id
  WHERE away_team_id = lds_id
    AND round_id IN (SELECT id FROM rounds WHERE category_id = cat_id AND round_number = 2);

  -- Fecha 3: Los de siempre vs Arizu  →  Finito vs Arizu
  UPDATE series SET home_team_id = finito_id
  WHERE home_team_id = lds_id
    AND round_id IN (SELECT id FROM rounds WHERE category_id = cat_id AND round_number = 3);

  -- Fecha 4: Tincho vs Los de siempre  →  Tincho vs Parque
  UPDATE series SET away_team_id = parque_id
  WHERE away_team_id = lds_id
    AND round_id IN (SELECT id FROM rounds WHERE category_id = cat_id AND round_number = 4);

  -- Fecha 5: Parque vs Los de siempre  →  Parque vs Arizu
  UPDATE series SET away_team_id = arizu_id
  WHERE away_team_id = lds_id
    AND round_id IN (SELECT id FROM rounds WHERE category_id = cat_id AND round_number = 5);

  -- Desactivar Los de siempre
  UPDATE teams SET active = false WHERE id = lds_id;

  -- Actualizar teams_count a 5
  UPDATE categories SET teams_count = 5 WHERE id = cat_id;

  -- Limpiar standings si hubiera alguno de Los de siempre
  DELETE FROM standings_snapshot WHERE team_id = lds_id;

  RAISE NOTICE 'Listo: 5 series actualizadas, equipo desactivado, teams_count = 5';
END $$;
