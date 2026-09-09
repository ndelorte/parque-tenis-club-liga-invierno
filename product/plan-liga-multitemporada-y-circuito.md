# Plan de implementación granular — Liga Multi-Temporada & Circuito del Parque

> Documento de planificación. **No incluye ni autoriza cambios de código por sí mismo.**
> Convierte el documento de sesión del 2026-09-04 en un plan ejecutable por otro agente,
> corrigiendo cada supuesto contra el código real (auditoría del 2026-09-06, post-`git pull`
> del commit `ba18d7b`).
>
> Alcance: (A) Liga de Invierno → **selector multi-temporada** (Invierno/Verano, pasada/activa/próxima)
> con cuadro de campeones y fotos; (B) Mid Master → **Circuito del Parque** (torneos mensuales con
> eliminación + repechaje, ranking anual, Final Master, e import de Challonge 2026+).

---

## 0. Cómo usar este plan (leer antes de tocar nada)

1. **Reglas deportivas: nunca inferir.** Todo lo marcado `⛔ GATE OQ-xx` está bloqueado hasta que
   el organizador/coordinadora responda esa pregunta abierta (sección 7). El agente **no** debe
   elegir un valor por su cuenta: si falta, se agrega/actualiza en `/product/open-questions.md`.
2. **Orden canónico de lectura del proyecto** (según `CLAUDE.md` y `context-index.md`):
   `PRD → reglas-liga-invierno.md / reglas-mid-master.md → modelo-datos.md → adr/ → código actual`.
   Si un doc contradice el código actual, **gana el código**; señalarlo, no "arreglar" el código
   para que el doc viejo tenga razón.
3. **Sprints atómicos.** Cada sprint de abajo termina con lint + build + tests verdes (checklist de
   `CLAUDE.md`). No abrir el siguiente hasta cerrar el anterior.
4. **Aislamiento de módulos (ADR-002).** Liga (`lib/tournament/`, `lib/data/`) y Circuito
   (`lib/circuito/`, `lib/data/circuito/`) son mundos separados. La única lógica compartible es
   `parseScore` (función pura). No compartir queries ni reglas.
5. **La tabla/ranking se calcula, no se edita.** `standings_snapshot` y el nuevo
   `circuito_ranking_points` sólo se escriben desde su función de recálculo. Hay tests de invariante
   que lo verifican mecánicamente (sección 6.3).
6. **Motor de torneos = spec-driven (estrategia elegida).** Las reglas del circuito mensual (armado
   según cantidad de inscriptos, byes, repechaje, seeding, puntos) NO se hardcodean ni se infieren:
   se expresan como una `CircuitoFormatSpec` declarativa (§4.5) cuyos valores releva C0 con el
   organizador (cuestionario del §10). El código genérico se construye ya; los valores llegan como datos.

### Convenciones de este documento
- `crear` = archivo nuevo. `modificar` = archivo existente (se da path real y, si ayuda, línea).
- `DDL` = cambio de esquema en Supabase (migración SQL). Todo cambio de esquema debe además
  reflejarse en `lib/supabase/types.ts` (ver §1.4) y documentarse en `modelo-datos.md`.
- `DoD` = Definition of Done del sprint.

---

## 1. Auditoría del código real (verdad al 2026-09-06)

Esta sección reemplaza los supuestos del documento original por lo que **realmente** hay en el repo.
Está verificada leyendo los archivos citados.

### 1.1 Lo que el documento original acertó
| Afirmación | Verificado en |
|---|---|
| `tournaments` ya tiene `slug`, `season`, `status` | `lib/supabase/types.ts:6-42`, `modelo-datos.md:23` |
| `getActiveTournament()` asume una sola activa global | `lib/data/tournaments.ts:7` (`.eq("status","active").order("season",desc).limit(1).single()`) |
| `status` es sólo `active`/`finished` (falta `upcoming`) | `lib/tournament/types.ts:40`, `lib/supabase/types.ts:12` |
| `lib/mid-master/` existe y modela zonas→semis→final | `lib/mid-master/types.ts`, `lib/data/mid-master/index.ts` |
| El data layer de Mid Master asume **una sola edición** (sin filtro por edición/torneo) | `lib/data/mid-master/index.ts:48` (`getMmCategories` no filtra por edición) |
| `generateProvisionalBracket` resuelve sólo 5/6 equipos | `lib/playoffs/generateProvisionalBracket.ts:71-82` |
| Existen ADRs, `context-index.md` y test de invariante de standings | commit `ba18d7b` (ya pulleado) |
| `public/images/logoligaverano.png` existe | verificado |
| No hay librería de animación instalada | `package.json` (usar CSS puro para el reloj de arena) |

### 1.2 Correcciones al documento original (supuestos falsos o imprecisos)

1. **Prefijo real de Mid Master: `mid_master_`, NO `mm_`.**
   `reglas-mid-master.md:125` y `ADR-002` dicen "prefijo `mm_`", pero el código consulta
   `mid_master_categories`, `mid_master_groups`, `mid_master_participants`, `mid_master_matches`
   (`lib/data/mid-master/index.ts:50,62,69,79,89`). **El plan usa los nombres reales.** Tarea menor:
   corregir `ADR-002` y `reglas-mid-master.md` para que digan `mid_master_` (§6.1).

2. **Las tablas `mid_master_*` NO están tipadas.**
   No aparecen en `lib/supabase/types.ts`. El data layer usa `any` a propósito
   (`lib/data/mid-master/index.ts:23-30`, `AnyRow = Record<string, any>` + `supabase(): Promise<any>`).
   Esto es **deuda técnica que NO hay que replicar** en Circuito: las tablas nuevas `circuito_*` se
   tipan en `lib/supabase/types.ts` (ver ADR-005, §4.2).

3. **`categories.slug` es único GLOBAL y se resuelve sin scope de torneo.**
   `getCategoryBySlug(slug)` hace `.eq("slug", slug).single()` (`lib/data/categories.ts:59`). Con
   multi-temporada, `caballeros-a` existirá en 2025 **y** en 2026 → `.single()` lanza error por 2 filas.
   **Bloqueante de la Feature A.** Solución en Sprint L1 (§3.1): resolver categoría por
   `(tournament_id, slug)` y cambiar la constraint UNIQUE a compuesta.

