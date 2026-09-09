# ADR-004: Mid Master pasa de una edición implícita a N ediciones (`edition_id`)

Status: Accepted

## Contexto

El data layer de Mid Master (`lib/data/mid-master/index.ts`) asumía una sola
edición global: `getMmCategories()` y `getMmCategoryBySlug(slug)` consultaban
`mid_master_categories` sin ningún filtro de edición, porque hasta ahora solo
existió "Mid Master 2026". El tipo `MmEdition` (`lib/mid-master/types.ts`) ya
estaba definido pero ningún query lo usaba — quedó como intención sin
implementar.

Con Circuito del Parque, "Mid Master" y "Final Master" son dos ediciones del
mismo formato de torneo especial (zonas → semifinales → final), y en el
futuro puede haber más de una edición de Mid Master (año a año). El modelo
de una sola edición implícita ya no alcanza.

## Decisión

- Nueva tabla `mid_master_editions` (`id`, `slug`, `name`, `year`, `status`
  `upcoming|active|finished`). Cada edición existente y futura de Mid Master
  o Final Master es una fila acá.
- `mid_master_categories.edition_id` (FK, `NOT NULL`) — cada categoría
  pertenece a una única edición. `categories.slug` deja de ser único global:
  pasa a ser único por `(edition_id, slug)` (mismo bug que ya se corrigió
  para Liga en Sprint L1 — dos ediciones con categorías de mismo slug, ej.
  "single-caballeros-primera" en Mid Master 2026 y Final Master 2026, ya no
  rompen `.maybeSingle()`).
- Backfill de la migración: se crea la fila `mid-master-2026` (`status:
  'active'`, verificado contra los partidos reales: 105 jugados, 15
  pendientes/programados al momento del backfill) y se le asignan todas las
  categorías existentes.
- Todo el data layer (`getMmCategories`, `getMmCategoryBySlug`,
  `getMmCategoriesForPublic`, `getMmCategoryForPublic`,
  `getMmCategoryAdminData`) recibe `editionId` como primer parámetro.
  Se agregan `getMmEditions()`, `getMmEditionBySlug(slug)` y
  `getMmActiveEdition()` (mismo patrón que `getActiveTournament()` de Liga).
- Rutas públicas nuevas: `/circuito-del-parque/especiales/[edition]` y
  `/circuito-del-parque/especiales/[edition]/categorias/[slug]`
  (adaptación de `app/mid-master/*`, que se elimina). `/mid-master` y
  `/mid-master/categorias/:slug` quedan como redirects 301 (en
  `next.config.ts`) hacia la edición `mid-master-2026`.
- El panel admin (`/panel-circuito`) **no** agrega un selector de edición
  en esta sprint — resuelve `getMmActiveEdition()` y opera siempre sobre
  la edición activa, mismo criterio que usa hoy el panel de Liga con
  `getActiveTournament()`. Si en el futuro hace falta administrar una
  edición no activa (ej. cargar Final Master mientras Mid Master sigue
  activo), hay que agregar ese selector — no asumir que alcanza con
  "la activa".

## Consecuencias

- **No volver a asumir "una sola edición" de Mid Master en ningún código
  nuevo.** Cualquier query a `mid_master_categories` sin `edition_id` es
  un bug — antes de C2 esa ausencia era el comportamiento esperado; a
  partir de ahora es incorrecto.
- Crear una 2ª edición (ej. "Final Master 2026") es una fila nueva en
  `mid_master_editions` + categorías con ese `edition_id` — no requiere
  tocar código de `lib/data/mid-master/` ni de las rutas públicas.
- El campo `edition_id` es la razón por la que `categories.slug` cambió su
  constraint de único global a único compuesto — si se relaja esa
  constraint en el futuro sin querer, dos ediciones con categorías del
  mismo slug van a romper `.maybeSingle()` otra vez.
- Sigue habiendo deuda técnica deliberada: las tablas `mid_master_*` (salvo
  la nueva `mid_master_editions`, que tampoco se tipó) no están reflejadas
  en `lib/supabase/types.ts` — el data layer sigue usando `any` a propósito
  (ver `lib/data/mid-master/index.ts`). Las tablas **nuevas** del circuito
  mensual (`circuito_*`, Sprint C3+) no deben repetir este patrón — ver
  [ADR-005](./ADR-005-prefijo-tablas-circuito.md).
