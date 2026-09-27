# Plan — Refactor visual del sitio

> **Estado:** borrador — completar las secciones marcadas con ✏️ antes de empezar a codear.
> **Rama del plan:** `docs/plan-refactor-visual`. Cada fase de implementación va en su propio PR.
> Antecedente: sección "Refactor visual del sitio" de `backlog.md` (pendientes relevados el 2026-09-08/09).

---

## 1. Objetivo y alcance

### Qué problema resuelve ✏️

<!-- Ej.: "el Circuito se ve armado a las apuradas", "no transmite un club profesional",
     "en el celular cuesta leer las tablas". Una o dos frases por problema. -->

-
-

### Para quién ✏️

<!-- Quién mira cada parte y desde dónde. Ajustar/ordenar por importancia. -->

- Socios/jugadores que consultan resultados, tablas y ranking — mayormente desde el celular.
- Gente nueva que llega a la home (conocer el club, contactar por WhatsApp).
- Organizadores usando los paneles admin.

### Cómo sabemos que terminó ✏️

<!-- Criterio general de éxito. Ej.: "todas las pantallas públicas usan el mismo sistema visual
     y se leen bien en un celular de 375 px de ancho". -->

-

### Fuera de alcance ✏️

<!-- Qué NO se cambia. Ej.: logo, textos institucionales, rediseño de los paneles. -->

-

---

## 2. Relevamiento de lo que hay hoy