4. **"Generalizar `generateProvisionalBracket` a N participantes" cruza el aislamiento (ADR-002).**
   Ese archivo vive en `lib/playoffs/`, está tipado a `StandingsRow`/`Team` de `lib/tournament/types`
   y es de **Liga**. El cuadro del circuito mensual (3–35, con byes y repechaje) debe vivir en un
   **motor propio** `lib/circuito/generateBracket.ts`, sin depender de tipos de Liga (§4.5).

5. **El tipo `MmEdition` ya existe pero no se usa.**
   `lib/mid-master/types.ts:75-81` define `MmEdition { id, name, year, status: "upcoming"|"active"|"finished", categories }`.
   Es el punto de partida para la generalización multi-edición (Sprint C2), pero **hoy ningún query lo usa**.

6. **No existe `getAllTournaments()`.**
   `lib/data/tournaments.ts` sólo expone `getActiveTournament()` y `getTournamentBySlug()`. El selector
   de temporadas necesita una función nueva que liste todas (§3.2).

### 1.3 Mapa de lo que se toca (referencia rápida)

**Liga (Feature A):**
- Rutas: `app/liga-invierno/page.tsx` (usa `getActiveTournament`, línea 33), `app/liga-invierno/categorias/[slug]/page.tsx` (línea 39), `app/liga-invierno/equipos/[catSlug]/[teamSlug]/page.tsx`, `app/liga-invierno/equipo/[slug]/page.tsx` (ruta vieja, slug global — ver §3.7), `app/liga-invierno/reglamento/page.tsx`, `app/liga-invierno/layout.tsx`.
- Data: `lib/data/tournaments.ts`, `categories.ts`, `teams.ts`, `standings.ts`, `series.ts`, `playoffs.ts`.
- Lógica: `lib/playoffs/generateProvisionalBracket.ts` (reuso tal cual para el bracket de campeones).

**Circuito (Feature B):**
- Mid Master actual: `app/mid-master/*`, `app/panel-master/*`, `components/mid-master/*`, `components/admin/mid-master/*`, `lib/mid-master/*`, `lib/data/mid-master/*`, tablas `mid_master_*`.
- Home: `app/page.tsx:5,19` (importa y renderiza `MidMasterPromo`), `components/mid-master/MidMasterPromo.tsx`.

**Auth / paneles:**
- `proxy.ts` (matcher líneas 56-63; lógica `isMasterPanel`/`isLoginPage` líneas 34-51), `lib/auth/admin.ts` (`isAdminUser`, sin roles por sección).

### 1.4 Regla operativa sobre `lib/supabase/types.ts`
El archivo es **tipado manual** (no generado por CLI en el repo). Cada tabla nueva o columna nueva
debe agregarse a mano en `Row`/`Insert`/`Update`. Cambiar un union type (ej. `status`) implica
editarlo en las 3 posiciones (`Row`, `Insert`, `Update`) además de `lib/tournament/types.ts`.

---

## 2. Decisiones confirmadas (de la sesión) que este plan asume

| Tema | Decisión | Efecto en el plan |
|---|---|---|
| Mid Master vs Final Master | Dos ediciones del **mismo formato** "torneo especial" | Sprint C2 generaliza `lib/mid-master` a multi-edición |
| Datos Liga 2025 | El usuario los provee | Sprint L6, camino A o B según formato (⛔ GATE OQ-35) |
| Alcance ranking circuito | Sólo 2026+ | Import Challonge acotado (~9-12 ediciones), Sprint C7 |
| Rename paneles | `/panel-parque`→`/panel-liga`, `/panel-master`→`/panel-circuito` | Sprint C1 + ADR-003 |
| Roles admin | Sin definir → **no** introducir roles nuevos aún | `isAdminUser` sigue compartido (⛔ GATE OQ-24) |

---

## 3. FEATURE A — Liga Multi-Temporada

Objetivo: `/liga-invierno` deja de mostrar "la temporada activa" y pasa a ser un **selector** de
ediciones (Invierno/Verano; pasadas, activa, próximas), cada una con su vista según estado.

### 3.0 Estados de una edición
| `status` | Vista pública | Admin |
|---|---|---|
| `active` | Completa (tabla + fixture + playoffs provisorios) — como hoy | Carga/edición habilitada |
| `finished` | **Cerrada**: tabla final + cuadro de playoffs + campeón + fotos. **Sin fixture fecha por fecha** (⛔ GATE OQ-19 confirma si se muestra tabla) | Carga/edición **deshabilitada**; sólo fotos y "reabrir" |
| `upcoming` | **Próximamente**: logo + reloj de arena, sin datos | No aplica (sin categorías/equipos aún) |

### 3.1 Sprint L1 — Modelo, `upcoming` y resolución por temporada

**Objetivo:** habilitar multi-temporada a nivel datos + resolver el bug de slug global.

**DDL:**
1. Agregar valor `upcoming` a `tournaments.status`. Si `status` es `text` con CHECK, actualizar el CHECK:
   `ALTER TABLE tournaments DROP CONSTRAINT ...; ADD CONSTRAINT tournaments_status_check CHECK (status IN ('active','finished','upcoming'));`
   (Verificar en Supabase si es CHECK o enum nativo; el tipo TS es un union manual, no enum.)
2. Cambiar unicidad de `categories.slug`: de UNIQUE global a **UNIQUE compuesto** `(tournament_id, slug)`.
   `ALTER TABLE categories DROP CONSTRAINT categories_slug_key; ADD CONSTRAINT categories_tournament_slug_key UNIQUE (tournament_id, slug);`
3. (Opcional, recomendado) Mismo criterio para `teams.slug`: UNIQUE `(category_id, slug)`.

**Seed de las 4 ediciones** (⛔ GATE OQ-17 define el `status` de `liga-invierno-2026`):
| slug | name | season | status |
|---|---|---|---|
| `liga-invierno-2025` | Liga de Invierno | 2025 | `finished` |
| `liga-verano-2025-2026` | Liga de Verano | 2025 | `finished` |
| `liga-invierno-2026` | Liga de Invierno | 2026 | `active` o `finished` (⛔ OQ-17) |
| `liga-verano-2026-2027` | Liga de Verano | 2026 | `upcoming` |

