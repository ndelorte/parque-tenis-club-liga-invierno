# CLAUDE.md — Parque Tenis Club Web

Guía de referencia rápida para Claude Code. Leer antes de modificar cualquier archivo.

---

## Qué es este proyecto

Web real para **Parque Tenis Club** (Argentina). Secciones:

1. **Landing institucional pública** (`/`) — vitrina del club con CTA a WhatsApp.
2. **Liga Invierno/Verano** (`/ligas-invierno-verano`) — selector de ediciones (Invierno/Verano, pasada/activa/próxima), torneo por equipos con fixture, tabla y resultados.
3. **Circuito del Parque** (`/mid-master`, en migración a `/circuito-del-parque`) — torneos individuales, incluye Mid Master como torneo especial.
4. **Interparque** (`/interparque`) — modalidad de partidos de single exclusiva para alumnos del club: reglas, tabla de posiciones y partidos jugados.
5. **Paneles admin privados** (`/panel-liga`, `/panel-circuito`, `/panel-interparque`) — solo para organizadores autenticados.

---

## Documentación del producto

**Si no sabés qué archivo leer para una tarea puntual, empezá por
`/product/context-index.md`.**

| Archivo | Contenido |
|---------|-----------|
| `/product/context-index.md` | Mapa "tarea → qué documento leer" |
| `/product/PRD_PARQUE_TENIS_LIGA_INVIERNO.md` | Fuente de verdad. Leer primero. |
| `/product/vision.md` | Objetivos, usuarios, alcance del MVP |
| `/product/reglas-liga-invierno.md` | Reglas deportivas de Liga de Invierno (canónico) |
| `/product/reglas-mid-master.md` | Reglas deportivas de Mid Master (canónico) |
| `/product/reglas-interparque.md` | Reglas deportivas de Interparque (canónico) |
| `/product/reglas.md` | Principios y restricciones de desarrollo |
| `/product/modelo-datos.md` | Esquema de tablas Supabase |
| `/product/adr/` | Decisiones de arquitectura aceptadas (por qué, no qué) |
| `/product/backlog.md` | Tareas organizadas por sprint |
| `/product/open-questions.md` | Gaps sin resolver — no implementar sin respuesta |

---

## Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 15+ (App Router) |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS + shadcn/ui |
| Base de datos | Supabase Postgres (Sprint 6+) |
| Auth | Supabase Auth (Sprint 7+) |
| Forms | React Hook Form + Zod |
| Tests | Vitest |
| Deploy | Vercel |

---

## Estructura de carpetas

```
/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fuente, colores base)
│   ├── page.tsx                  # Home /
│   ├── ligas-invierno-verano/     # Selector + ediciones de Liga Invierno/Verano
│   │   ├── page.tsx               # Selector de ediciones
│   │   ├── [season]/page.tsx      # Vista de una edición según status
│   │   ├── [season]/categorias/[slug]/page.tsx
│   │   ├── [season]/equipos/[catSlug]/[teamSlug]/page.tsx
│   │   └── reglamento/page.tsx
│   ├── interparque/              # Sección Interparque
│   │   └── page.tsx              # Reglas + tabla + partidos jugados
│   ├── panel-liga/                # Panel admin de Liga (protegido por proxy.ts)
│   │   ├── login/page.tsx
│   │   ├── page.tsx
│   │   └── liga-invierno/
│   ├── panel-circuito/            # Panel admin de Circuito del Parque / Mid Master
│   └── panel-interparque/        # Panel admin Interparque (protegido por proxy.ts)
│       ├── login/page.tsx
│       └── page.tsx
├── components/
│   ├── ui/                       # shadcn/ui base
│   ├── layout/                   # Navbar, Footer
│   ├── liga/                     # Componentes del torneo
│   ├── interparque/               # Tabla de posiciones y partidos jugados (público)
│   └── admin/interparque/         # Formularios del panel admin de Interparque
├── content/
│   └── site.ts                   # Textos y datos editables del club
├── proxy.ts                       # Protección de rutas /panel-liga/*, /panel-circuito/* y /panel-interparque/* (Next.js 16)
├── lib/
│   ├── tournament/               # Lógica pura del torneo (sin UI)
│   │   ├── types.ts
│   │   ├── parseScore.ts
│   │   ├── calculateCourtMatchResult.ts
│   │   ├── calculateSeriesResult.ts
│   │   ├── calculateWalkoverSeriesResult.ts
│   │   ├── calculateStandings.ts
│   │   ├── sortStandings.ts
│   │   └── getTeamSchedule.ts
│   ├── interparque/              # Lógica pura de Interparque (sin UI)
│   │   ├── parseInterparqueScore.ts
│   │   ├── calculateInterparqueMatchResult.ts
│   │   └── calculateInterparqueStandings.ts
│   ├── playoffs/                 # Lógica de bracket de playoffs
│   │   └── generateProvisionalBracket.ts
│   ├── data/                     # Acceso a Supabase (server-only)
│   │   ├── tournaments.ts
│   │   ├── categories.ts
│   │   ├── teams.ts
│   │   ├── series.ts
│   │   ├── standings.ts
│   │   ├── playoffs.ts
│   │   └── interparque/          # Lecturas de interparque_players / interparque_matches
│   ├── supabase/                 # Clientes Supabase tipados
│   │   ├── client.ts             # Browser (anon key)
│   │   ├── server.ts             # Server components (anon key + RLS)
│   │   └── admin.ts              # Server actions (service role — nunca al cliente)
│   └── auth/
│       └── admin.ts              # isAdminUser() — validación de rol
├── mock/
│   └── data.ts                   # Datos mockeados para desarrollo (Sprints 2-5)
├── scripts/
│   └── import-fixture.ts
└── product/                      # Documentación del producto
```