Estado al 2026-09-27 (después de mergear el PR #5). Completar la columna "Notas" con qué
funciona y qué no, idealmente con una captura en `product/refactor-visual/actual/`. ✏️

### Identidades visuales que conviven hoy

| Identidad | Dónde se usa | Tokens (`app/globals.css`) |
|---|---|---|
| General verde + naranja | Home, Circuito, Interparque, Liga | `brand` #2d8653, `accent` #f47c2b, grises neutros |
| Invierno (azul) | Liga de Invierno | `winter` #4d90c4 (+ `decorations/snowfall.tsx`) |
| Mid Master (negro + dorado) | `/circuito-del-parque/especiales/*` | `mm-*` (fondo #0d0f0d, dorado #c9a84c), serif Playfair |
| Interparque (flyers) | `/interparque` | tokens generales combinados con la estética de los flyers (ADR-006) |

Tipografía: Geist (texto y títulos, `--font-heading`) y Playfair Display (solo Mid Master).

**Decisión a tomar ✏️:** ¿se unifica todo en una sola identidad, o se mantiene una base común con
"sub-identidades" por sección (invierno, Mid Master)?

### Pantallas públicas

| Área | Ruta | Componentes principales | Notas ✏️ |
|---|---|---|---|
| Home | `/` | `site-header`, `hero`, `activities`, `winter-league`, `CircuitoPromo`, `InterparquePromo`, `location-contact`, `site-footer`, `whatsapp-fab` | |
| Liga — selector | `/ligas-invierno-verano` | `SeasonSelector`, `SeasonCard` | |
| Liga — edición | `/ligas-invierno-verano/[season]` | `TournamentHeader`, `CategoryTabs`, `liga-board`, `ClosedSeasonView`, `ComingSoonView`, `ChampionBanner`, `PodiumBanner`, `sponsors-banner` | |
| Liga — categoría | `/ligas-invierno-verano/[season]/categorias/[slug]` | `StandingsTable`, `FixtureList`, `ResultCard`, `SeriesDetail`, `CourtMatchDetail`, `PlayoffBracket`, `TeamCard`, `PhotoGallery` | |
| Liga — equipo | `/ligas-invierno-verano/[season]/equipos/[catSlug]/[teamSlug]` | `team-detail`, `TeamSchedule` | |
| Liga — reglamento | `/ligas-invierno-verano/reglamento` | `liga-reglamento` | |
| Circuito — landing | `/circuito-del-parque` | `EditionCard` | |
| Circuito — torneo | `/circuito-del-parque/torneos/[edition]` | lista de categorías (single / dobles) | |
| Circuito — categoría | `/circuito-del-parque/torneos/[edition]/[categoria]` | `BracketView`, `RepechajeView` | **Pendiente conocido:** pasar a cuadro horizontal (ver §4, Fase 2) |
| Circuito — ranking | `/circuito-del-parque/ranking` | `CategoryFilterPills`, `RankingByTournamentTable` | Tabla por torneo recién agregada (scroll horizontal, 1ª columna fija) |
| Circuito — Final Master | `/circuito-del-parque/final-master` | `CategoryFilterPills`, `RankingTable` | |
| Mid Master — edición | `/circuito-del-parque/especiales/[edition]` | `MidMasterHero`, `CategoryGrid`, `MmReveal`, `MmSponsorsBanner` | Identidad propia negro + dorado |
| Mid Master — categoría | `/circuito-del-parque/especiales/[edition]/categorias/[slug]` | `ZoneSection`, `ZoneStandingsTable`, `ZoneFixture`, `KnockoutBracket`, `MatchCard` | |
| Interparque | `/interparque` | `interparque/StandingsTable`, `interparque/MatchesList` | Diseño "de arranque, no definitivo" (backlog) |

Las rutas viejas de la Liga sin `[season]` (`/ligas-invierno-verano/categorias/[slug]`, `/equipo/[slug]`,
`/equipos/[catSlug]/[teamSlug]`) son solo redirects: no entran en el refactor.

### Paneles admin (no enlazados públicamente)

| Panel | Rutas | Componentes principales | Notas ✏️ |
|---|---|---|---|
| Liga | `/panel-liga` (+ equipos, jugadores, fixture, resultados, reprogramaciones) | `team-manager`, `fixture-manager`, `result-loader`, `playoff-manager`, `photo-manager`, `close-tournament-button` | |
| Circuito | `/panel-circuito/mensual/*` | `CreateEditionForm`, `ParticipantsPanel`, `PlayerCombobox`, `circuito/MatchesList` | |
| Mid Master | `/panel-circuito`, `/panel-circuito/categorias/[slug]` | `mid-master/ZoneAdmin`, `KnockoutAdmin`, `MatchForm` | |
| Interparque | `/panel-interparque` | `interparque/MatchForm`, `NewMatchForm`, `PlayerSelect` | |
| Logins | `/panel-*/login` | — | |

### Código muerto a borrar en el refactor

- `components/layout/Footer.tsx` y `components/layout/Navbar.tsx`: nadie los importa (el header y el
  footer reales son `site-header.tsx` y `site-footer.tsx`).
- `content/site.ts`: solo se usa para el título y la descripción SEO en `app/layout.tsx`, y tiene
  datos de contacto de ejemplo desactualizados. Unificar con `lib/site.ts`.

---

## 3. Sistema visual

Se define una vez, antes de tocar pantallas. Todas las fases lo usan.

### Referencias ✏️

<!-- 3 a 5 sitios/apps con una línea de qué te gusta de cada uno.
     Capturas en product/refactor-visual/referencias/. -->

| Referencia | Qué tomar |
|---|---|
| | |
| | |

### Colores ✏️

<!-- Partir de los tokens actuales (§2). Definir: principal, acento, fondos, bordes, texto,
     y estados de resultado (ganó / perdió / pendiente / WO). ¿Modo oscuro sí o no? -->

| Rol | Valor actual | Valor nuevo |
|---|---|---|
| Principal | `brand` #2d8653 | |
| Acento | `accent` #f47c2b | |
| Fondo | #ffffff / `surface` #f9fafb | |
| Texto | #111827 / `muted-foreground` #6b7280 | |
| Ganó / perdió / pendiente | (no hay tokens propios) | |

### Tipografía ✏️

<!-- Escala de títulos (h1–h3), texto, y números de resultados (conviene ancho fijo / tabular). -->

-

### Componentes compartidos ✏️

Piezas que hoy están repetidas con estilos distintos por sección. Definir una versión común:

| Componente | Hoy existe como | Versión común ✏️ |
|---|---|---|
| Tabla de posiciones | `liga/StandingsTable`, `interparque/StandingsTable`, `mid-master/ZoneStandingsTable`, `circuito/RankingTable` | |
| Tarjeta de partido / resultado | `liga/ResultCard`, `mid-master/MatchCard`, filas de `interparque/MatchesList` | |
| Cuadro de eliminación | `liga/PlayoffBracket`, `mid-master/KnockoutBracket`, `circuito/BracketView` | |
| Filtro por categoría | `liga/CategoryTabs`, `circuito/CategoryFilterPills` | |
| Encabezado de sección / hero | `hero`, `liga/TournamentHeader`, `mid-master/MidMasterHero`, `liga-header` | |
| Estado vacío ("todavía no hay…") | textos sueltos en cada página | |

### Celular

- Ancho de referencia: 375 px.
- Tablas anchas: scroll horizontal con la primera columna fija (como `RankingByTournamentTable`).
- Cuadros de eliminación: scroll horizontal; definir cómo se ven con 16 y 32 jugadores. ✏️

---

## 4. Fases (un PR por fase)

Orden propuesto — ajustar prioridades. ✏️

| Fase | Qué incluye | Criterio de terminado ✏️ |
|---|---|---|
| **1. Base** | Tokens de color y tipografía, `site-header`, `site-footer`, componentes compartidos de §3, borrar código muerto | |
| **2. Circuito del Parque** | Landing, torneo, categoría con **cuadro horizontal** (rondas en columnas hacia la final, repechaje debajo; en formatos de zona 4-7 la zona sigue como tabla y solo semis/final como cuadro), ranking, Final Master | Ej.: el cuadro de 8/16/32 se lee en 375 px |
| **3. Liga** | Selector, edición, categoría (tabla, fixture, playoffs), equipo, reglamento | |
| **4. Interparque y Mid Master** | `/interparque`, `/circuito-del-parque/especiales/*` | |
| **5. Home** | `/` | |
| **6. Paneles admin** | Solo orden y usabilidad, sin rediseño | |

---

## 5. Reglas del refactor

- **Cero cambios funcionales.** Un bug de lógica que aparezca va en un PR aparte.
- **`lib/` no se toca**: solo cambian componentes, estilos y páginas.
- **Cada PR se revisa en el navegador**, con capturas de escritorio y de celular (375 px).
- **Se borra el código muerto** que se encuentre.
- Respetar `CLAUDE.md`: los paneles no se enlazan desde vistas públicas y no se muestran teléfonos.

---

## 6. Decisiones abiertas ✏️

<!-- Dudas de diseño que hay que resolver antes o durante las fases. -->

- [ ] ¿Una identidad única o sub-identidades por sección? (ver §2)
- [ ] ¿Modo oscuro?
- [ ] ¿Se mantiene la tipografía actual (Geist / Playfair)?
-