**Modificar:**
- `lib/tournament/types.ts:40` — `status: "active" | "finished" | "upcoming"`.
- `lib/supabase/types.ts:12,24,36` — mismo union en `Row`/`Insert`/`Update`.
- `lib/data/tournaments.ts` — **crear** `getAllTournaments()` (orden: `season` desc, y dentro por
  fecha de creación o un `sort`; `active` primero — decidir orden estable). **Crear**
  `getCategoryBySlugForTournament(tournamentId, slug)` en `lib/data/categories.ts` (query
  `.eq("tournament_id", tournamentId).eq("slug", slug).single()`).
- `lib/data/categories.ts` — marcar `getCategoryBySlug` como **deprecado** (dejarlo temporalmente para
  no romper build; migrar sus usos en L2).

**Tests (Vitest):**
- `getAllTournaments` ordena correctamente (activa primero, luego por season desc).
- `getCategoryBySlugForTournament` devuelve la categoría correcta cuando el mismo slug existe en 2 torneos (test con mock/fixture de 2 torneos).

**DoD:** las 4 filas existen; el mismo slug de categoría puede convivir en 2 torneos sin romper queries; build + tests verdes.

### 3.2 Sprint L2 — Selector + ruteo por slug de temporada

**Objetivo:** `/liga-invierno` = selector; el resto de rutas resuelven contra la temporada de la URL.

**Rutas nuevas (App Router):**
| Ruta | Reemplaza / hace | Fuente de datos |
|---|---|---|
| `/liga-invierno` | Selector de ediciones (cards/tabs, activa destacada) | `getAllTournaments()` |
| `/liga-invierno/[season]` | Vista de edición según `status` | `getTournamentBySlug(season)` |
| `/liga-invierno/[season]/categorias/[slug]` | Detalle de categoría en esa edición | `getCategoryBySlugForTournament(tournament.id, slug)` |
| `/liga-invierno/[season]/equipos/[catSlug]/[teamSlug]` | Historial de equipo en esa edición | idem + `getTeamBySlugAndCategory` |

**Crear:**
- `app/liga-invierno/page.tsx` → **reescribir** como selector (hoy usa `getActiveTournament`, línea 33). Renderiza grid de ediciones con `<SeasonCard>`.
- `app/liga-invierno/[season]/page.tsx` — resuelve `getTournamentBySlug`; si `notFound` → 404;
  branch por `status`: `active`→vista completa (mover acá el contenido actual de `page.tsx`),
  `finished`→`<ClosedSeasonView>`, `upcoming`→`<ComingSoonView>` (Sprint L5).
- `app/liga-invierno/[season]/categorias/[slug]/page.tsx` — copia adaptada del actual
  `categorias/[slug]/page.tsx`, reemplazando `getActiveTournament()` (línea 39) +
  `getCategoryBySlug` (línea 35) por resolución `(season → tournament.id → categoría por slug)`.
- `app/liga-invierno/[season]/equipos/[catSlug]/[teamSlug]/page.tsx` — idem sobre el actual equipos route.
- `components/liga/SeasonSelector.tsx` + `SeasonCard.tsx` — UI del selector.

**Modificar:**
- **Todos los links internos** que hoy apuntan a `/liga-invierno/categorias/...` y `/liga-invierno/equipos/...` deben incluir `[season]`. Buscar con Grep: `href=".*liga-invierno/` en `components/liga/*` (ej. `CategoryTabs.tsx`, `TeamCard.tsx`, `liga-board.tsx`) y en `components/winter-league.tsx` (home).
- `components/liga/CategoryTabs.tsx` y `TeamCard.tsx` reciben ahora `seasonSlug` como prop para construir hrefs.

**Redirects de compatibilidad** (evitar romper URLs viejas ya compartidas):
- `/liga-invierno/categorias/[slug]` y `/liga-invierno/equipos/...` → redirect a la **edición activa**
  (301). Implementar con `redirect()` en un `page.tsx` en la ruta vieja, o en `next.config`/`proxy.ts`.

**Tests:** ruteo resuelve categoría correcta para cada temporada; link building incluye season.

**DoD:** navegación completa por temporada funciona; URLs viejas redirigen; build + tests verdes.

### 3.3 Sprint L3 — Vista de edición cerrada (`finished`)

**Objetivo:** mostrar el resultado histórico sin el fixture completo.

⛔ **GATE OQ-19** (¿tabla final + cuadro + campeón, o sólo cuadro + campeón?) y ⛔ **GATE OQ-20**
(¿cierre por torneo o por categoría?). Propuesta del documento: mantener la tabla, ocultar sólo el
listado de partidos. **No implementar hasta confirmar.**

**Crear:**
- `components/liga/ClosedSeasonView.tsx` — por categoría: `<StandingsTable>` (reuso) + `<PlayoffBracket>` (reuso) + `<ChampionBanner>`; **sin** `<FixtureList>`.
- `components/liga/ChampionBanner.tsx` — destaca al campeón.
- `lib/data/playoffs.ts` — **crear** `getChampionForCategory(categoryId)`: lee la serie con
  `round.phase = "final"`, devuelve `winner_team_id` → equipo. (El campeón se **deriva**, no se
  guarda como campo nuevo; consistente con la regla "no duplicar dato calculado".)

**Modificar:**
- `app/liga-invierno/[season]/page.tsx` — branch `finished` usa `ClosedSeasonView`.
- Admin (§3.4/L4): al ser `finished`, ocultar edición de resultados.

**Tests:** `getChampionForCategory` con final jugada / sin jugar; vista cerrada no renderiza fixture.

**DoD:** una edición `finished` muestra tabla + cuadro + campeón; build + tests verdes.

### 3.4 Sprint L4 — Cierre de temporada (admin)

⛔ **GATE OQ-20** (nivel de cierre: `tournaments.status` vs por-categoría).

**Objetivo:** botón admin "Cerrar temporada", habilitado cuando la final tiene resultado.

**Crear (server action):**
- `closeTournament(tournamentId)` — valida que **cada** categoría tenga su serie `final` con
  `status="completed"` (o WO), y setea `tournaments.status = "finished"`. Server-only, admin client.
- Botón en el dashboard admin (ruta según rename: `/panel-liga` — ver Sprint C1).

**Reglas:**
- Si OQ-20 = "por categoría", el `status` de cierre vive a nivel `categories` (agregar columna
  `categories.status`), no en `tournaments`. **No implementar la variante hasta confirmar OQ-20.**

