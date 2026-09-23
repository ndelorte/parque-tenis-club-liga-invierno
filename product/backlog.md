# Backlog — Parque Tenis Club Web

> Organizado por sprints según PRD sección 23.
> Estado: S1 = en curso, S2–S9 = pendiente.

---

## Sprint 1 — Documentación y estructura base

| # | Tarea | Estado |
|---|-------|--------|
| 1.1 | Crear `/product/vision.md` | ✅ |
| 1.2 | Crear `/product/reglas-liga-invierno.md` | ✅ |
| 1.3 | Crear `/product/modelo-datos.md` | ✅ |
| 1.4 | Crear `/product/reglas.md` | ✅ |
| 1.5 | Crear `/product/backlog.md` | ✅ |
| 1.6 | Crear `/product/open-questions.md` | ✅ |
| 1.7 | Crear `CLAUDE.md` | ✅ |

---

## Sprint 2 — Proyecto Next.js base

| # | Tarea | Estado |
|---|-------|--------|
| 2.1 | Inicializar proyecto Next.js con App Router + TypeScript + Tailwind | ⬜ |
| 2.2 | Configurar shadcn/ui | ⬜ |
| 2.3 | Crear estructura de carpetas (`app/`, `components/`, `content/`, `lib/`, `lib/tournament/`, `public/images/`) | ⬜ |
| 2.4 | Crear rutas públicas vacías (`/`, `/liga-invierno`, `/liga-invierno/categorias/[slug]`, `/liga-invierno/equipos/[slug]`, `/liga-invierno/reglamento`) | ⬜ |
| 2.5 | Crear rutas admin vacías (`/admin`, `/admin/login`, `/admin/liga-invierno/*`) | ⬜ |
| 2.6 | Navbar público sin link al admin | ⬜ |
| 2.7 | Footer | ⬜ |
| 2.8 | Configurar Vitest o Jest | ⬜ |

---

## Sprint 3 — Landing institucional con mocks

| # | Tarea | Estado |
|---|-------|--------|
| 3.1 | Hero principal con imagen real o placeholder | ⬜ |
| 3.2 | CTA a WhatsApp | ⬜ |
| 3.3 | Sección actividades principales | ⬜ |
| 3.4 | Sección alquiler de canchas | ⬜ |
| 3.5 | Sección entrenamientos | ⬜ |
| 3.6 | Sección escuela de tenis | ⬜ |
| 3.7 | Sección torneos | ⬜ |
| 3.8 | Bloque destacado Liga de Invierno con link | ⬜ |
| 3.9 | Sección ubicación / cómo llegar | ⬜ |
| 3.10 | Sección contacto | ⬜ |
| 3.11 | Contenido editable desde `/content/site.ts` | ⬜ |
| 3.12 | SEO metadata del home | ⬜ |

---

## Sprint 4 — Liga de Invierno pública con mocks

| # | Tarea | Estado |
|---|-------|--------|
| 4.1 | Componente `TournamentHeader` | ⬜ |
| 4.2 | Componente `CategoryTabs` | ⬜ |
| 4.3 | Componente `StandingsTable` (con versión mobile resumida y expandible) | ⬜ |
| 4.4 | Componente `FixtureList` | ⬜ |
| 4.5 | Componente `ResultCard` | ⬜ |
| 4.6 | Componente `SeriesDetail` | ⬜ |
| 4.7 | Componente `CourtMatchDetail` | ⬜ |
| 4.8 | Componente `TeamCard` | ⬜ |
| 4.9 | Componente `TeamSchedule` | ⬜ |
| 4.10 | Página `/liga-invierno` con selector de categorías, tabla destacada, próximas fechas y últimos resultados | ⬜ |
| 4.11 | Página `/liga-invierno/categorias/[slug]` con tabla, fixture y equipos | ⬜ |
| 4.12 | Página `/liga-invierno/equipos/[slug]` con lista de buena fe, fechas jugadas (expandibles) y fixture pendiente | ⬜ |
| 4.13 | Página `/liga-invierno/reglamento` | ⬜ |
| 4.14 | Datos mock para todas las vistas | ⬜ |
| 4.15 | SEO metadata de Liga de Invierno | ⬜ |

---

## Sprint 5 — Lógica deportiva + tests