---

## Reglas críticas

### No inferir reglas deportivas

Si falta una regla deportiva, **no inventarla**. Agregar a `/product/open-questions.md`.

### La tabla se calcula desde resultados

Nunca editar puntos manualmente en `standings_snapshot`. Siempre recalcular desde `series` y `court_matches`.
Esta regla está reforzada por un test (`lib/data/__tests__/standings-write-boundary.test.ts`): solo `lib/data/standings.ts` puede escribir esa tabla.

### Lógica en `/lib/tournament/`, nunca en componentes

### Admin invisible

`/panel-liga`, `/panel-circuito` y `/panel-interparque` no están linkeados desde ninguna página pública. Nunca en navbar ni footer.

**Interparque es distinto de su panel**: `/interparque` (la sección pública) SÍ va en navbar y footer — la regla de invisibilidad aplica solo a `/panel-interparque`, no a la sección pública del mismo módulo.

### Datos sensibles

No mostrar teléfonos en vistas públicas. No commitear `.env`. No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.

---

## Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Home institucional |
| `/ligas-invierno-verano` | Selector de ediciones (Invierno/Verano, pasada/activa/próxima) |
| `/ligas-invierno-verano/[season]` | Vista de una edición según su status (activa/cerrada/próxima) |
| `/ligas-invierno-verano/[season]/categorias/[slug]` | Tabla, fixture y equipos de categoría en esa edición |
| `/ligas-invierno-verano/[season]/equipos/[catSlug]/[teamSlug]` | Página de equipo con historial en esa edición |
| `/ligas-invierno-verano/reglamento` | Reglamento resumido |
| `/interparque` | Nueva area de partidos entre alumnos |
| `/mid-master` | Torneo especial Mid Master (pasa a `/circuito-del-parque/especiales/...` en Sprint C2) |

Rutas viejas sin `[season]` (`/liga-invierno`, `/liga-invierno/categorias/[slug]`, `/liga-invierno/equipos/[catSlug]/[teamSlug]`) quedan como redirects 301 a la nueva base o a la edición activa — no reintroducirlas como rutas reales.

## Rutas admin (no enlazar públicamente)

| Ruta | Descripción |
|------|-------------|
| `/panel-liga/login` | Login con Supabase Auth |
| `/panel-liga` | Dashboard de Liga |
| `/panel-liga/liga-invierno/equipos` | CRUD equipos |
| `/panel-liga/liga-invierno/jugadores` | CRUD jugadores |
| `/panel-liga/liga-invierno/fixture` | Cargar y editar fixture |
| `/panel-liga/liga-invierno/resultados` | Cargar y editar resultados |
| `/panel-liga/liga-invierno/reprogramaciones` | Reprogramar series |
| `/panel-circuito/login` | Login con Supabase Auth (Circuito del Parque / Mid Master) |
| `/panel-circuito` | Dashboard de Circuito del Parque |
| `/panel-circuito/categorias/[slug]` | Carga de resultados de Mid Master |
| `/panel-interparque/login` | Login con Supabase Auth (mismo rol admin) |
| `/panel-interparque` | Dashboard: alta de jugadores, carga y edición de partidos/resultados |

Rutas viejas `/panel-parque/*` y `/panel-master/*` quedan como redirects 301 (ver `proxy.ts`) — no reintroducirlas.

---

## Reglas deportivas resumidas

Ver `/product/reglas-liga-invierno.md` para el detalle completo.

| Regla | Valor |
|-------|-------|
| Canchas por serie | 3 dobles |
| Gana la serie | Quien gana 2 de 3 canchas |
| Serie ganada | 2 puntos |
| Serie perdida | 1 punto |
| WO general (ausente) | 0 puntos; rival +2pts, +3c, +6s, +36g |
| WO de cancha | Score 6-0 6-0, solo 1 cancha posible por serie |
| Tercer set | Siempre registrado como 7-6 |
| Desempate | Pts → Δcanchas → Δsets → Δgames → mini-tabla H2H |
| Mixto B | 5 equipos (resto tienen 6) |

Ver `/product/reglas-interparque.md` para el detalle de Interparque.

| Regla (Interparque) | Valor |
|-------|-------|
| Formato de partido | Single, mejor de 3 sets |
| Puntos | 1 por game ganado (sets 1-2) |
| Bonus por ganar el partido | +3 puntos |
| Super tie-break (3er set) | Score variable (10+, 2 de diferencia); ganador +1 punto bonus |
| Jugadores | Tabla propia (`interparque_players`), no se comparte con Liga Invierno |
| Tabla de posiciones | Calculada en vivo, sin snapshot |

---

## Tests obligatorios (Sprint 5)

- Serie 3-0 / Serie 2-1 / Tercer set 7-6
- WO de cancha individual / WO general
- Desempate: Δcanchas, Δsets, Δgames, H2H
- Historial de equipo / Edición recalcula tabla / Reprogramación

---

## Checklist antes de cerrar cada sprint

```
[ ] lint pasa
[ ] build pasa sin errores TypeScript
[ ] tests pasan
[ ] informar archivos modificados
[ ] informar qué queda pendiente
```

---

## Flujo antes de modificar código

1. Leer el PRD: `/product/PRD_PARQUE_TENIS_LIGA_INVIERNO.md`
2. Leer `/product/reglas-liga-invierno.md`
3. Leer este archivo
4. Identificar gaps → `/product/open-questions.md`
5. No inferir reglas deportivas
6. Trabajar por sprint

**Si una decisión cambia: primero PRD, luego código.**