**Tests:** cerrar falla si falta una final; cerrar OK marca `finished`.

**DoD:** flujo de cierre operativo con validación; build + tests verdes.

### 3.5 Sprint L5 — Vista "Próximamente" (`upcoming`)

**Objetivo:** placeholder para Liga de Verano 2026/2027.

**Crear:**
- `components/liga/ComingSoonView.tsx` — logo `public/images/logoligaverano.png`, texto
  "Próximamente", **reloj de arena en CSS puro** (`@keyframes` + `animation`), respetando
  `@media (prefers-reduced-motion: reduce)` (sin librería nueva).

⛔ **GATE OQ-21** (¿deja elegir categoría o es pantalla única?). Propuesta: pantalla única. Implementar la
variante simple; sólo ampliar si se confirma lo contrario.

**DoD:** `upcoming` muestra el placeholder animado; sin errores de hidratación; build verde.

### 3.6 Sprint L6 — Fotos de premiación

**Objetivo:** galería pública de fotos por edición/categoría.

**Infra Supabase Storage:** bucket `premiaciones`, **público de sólo lectura** (fotos promocionales,
no dato sensible — no choca con "no exponer datos sensibles" de `CLAUDE.md`, que aplica a teléfonos/contacto).

**DDL:** tabla `tournament_photos`:
```
id uuid PK
tournament_id uuid FK -> tournaments (NOT NULL)
category_id   uuid FK -> categories (NULLABLE = foto general de la edición)
storage_path  text NOT NULL
caption       text NULLABLE
sort_order    int  DEFAULT 0
created_at    timestamptz DEFAULT now()
```
Reflejar en `lib/supabase/types.ts` y `modelo-datos.md`.

**Crear:**
- `lib/data/tournament-photos.ts` — `getPhotos(tournamentId, categoryId?)`, `addPhoto(...)`,
  `deletePhoto(id)`, `reorderPhotos(...)`. Upload al bucket con admin client.
- `components/liga/PhotoGallery.tsx` — grid responsive, debajo del `ChampionBanner`.
- Admin: pantalla de carga (selector temporada + categoría → subir 1..N).

**Modificar:** `ClosedSeasonView` incluye `<PhotoGallery>`.

**DoD:** subir/borrar/ordenar fotos desde admin; galería pública visible; build verde.

### 3.7 Sprint L7 — Carga histórica 2025

⛔ **GATE OQ-35** (formato de las planillas). Define el camino:
- **Camino A (reconstrucción completa):** hay resultados partido a partido → cargar como fixture +
  resultados vía el patrón de `scripts/import-fixture.ts` (+ `scripts/lib/db.ts`), marcar `finished`.
  Permite tabla + cuadro reales.
- **Camino B (sólo campeón):** sólo se sabe el campeón por categoría → agregar columna liviana
  `categories.manual_champion_team_name text NULLABLE`; `getChampionForCategory` la usa como fallback
  cuando no hay serie `final` cargada. La vista muestra el campeón sin cuadro.

**DoD:** las 2 ediciones 2025 visibles como `finished` con el nivel de dato disponible; build verde.

### 3.8 Nota sobre la ruta vieja `equipo/[slug]`
`app/liga-invierno/equipo/[slug]/page.tsx` usa `getTeamBySlug` (global, `teams.ts:75`,
`.limit(1).maybeSingle()`), que con multi-temporada elegiría un equipo arbitrario. Opciones:
(a) redirigir 301 a la ruta `equipos/[catSlug]/[teamSlug]` de la edición activa; (b) eliminarla si ya no
se enlaza. Verificar enlaces con Grep antes de borrar.

---

## 4. FEATURE B — Circuito del Parque (ex Mid Master)

Sección madre con tres partes: (a) **torneos mensuales** (formato nuevo), (b) **torneos especiales**
Mid Master / Final Master (generalización de lo existente), (c) **ranking anual**.

### 4.0 Sprint C0 — Reglas del circuito ⛔ BLOQUEANTE REAL

**El único bloqueante duro de toda la Feature B.** No depende de código.

**Objetivo:** crear `/product/reglas-circuito-del-parque.md` (canónico, mismo patrón que
`reglas-liga-invierno.md` / `reglas-mid-master.md`) respondiendo con el organizador:
- ⛔ OQ-23 lista definitiva de categorías 2026 (y `draw_size`/tipo por categoría).
- ⛔ OQ-26 seeding (ranking vigente / aleatorio / manual).
- ⛔ OQ-27 reparto de byes cuando N no es potencia de 2 (rango real visto: 3–35).
- ⛔ OQ-28 quiénes entran al repechaje y con qué formato.
- ⛔ OQ-29 formato de partido (¿mejor de 3, tercer set 7-6 fijo como Liga/Mid Master?).
- ⛔ OQ-30 ¿hay walkover en el circuito mensual?
- ⛔ OQ-31 puntos por ganar el repechaje.
- ⛔ OQ-22 ¿Mid Master conserva nombre? ¿sus resultados puntúan al ranking anual?
- ⛔ OQ-32/33 ranking: ¿suma todo o mejores N? ¿mínimo de torneos?
- ⛔ OQ-34 cupos por categoría a Final Master.

**Salida concreta:** además del `.md`, C0 produce una **`CircuitoFormatSpec` por categoría** (tipo en
§4.5, relevada con el cuestionario del §10). Ahí se captura explícitamente **cómo cambia el armado según
la cantidad de inscriptos** (rangos de N → formato + byes) — precisamente el requerimiento que el
documento original no detallaba.

**DoD:** el `.md` existe y responde OQ-22..OQ-34; hay una `CircuitoFormatSpec` (o tabla equivalente) por
categoría; se actualiza `context-index.md` (fila "Circuito del Parque"). **Ningún sprint C3+ empieza sin esto.**

### 4.1 Sprint C1 — Rename de secciones y paneles (+ ADR-003)

**Objetivo:** `Mid Master` → `Circuito del Parque` en navegación; renombrar paneles.

**Renames de rutas (mover carpetas):**
- `app/panel-parque/` → `app/panel-liga/` (y todas las subrutas de Liga).
- `app/panel-master/` → `app/panel-circuito/`.
- Público: `app/mid-master/` pasa a `app/circuito-del-parque/especiales/[edition]/` (ver §4.3/C2).