| # | Tarea | Estado |
|---|-------|--------|
| 5.1 | `parseScore(score: string)` | ⬜ |
| 5.2 | `calculateCourtMatchResult(match)` | ⬜ |
| 5.3 | `calculateSeriesResult(seriesWithCourtMatches)` | ⬜ |
| 5.4 | `calculateWalkoverSeriesResult(winnerTeamId, loserTeamId)` | ⬜ |
| 5.5 | `calculateStandings(teams, series, courtMatches, rules)` | ⬜ |
| 5.6 | `sortStandings(standings, rules)` | ⬜ |
| 5.7 | `getTeamSchedule(teamId, series, courtMatches)` | ⬜ |
| 5.8 | Tests: serie 3-0 | ⬜ |
| 5.9 | Tests: serie 2-1 | ⬜ |
| 5.10 | Tests: tercer set 7-6 | ⬜ |
| 5.11 | Tests: WO de cancha individual | ⬜ |
| 5.12 | Tests: WO general | ⬜ |
| 5.13 | Tests: desempate por diferencia de canchas | ⬜ |
| 5.14 | Tests: desempate por diferencia de sets | ⬜ |
| 5.15 | Tests: desempate por diferencia de games | ⬜ |
| 5.16 | Tests: historial de equipo con jugados y pendientes | ⬜ |
| 5.17 | Tests: detalle de canchas solo en partidos jugados | ⬜ |
| 5.18 | Tests: edición de resultado recalcula tabla | ⬜ |
| 5.19 | Tests: reprogramación cambia fecha sin alterar resultado | ⬜ |

---

## Sprint 6 — Supabase

| # | Tarea | Estado |
|---|-------|--------|
| 6.1 | Crear proyecto Supabase | ⬜ |
| 6.2 | Migraciones: tabla `tournaments` | ⬜ |
| 6.3 | Migraciones: tabla `categories` | ⬜ |
| 6.4 | Migraciones: tabla `teams` | ⬜ |
| 6.5 | Migraciones: tabla `players` | ⬜ |
| 6.6 | Migraciones: tabla `team_players` | ⬜ |
| 6.7 | Migraciones: tabla `rounds` | ⬜ |
| 6.8 | Migraciones: tabla `series` | ⬜ |
| 6.9 | Migraciones: tabla `court_matches` | ⬜ |
| 6.10 | Migraciones: tabla `standings_snapshot` | ⬜ |
| 6.11 | Row Level Security (RLS): lectura pública en tablas públicas | ⬜ |
| 6.12 | RLS: escritura solo para admins autenticados | ⬜ |
| 6.13 | Conectar Next.js con Supabase (Server Components) | ⬜ |
| 6.14 | Reemplazar mocks por queries reales en vistas públicas | ⬜ |
| 6.15 | Seed: cargar torneo, categorías y equipos base | ⬜ |

---

## Sprint 7 — Panel admin

| # | Tarea | Estado |
|---|-------|--------|
| 7.1 | Login con Supabase Auth en `/admin/login` | ⬜ |
| 7.2 | Middleware de protección para rutas `/admin/*` | ⬜ |
| 7.3 | Dashboard admin con accesos a secciones | ⬜ |
| 7.4 | CRUD equipos | ⬜ |
| 7.5 | CRUD jugadores | ⬜ |
| 7.6 | Asociar jugadores a equipos, marcar capitán | ⬜ |
| 7.7 | Crear y editar series (fixture) | ⬜ |
| 7.8 | Reprogramar series (con motivo) | ⬜ |
| 7.9 | Cargar resultados por serie (3 canchas, jugadores, score, WO) | ⬜ |
| 7.10 | Editar resultados existentes + recálculo completo de tabla | ⬜ |
| 7.11 | Cargar WO general | ⬜ |
| 7.12 | Validaciones con React Hook Form + Zod | ⬜ |

---

## Sprint 8 — Importador de fixture

| # | Tarea | Estado |
|---|-------|--------|
| 8.1 | Crear `/scripts/import-fixture.ts` | ⬜ |
| 8.2 | Parsear CSV con columnas: `categoria,fase,fecha_numero,fecha_nombre,equipo_local,equipo_visitante,dia,hora` | ⬜ |
| 8.3 | Validar categorías existentes | ⬜ |
| 8.4 | Validar equipos existentes | ⬜ |
| 8.5 | Crear rounds si no existen | ⬜ |
| 8.6 | Crear series sin duplicados | ⬜ |
| 8.7 | Reporte claro de errores | ⬜ |
| 8.8 | Modo `--dry-run` | ⬜ |
| 8.9 | Comando: `npm run import:fixture -- --file ./data/fixture.csv --dry-run` | ⬜ |

---

## Sprint 9 — Deploy

| # | Tarea | Estado |
|---|-------|--------|
| 9.1 | Configurar variables de entorno en Vercel | ⬜ |
| 9.2 | SEO metadata completo (title, description por ruta) | ⬜ |
| 9.3 | Favicon | ⬜ |
| 9.4 | `robots.txt` | ⬜ |
| 9.5 | `sitemap.xml` | ⬜ |
| 9.6 | Optimización de imágenes (`next/image`) | ⬜ |
| 9.7 | Build limpio (sin errores TypeScript) | ⬜ |
| 9.8 | Lint limpio | ⬜ |
| 9.9 | Deploy en Vercel | ⬜ |
| 9.10 | Apuntar dominio del club a Vercel | ⬜ |