**Modificar `proxy.ts` (crítico):**
- `matcher` (líneas 56-63): `/panel-parque` → `/panel-liga`, `/panel-master` → `/panel-circuito`.
- Lógica `isMasterPanel`/`isLoginPage` (líneas 34-51): actualizar los prefijos hardcodeados y los
  destinos de redirect de login (`/panel-*/login` ↔ `/panel-*`).
- Renombrar variable `isMasterPanel` → `isCircuitoPanel` por claridad.

**Modificar:**
- `app/page.tsx:5,19` + `components/mid-master/MidMasterPromo.tsx` → renombrar a
  `components/circuito/CircuitoPromo.tsx` y su título/copy. (⛔ OQ-22 puede afectar el nombre visible.)
- Navbar/links a `/mid-master`.
- `CLAUDE.md` (tabla de rutas admin) — reemplazar `/panel-parque` y `/panel-master`.

**Redirects 301** de rutas viejas: `/panel-parque/*`→`/panel-liga/*`, `/panel-master/*`→`/panel-circuito/*`,
`/mid-master`→`/circuito-del-parque/especiales/mid-master-2026` (definir en `proxy.ts` o `next.config`).

**Crear `product/adr/ADR-003-rename-paneles-liga-circuito.md`** (formato de `adr/README.md`: Status /
Contexto / Decisión / Consecuencias) + agregarlo al índice de `adr/README.md`. Consecuencia clave a
documentar: referencias viejas a `/panel-parque` y `/panel-master` quedan obsoletas; la política de
acceso sigue centralizada en `proxy.ts` (como ADR-001).

⛔ **GATE OQ-24** (roles separados liga/circuito): **NO** introducir roles nuevos. `isAdminUser` sigue
compartido. Registrar en ADR-003 que se decidió postergar la segmentación de roles.

**DoD:** los dos paneles responden en las rutas nuevas, protegidos; login redirige bien; rutas viejas
301; ADR-003 creado e indexado; build verde.

### 4.2 Sprint C1.5 — Decisión de arquitectura de datos (+ ADR-005)

**Crear `product/adr/ADR-005-prefijo-tablas-circuito.md`.** Decisión recomendada (a confirmar OQ-25):
- **Prefijo nuevo `circuito_`** (no extender `mid_master_`), consistente con el aislamiento de ADR-002.
- **Tipar** las tablas `circuito_*` en `lib/supabase/types.ts` (NO repetir el patrón `any` de
  `mid_master_*`; ver §1.2 punto 2).
- Módulo lógico propio `lib/circuito/` (puro) + data layer `lib/data/circuito/` (tipado).

**DoD:** ADR-005 creado e indexado. Sin código aún.

### 4.3 Sprint C2 — Generalizar Mid Master a "torneo especial" multi-edición (+ ADR-004)

**Objetivo:** que `mid_master_*` soporte varias ediciones (Mid Master 2026, Final Master 2026, …) en
vez de una sola global.

**DDL:**
- Tabla `mid_master_editions` (`id`, `slug`, `name`, `year`, `status` `upcoming|active|finished`, `created_at`).
- Agregar `edition_id uuid FK -> mid_master_editions` a `mid_master_categories`.
- Backfill: crear la edición "Mid Master 2026" y asignar `edition_id` a las categorías existentes.
- Reflejar `mid_master_*` en `lib/supabase/types.ts` **de paso** (salda la deuda del punto 1.2.2) — opcional pero recomendado.

**Modificar `lib/data/mid-master/index.ts`:**
- Todas las queries (`getMmCategories`, `getMmCategoryBySlug`, `buildCategory`, etc.) reciben/filtran
  por `editionId`. `getMmCategories()` → `getMmCategories(editionId)` con `.eq("edition_id", editionId)`.
- Usar el tipo `MmEdition` ya existente (`lib/mid-master/types.ts:75`).

**Rutas públicas:**
- `app/circuito-del-parque/especiales/[edition]/page.tsx` (portal de la edición) y
  `.../[edition]/categorias/[slug]/page.tsx` — adaptación de `app/mid-master/*`.
- Redirect `/mid-master` → `/circuito-del-parque/especiales/mid-master-2026`.

**Crear `product/adr/ADR-004-mid-master-multi-edicion.md`** — decisión: Mid Master pasa de "una edición
implícita" a N ediciones (`edition_id`); Final Master es otra edición del mismo formato. Consecuencia:
no volver a asumir "una sola edición".

**DoD:** Mid Master 2026 se ve bajo la ruta nueva vía `edition_id`; se puede crear una 2ª edición sin
tocar código; build + tests verdes.

### 4.4 Sprint C3 — Modelo de datos del torneo mensual

⛔ **GATE OQ-23, OQ-25.** Requiere C0 cerrado.

**DDL (prefijo `circuito_`, tipado en `lib/supabase/types.ts`):**
```
circuito_editions
  id, slug, name ("Roland Garros"), month int, year int,
  status ('upcoming'|'active'|'finished'), created_at

circuito_categories
  id, edition_id FK, name, slug, type ('single'|'dobles'),
  draw_size int, sort_order, UNIQUE(edition_id, slug)

circuito_participants
  id, category_id FK, player_id FK->players (single),
  player_2_id FK->players NULLABLE (dobles), seed int NULLABLE,
  display_name text  -- para import Challonge sin match de player (ver C7)

circuito_matches
  id, category_id FK, bracket ('main'|'repechaje'), round_number int,
  participant_a_id FK NULLABLE, participant_b_id FK NULLABLE,
  score text NULLABLE, winner_id FK NULLABLE, is_walkover bool DEFAULT false,
  status ('pending'|'scheduled'|'played'|'walkover'), scheduled_date, scheduled_time,
  created_at, updated_at

circuito_ranking_points   -- SNAPSHOT recalculado, nunca editado a mano
  id, player_id FK, category_id FK, edition_id FK, points int, computed_at,
  UNIQUE(player_id, category_id, edition_id)
```
`players` se comparte con Liga y Mid Master (único dato compartido intencional — ADR-002).

**Crear:** `lib/data/circuito/types.ts` (DB row types tipados) + reflejo en `modelo-datos.md`.

**DoD:** tablas creadas + tipadas; datos de prueba insertados; sin UI aún; build verde.

### 4.5 Sprint C4 — Motor de cuadros (seeding + byes + repechaje)

⛔ **GATE OQ-26 (seeding), OQ-27 (byes), OQ-28 (repechaje).** Requiere C0.

**Objetivo:** motor **puro y spec-driven** que arma el cuadro de N (3–35) participantes a partir de una
**especificación declarativa** (`CircuitoFormatSpec`), sin hardcodear ni inferir ninguna regla deportiva.
**No reusar `lib/playoffs/generateProvisionalBracket.ts`** (es de Liga, tipado a `StandingsRow`; ADR-002).

**Idea central:** el *armado variable según cantidad de inscriptos* NO se codea con `if (N === ...)`. Se
expresa como datos en la spec (relevada en C0), y el motor la interpreta. Cambiar una regla = cambiar la
spec, no el código. Esto permite construir el motor y sus tests **ahora** (con specs de ejemplo) aunque
las reglas reales todavía no estén confirmadas.

**Crear `lib/circuito/`:**
- `types.ts`:
  ```ts
  interface CircuitoFormatSpec {
    // ⛔ OQ-27: cómo cambia el armado según N (rangos de inscriptos)
    drawRules: Array<{
      minN: number; maxN: number;
      format: 'single_elim' | 'round_robin' | 'group_then_ko';
      byePolicy: 'top_seeds' | 'random' | 'manual';
    }>;
    seedingSource: 'ranking' | 'random_seeded' | 'manual';       // ⛔ OQ-26
    repechaje: {
      eligibility: 'all_r1_losers' | 'seeded_losers' | 'none';   // ⛔ OQ-28
      structure: 'single_elim' | 'round_robin';
      winnerReentersMain: boolean;                               // ⛔ OQ-28/31
    };
    match: { bestOf: number; thirdSet: '7-6_fixed' | 'real'; walkover: boolean }; // ⛔ OQ-29/30
    pointsTable: Record<string, number>; // champion/finalist/sf/qf/.../repechaje_winner ⛔ OQ-31/32
  }
  ```
  más `CircuitoParticipant`, `CircuitoMatch`, `CircuitoBracket { main, repechaje }`.
- `generateBracket.ts` — `generateBracket(participants, spec)`:
  - elige el `drawRule` cuyo `[minN, maxN]` contiene `participants.length` (define formato + byes);
  - siembra según `spec.seedingSource`; reparte byes según `byePolicy` hasta la potencia de 2;
  - genera el `main`. Determinista (si hay aleatoriedad, con semilla fija para reproducibilidad).
- `generateRepechaje.ts` — arma el repechaje según `spec.repechaje`.
- `advanceWinner.ts` — al cargar un resultado, propaga el ganador a la ronda siguiente.
- `parseScore`: reusar el de `lib/tournament/` **sólo** si `spec.match` confirma formato idéntico; si
  difiere, crear `lib/circuito/parseCircuitoScore.ts`.

**Los valores de la spec los carga C0** (por categoría). El tipo y el motor se escriben ya; las reglas
reales entran como datos, no como código nuevo.

**Tests (Vitest) — obligatorios:**
- Con specs de ejemplo, cuadros de N = 3, 4, 5, 8, 16, 35: elige el `drawRule` correcto, byes correctos, sin cruces inválidos.
- Seeding determinista para cada `seedingSource`.
- Repechaje se arma con el conjunto correcto de perdedores según `spec.repechaje`.
- **Cambiar la spec (no el código) cambia el armado** — verifica que el motor es realmente data-driven.

**DoD:** dado N participantes, el motor produce un cuadro válido + repechaje; tests de los tamaños
límite verdes.

### 4.6 Sprint C5 — Carga de resultados + recálculo de ranking

⛔ **GATE OQ-29, OQ-30, OQ-31, OQ-32, OQ-33.**

**Objetivo:** admin de resultados en `/panel-circuito`, con recálculo automático del ranking.

**Crear `lib/circuito/calculateRankingPoints.ts`** (puro): dado el cuadro resuelto de una categoría,
calcula puntos por participante según la escala definida en C0 (⛔ OQ-31/32/33). Propuesta ATP-Race del
documento (a validar, ningún número decidido): Campeón/Finalista/SF/QF/... + repechaje.