---

## Pendiente / futuro (sin sprint asignado)

- **Refactor visual del sitio** (mencionado 2026-09-08, sin rama ni doc propio
  todavía): cuando arranque, revisar `/interparque` — hoy usa los tokens
  `brand`/`accent` existentes combinados con la identidad de los flyers
  (ver ADR-006), pensado como diseño simple de arranque, no definitivo.
  Sumar también al alcance del refactor, relevado el 2026-09-09 con el
  organizador sobre las vistas del Circuito del Parque (hoy funcionales
  pero con la estética muy floja — se armaron rápido para tener el dato
  navegable, sin pasada de diseño real):
  - `BracketView`/`RepechajeView` (`components/circuito/`) hoy listan las
    rondas apiladas verticalmente. Pasar a un cuadro horizontal de
    izquierda a derecha (ronda 1 → semis → final, como un bracket de
    torneo real), con el repechaje como un cuadro aparte debajo del
    principal (ya está separado a nivel de datos/componente, falta el
    tratamiento visual de cuadro).
  - Esto aplica a `/circuito-del-parque/torneos/[edition]/[categoria]` y a
    `/circuito-del-parque/especiales/[edition]/categorias/[slug]`
    (Mid Master, que reusa un patrón parecido).

  **Actualización (2026-09-23) — bug de fondo corregido, queda pendiente el pulido visual de arriba:**
  `BracketView` etiquetaba **incorrectamente** partidos de fase de grupos como
  "Cuartos de final"/"Semifinal" para categorías chicas (4/5/6-7 inscriptos)
  importadas de Challonge, porque usaba el `round_number` crudo de Challonge
  asumiendo siempre eliminación directa. Se agregó `lib/circuito/bracketDisplay.ts`
  (`classifyMainBracketSections`), que reusa la misma `CircuitoFormatSpec` del
  motor propio (`generateBracket.ts`) para determinar el formato real según la
  cantidad de inscriptos y agrupar los partidos en secciones correctas
  ("Fase de grupos", "Zona A"/"Zona B", "Semifinales", "Final" — o el árbol de
  eliminación clásico solo cuando corresponde). La Final se identifica buscando
  el par de jugadores que se repite en cualquier posición de la secuencia (no
  solo la última — el `round_number` de Challonge no es cronológico). Verificado
  contra datos reales (Cincinnati Open Damas Segunda y Halle Open +50): ya no
  aparece ninguna etiqueta de eliminación falsa y la Final se separa correctamente.

  **Nota técnica para el futuro — cómo se verificó esto sin API de Challonge:**
  la API pública de Challonge exige auth (`CHALLONGE_CLIENT_ID`/`SECRET`, no
  disponibles en esta sesión) y la web (`challonge.com`) está detrás de un
  challenge gestionado de Cloudflare que bloquea `curl`/`fetch` sin importar el
  User-Agent. Se resolvió lanzando **Chromium headless real vía Playwright**
  (`npx playwright install chromium`, con `PLAYWRIGHT_BROWSERS_PATH` fuera de
  `~/Library/Caches` por permisos del sandbox) — pasa el challenge sin
  intervención humana. Detalle no obvio: reusar el mismo `browser`/`context`
  para requests sucesivos (ej. paginar `?page=2`, `?page=3`...) hace que
  Cloudflare devuelva contenido vacío a partir del 2º request — hay que lanzar
  un **browser nuevo por página** para que cada uno pase el challenge de cero.