**Crear `lib/data/circuito/ranking.ts`** — **único escritor** de `circuito_ranking_points**:
- `recalculateAndPersistCircuitRanking(editionId, categoryId)` — patrón calcado de
  `recalculateAndPersistStandings` (`lib/data/standings.ts:87`): admin client, lee `circuito_matches`,
  llama a la función pura, hace `upsert` con `onConflict: "player_id,category_id,edition_id"`.
- `getCircuitRanking(categoryId?/año)` para la vista pública.

**Modificar:** la server action que carga/edita un `circuito_matches` dispara
`advanceWinner` + `recalculateAndPersistCircuitRanking`.

**Test de invariante (sección 6.3):** copiar `standings-write-boundary.test.ts` con
`ALLOWED_WRITER = "lib/data/circuito/ranking.ts"` y tabla `circuito_ranking_points`.

**DoD:** cargar un resultado propaga ganador y recalcula ranking; el test de invariante pasa; build verde.

### 4.7 Sprint C6 — Vistas públicas del circuito

**Rutas:**
| Ruta | Contenido |
|---|---|
| `/circuito-del-parque` | Landing: torneos mensuales 2026, acceso a ranking y Final Master |
| `/circuito-del-parque/torneos/[edition]` | Categorías del torneo |
| `/circuito-del-parque/torneos/[edition]/[categoria]` | Cuadro principal + repechaje |
| `/circuito-del-parque/ranking` | Ranking anual, filtrable por categoría |
| `/circuito-del-parque/final-master` | "Próximamente" + clasificados provisorios |
| `/circuito-del-parque/especiales/[edition]` | Mid Master / Final Master (de C2) |

**Crear:** `components/circuito/` (`BracketView`, `RepechajeView`, `RankingTable`, `EditionCard`).
Reusar el patrón visual de `components/mid-master/KnockoutBracket.tsx` como referencia (no importar).

**Final Master:** estado "Próximamente" con el mismo `ComingSoonView` (reloj de arena de L5) +
**clasificados provisorios** = top N (⛔ OQ-34) del ranking vigente, calculado en vivo desde
`getCircuitRanking`. ⛔ OQ-22 define si Mid Master/Final Master puntúan al ranking.

**DoD:** las vistas renderizan con datos reales de C5; ranking filtrable; Final Master muestra top N; build verde.

### 4.8 Sprint C7 — Import histórico Challonge 2026

**Objetivo:** poblar el historial 2026 una sola vez (no llamadas recurrentes; Challonge exige plan
pago sobre 500 req/mes).

**Crear `scripts/import-challonge.ts`** (patrón de `scripts/import-fixture.ts` + `scripts/lib/db.ts`):
1. API key del club (cuenta `elcircuitodelparque`), leída de env (no commitear).
2. Traer torneos 2026 + participantes + partidos (API v1/v2, JSON).
3. **Verificar si viene `scores_csv`** (detalle set por set). Si no está, el ranking importado no puede
   usar Δgames como desempate → decidir desempate alternativo **sólo** para datos importados (⛔ nueva
   OQ si aplica; no inferir).
4. **Reconciliación de nombres**: los nombres de Challonge son texto libre, no FK a `players`. Generar
   una lista de "no matcheados" para revisión manual **antes** de confirmar el import
   (`circuito_participants.display_name` guarda el crudo; `player_id` se completa al reconciliar).
5. Correr una vez; de ahí en más, todo torneo se carga en `/panel-circuito`.

**DoD:** ediciones 2026 cargadas; ranking refleja lo ya jugado; lista de reconciliación resuelta; el
import no corre en cada deploy.

---

## 5. Home y navegación (transversal)

- `app/page.tsx` renderiza `WinterLeague` y `MidMasterPromo` (líneas 4-5, 17-18). Tras Feature A/B:
  - `WinterLeague` → linkea al **selector** `/liga-invierno` (no a la activa directa).
  - `MidMasterPromo` → `CircuitoPromo`, linkea a `/circuito-del-parque`.
- Regla "Admin invisible" (CLAUDE.md): `/panel-liga` y `/panel-circuito` **nunca** en navbar/footer.

---

## 6. Cambios transversales y buenas prácticas

### 6.1 Docs a crear/actualizar
- **Crear:** `reglas-circuito-del-parque.md` (C0), ADR-003 (C1), ADR-005 (C1.5), ADR-004 (C2).
- **Actualizar:** `context-index.md` (filas para Circuito y para distinguir "torneo especial" vs
  "torneo mensual"), `modelo-datos.md` (tablas nuevas), `open-questions.md` (marcar resueltas al
  responderlas), `adr/README.md` (índice), `CLAUDE.md` (rutas admin renombradas).
- **Corregir (deuda):** `ADR-002` y `reglas-mid-master.md` dicen `mm_`; el real es `mid_master_`
  (§1.2.1).
- **Si aplica:** `reglas-liga-verano.md` (⛔ OQ-18: si Liga de Verano tiene reglas propias).

### 6.2 ADRs a registrar (formato `adr/README.md`)
| ADR | Título | Sprint |
|---|---|---|
| ADR-003 | Rename paneles `/panel-liga` + `/panel-circuito` | C1 |
| ADR-004 | Mid Master multi-edición (`edition_id`) | C2 |
| ADR-005 | Prefijo `circuito_` + tablas tipadas | C1.5 |

### 6.3 Tests de invariante
- Ya existe: `lib/data/__tests__/standings-write-boundary.test.ts` (sólo `lib/data/standings.ts`
  escribe `standings_snapshot`).
- **Replicar** para `circuito_ranking_points` → `ALLOWED_WRITER = "lib/data/circuito/ranking.ts"`.

### 6.4 Rollout gradual (Circuito)
No reemplazar Challonge de golpe. Correr el motor de cuadros nuevo **en paralelo** a Challonge un mes,
comparar, y recién migrar la operación real.

---

## 7. Preguntas abiertas (⛔ gates) y qué sprint bloquean

Continúan la numeración de `open-questions.md` (hasta OQ-16). **Ninguna regla deportiva se infiere.**

**Clasificación (estrategia "motor parametrizable + gates"):**
- **Duras — reglas deportivas, relevar sí o sí (alimentan `CircuitoFormatSpec`; nunca inferir):**
  OQ-22, 23, 26, 27, 28, 29, 30, 31, 32, 33, 34 + Challonge `scores_csv`. Bloquean C4/C5/C6.
- **Blandas — UX/producto, el agente avanza con un default razonable y ajusta luego:** OQ-19, 20, 21.
- **Logística/decisión (no deportivas):** OQ-17, 18, 24, 25, 35.

| OQ | Pregunta | Bloquea |
|---|---|---|
| OQ-17 | ¿Liga Invierno 2026 ya terminó? (define `status` inicial) | L1 (seed), L4 |
| OQ-18 | ¿Liga Verano usa mismas categorías/reglas que Invierno? | L1/L2 (reuso), `reglas-liga-verano.md`? |
| OQ-19 | Edición cerrada: ¿tabla+cuadro+campeón o sólo cuadro+campeón? | L3 |
| OQ-20 | ¿Cierre por torneo o por categoría? | L4 (dónde vive `status`) |
| OQ-21 | Vista "próximamente": ¿elige categoría o pantalla única? | L5 |
| OQ-22 | ¿Mid Master conserva nombre? ¿sus resultados puntúan al ranking? | C2, C6 (Final Master) |
| OQ-23 | Lista definitiva de categorías 2026 (+ draw_size/tipo) | C0, C3 |
| OQ-24 | ¿Roles separados liga/circuito o admin compartido? | C1 (no implementar roles) |
| OQ-25 | ¿Prefijo `circuito_` nuevo o extender `mid_master_`? | C1.5/C3 |
| OQ-26 | Seeding: ¿ranking / aleatorio / manual? | C4 |
| OQ-27 | Reparto de byes cuando N no es potencia de 2 | C4 |
| OQ-28 | ¿Quiénes entran al repechaje y con qué formato? | C4 |
| OQ-29 | Formato de partido del circuito mensual | C4/C5 |
| OQ-30 | ¿Hay walkover en el circuito mensual? | C5 |
| OQ-31 | ¿Ganar el repechaje da puntos? ¿qué escala? | C5 |
| OQ-32 | Ranking: ¿suma todo o mejores N? | C5 |
| OQ-33 | ¿Mínimo de torneos para ranking / Final Master? | C5/C6 |
| OQ-34 | ¿Cuántos clasificados por categoría a Final Master? | C6 |
| OQ-35 | Formato de las planillas Liga 2025 | L7 |
| (nueva) | ¿Challonge expone `scores_csv` (detalle por set)? Si no, desempate alternativo para importados | C7 |

---

## 8. Roadmap combinado (menor a mayor riesgo/dependencia)

```
Fase 0  ── C0: reglas del circuito .............. BLOQUEANTE de C3+. No es código. Empezar YA.
Fase 1  ── Feature A (L1→L7) .................... Bajo riesgo, reusa esquema. En paralelo a C0.
Fase 2  ── C1 rename + C1.5 ADR-005 + C2 gen. ... Bajo riesgo, prepara terreno. No depende de C0.
Fase 3  ── C3 modelo + C4 motor ................. Requiere C0 cerrado.
Fase 4  ── C5 resultados+ranking + C6 público ... Requiere C4.
Fase 5  ── C7 import Challonge .................. Al final, una sola corrida, sistema estable.
```

**Dependencias duras:**
- C3, C4, C5, C6 ← **C0** (reglas).
- C5 ← C4 (motor). C6 ← C5 (datos). C7 ← C5/C6 (destino estable).
- Feature A y (C1, C1.5, C2) son independientes entre sí → paralelizables.

---

## 9. Riesgos y notas finales

1. **Slug de categoría global (§1.2.3):** el mayor riesgo de la Feature A. Resolver en L1 **antes** de
   sembrar la 2ª edición con slugs repetidos, o las queries `.single()` romperán en producción.
2. **Cruce de aislamiento (ADR-002):** cualquier PR que importe `lib/tournament/` o `lib/playoffs/`
   desde `lib/circuito/` (o viceversa) es señal de romper el aislamiento — revisar con el usuario.
3. **`lib/supabase/types.ts` es manual:** olvidar reflejar una tabla/columna nueva no rompe el build
   pero deja el data layer sin tipos (o fuerza `any`, como en `mid_master_*`). Reflejar siempre.
4. **Challonge:** límite 500 req/mes y nombres sin FK → import de una sola corrida + reconciliación
   manual. No agendar como job recurrente.
5. **Regla de oro:** ante una regla deportiva faltante, **no inventar** — agregar a `open-questions.md`
   y frenar el sprint afectado.
6. **Rama paralela `feat/interparque` (2026-09-08):** mientras este refactor estaba en curso en
   `feat/circuito-c2-mid-master-multi-edicion`, se pidió sacar a producción una modalidad nueva
   ("Interparque") sin esperar a que termine. Se implementó en una rama aparte, creada desde `main`
   (no desde esta rama de refactor), como módulo aislado — ver
   [ADR-006](./adr/ADR-006-interparque-modulo-aislado.md) y `reglas-interparque.md`. **Al mergear
   ambas ramas a `main`, revisar a mano** `proxy.ts` (matcher + lookup de paneles admin),
   `components/layout/Navbar.tsx` y `components/layout/Footer.tsx` — las dos ramas los tocan de
   forma independiente y es probable que haya conflictos de merge (no de lógica: cada una agrega su
   propia entrada a listas/arrays existentes).

---

## 10. Apéndice — Cuestionario de relevamiento para C0

> Para completar **con el organizador/coordinadora**. Cada respuesta alimenta la `CircuitoFormatSpec`
> del §4.5. Si una respuesta no existe o está indefinida, queda como OQ abierta — **no inventarla**.
> El resultado se vuelca en `reglas-circuito-del-parque.md` (canónico) + una spec por categoría.

**A. Categorías 2026 (OQ-23)**
- Lista definitiva de categorías (nombre + tipo single/dobles).
- ¿El cupo (`draw_size`) es fijo por categoría o varía mes a mes?
- ¿Mínimo de inscriptos para que una categoría se juegue?

**B. Armado según cantidad de inscriptos (OQ-27) — el núcleo**
- Completar, por rango de inscriptos, qué formato se usa y cómo se reparten los byes:

  | Inscriptos | Formato (elim. simple / round-robin / grupos+llave / otro) | ¿Byes? ¿a quién? |
  |---|---|---|
  | 3–4 | | |
  | 5–8 | | |
  | 9–16 | | |
  | 17–32 | | |
  | 33+ | | |

**C. Seeding (OQ-26)**
- ¿Los cabezas de serie salen del ranking vigente, de un sorteo, o los ubica la coordinadora a mano?

**D. Repechaje (OQ-28, OQ-31)**
- ¿Quiénes entran? (todos los perdedores de 1ª ronda / sólo algunos / no hay)
- ¿Qué formato tiene? (eliminación simple entre ellos / otro)
- ¿El ganador vuelve al cuadro principal o sólo suma puntos?
- ¿Cuántos puntos otorga?

**E. Formato de partido (OQ-29, OQ-30)**
- ¿Al mejor de 3 sets? ¿El tercer set se registra `7-6` fijo (como Liga/Mid Master) o con score real?
- ¿Hay walkover en el circuito mensual?

**F. Puntos y ranking (OQ-31, OQ-32, OQ-33)**
- Tabla de puntos por instancia: Campeón / Finalista / SF / QF / Octavos / 1ª ronda jugada / ganador de repechaje.
- ¿El ranking anual suma TODOS los torneos o sólo los mejores N resultados?
- ¿Mínimo de torneos jugados para figurar en el ranking o clasificar a Final Master?

**G. Torneos especiales y Final Master (OQ-22, OQ-34)**
- ¿"Mid Master" conserva ese nombre dentro de Circuito del Parque, o cambia?
- ¿Los resultados de Mid Master / Final Master suman al ranking anual, o son independientes?
- ¿Cuántos clasificados por categoría entran a Final Master?

**H. Import Challonge (C7)**
- ¿La cuenta expone el detalle set por set (`scores_csv`), o sólo el agregado (ej. 2-1)?

---

_Fin del plan. Generado el 2026-09-06 a partir del documento de sesión del 2026-09-04 y una auditoría
del código real del repo (post-`git pull` `ba18d7b`)._

_Refinado: estrategia "motor parametrizable + gates" (motor spec-driven; reglas deportivas relevadas en
C0 vía §10, nunca inferidas)._