- **Deuda técnica — datos del import de Challonge** (Sprint C7,
  `scripts/import-challonge.ts`, corrido el 2026-09-09) — **auditoría completa
  realizada el 2026-09-23** (scraping de las 15 páginas del listado de la
  cuenta `elcircuitodelparque`, 296 torneos históricos, 89 creados en 2026),
  cruzada contra Supabase:

  - **Confirmado con datos reales de Challonge:** 87 de los 89 torneos 2026
    matchean con el mismo parser de `import-challonge.ts` (57 main + 30
    repechaje). Solo 2 sin matchear, por una razón real y no un bug del
    parser: `#f4jx7rzy` "SINGLE DAMAS REPECHAJE Us Open" y `#4qcnjdw1`
    "SINGLE DAMAS Us Open" — al cargarlos en Challonge se omitió "Segunda"
    en el nombre (es la única categoría Damas single sin ese calificador
    explícito). Revisar/renombrar en Challonge o agregar un caso especial al
    parser si se confirma que siempre es "Segunda".

  - **13 torneos que el parser matchea correctamente pero que NUNCA llegaron
    a `circuito_matches`/`circuito_categories.draw_size`** (gap real y
    confirmado con slug de Challonge, no solo sospecha por cruce de ranking):
    Us Open mes 9 (Caballeros Tercera — aparece 2 veces con `#ihojf8zz` 6
    inscriptos y `#h6obislt` 11 inscriptos, probable duplicado a confirmar;
    Caballeros Segunda `#bo7ec9ck`; Caballeros Intermedia `#ethoa73o`; Dobles
    Damas Segunda `#qdffzbm3`; Dobles Caballeros Segunda `#990f1e2p`),
    Cincinnati Open mes 8 (Dobles Damas Segunda `#i5k3kegc`; Dobles
    Caballeros Segunda `#yw5tb5os`), Halle Open mes 6 (Single Primera
    `#3et2cnks`), Miami Open mes 3 (Dobles Damas Segunda `#b49ygvp2`; Single
    Primera `#ce837c5l`), Australia Open mes 1 (Dobles Mixto Intermedia
    `#kiu269kc`; Dobles Caballeros Segunda `#kx6bttcb` — este último con **0
    inscriptos**, probablemente un torneo vacío/cancelado en Challonge, no
    un gap real). Pendiente: correr el import para estos 13 (necesita
    `SUPABASE_SERVICE_ROLE_KEY`, no disponible en esta sesión).

  - **La hipótesis original ("Challonge tipa el torneo `single elimination`
    pero en realidad se jugó como zona") era imprecisa — corregida:**
    Challonge expone su **propio tipo real** para estos casos,
    **"Groups → SE"** (`Groups (N → 2) y después Single Elimination`), no
    "single elimination". Confirmado en 18 de los 87 torneos matcheados
    (`SINGLE DAMAS SEGUNDA Cincinnati Open` #913z5ouq y otros 17 — lista
    completa en la sesión del 2026-09-23). El dato de Challonge siempre fue
    correcto y estructurado (tiene su propia vista `/groups` con la tabla de
    posiciones de zona); lo que faltaba era que `import-challonge.ts` no lee
    `tournament_type` ni usa la vista de grupos — solo vuelca el `round`
    crudo de `/matches`, perdiendo la estructura real. Corregir el import
    para diferenciar por `tournament_type` (o replicar el fix de
    `bracketDisplay.ts` del lado del import, escribiendo `round_number`/`zone`
    ya clasificados en vez de crudos) sigue pendiente — hoy el fix vive solo
    en la capa de presentación (`lib/circuito/bracketDisplay.ts`), no en los
    datos de `circuito_matches`.

  - **Torneos duplicados detectados (requiere decisión humana, no auto-resolver):**
    "Caballeros +50 Halle" tiene **2 torneos de Challonge completos e
    independientes** para el mismo mes — `#id7p3hdl` "SINGLE MAS 50 Torneo
    Halle" (creado 7-jun, mismos 4 jugadores: Dino Marzari, Diego Del Corral,
    Gustavo Di Giacomo, Diego Carbone, resultados de zona ligeramente
    distintos) y `#waxgcgpz` "SINGLE MAS 50 Torneo Halle Open" (creado
    1-jul, mismos 4 jugadores, resultados propios). El import los pisó entre
    sí (mismo `onConflict: category_id,bracket,round_number,position`),
    mezclando partidos de ambos torneos en una sola categoría — esto explica
    el patrón de "partidos de más con pares repetidos raros" encontrado en
    la auditoría del 2026-09-09. **Hay que preguntarle al organizador cuál
    de los 2 es el torneo real** (¿se rehizo por algún error? ¿son cosas
    distintas?) antes de decidir cómo importar esta categoría — no inventar
    la respuesta.

  - Falta todavía: revisar partido por partido (no solo la estructura) una
    muestra más amplia de categorías/meses más allá de las verificadas acá.

---

## Criterios de aceptación del MVP

El MVP está terminado cuando todos estos puntos están en verde:

```
[ ] Landing institucional online
[ ] /liga-invierno online
[ ] 6 categorías visibles
[ ] Tabla por categoría funciona
[ ] Fixture por categoría funciona
[ ] Equipos y jugadores visibles
[ ] Página de equipo muestra jugados y pendientes
[ ] Resultados jugados muestran detalle de las 3 canchas
[ ] Admin puede iniciar sesión
[ ] Admin puede cargar equipos
[ ] Admin puede cargar jugadores
[ ] Admin puede cargar fixture
[ ] Admin puede cargar resultados
[ ] Admin puede editar resultados
[ ] Admin puede reprogramar fechas
[ ] Tabla se recalcula automáticamente
[ ] WO general funciona
[ ] WO de cancha funciona
[ ] Build y lint pasan
[ ] Web deployada en Vercel
[ ] Dominio apunta a la nueva web
```
