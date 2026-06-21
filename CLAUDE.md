# CLAUDE.md — Parque Tenis Club Web

Guía de referencia rápida para Claude Code. Leer antes de modificar cualquier archivo.

---

## Qué es este proyecto

Web real para **Parque Tenis Club** (Argentina). Dos secciones:

1. **Landing institucional pública** (`/`) — vitrina del club con CTA a WhatsApp.
2. **Liga de Invierno** (`/liga-invierno`) — torneo por equipos con fixture, tabla y resultados.
3. **Panel admin privado** (`/admin`) — solo para organizadores autenticados.

---

## Documentación del producto

| Archivo | Contenido |
|---------|-----------|
| `/product/PRD_PARQUE_TENIS_LIGA_INVIERNO.md` | Fuente de verdad. Leer primero. |
| `/product/vision.md` | Objetivos, usuarios, alcance del MVP |
| `/product/reglas-liga-invierno.md` | Reglas deportivas del torneo (canónico) |
| `/product/reglas.md` | Principios y restricciones de desarrollo |
| `/product/modelo-datos.md` | Esquema de tablas Supabase |
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
│   ├── liga-invierno/            # Sección Liga de Invierno
│   │   ├── page.tsx
│   │   ├── categorias/[slug]/page.tsx
│   │   ├── equipos/[slug]/page.tsx
│   │   └── reglamento/page.tsx
│   └── admin/                    # Panel admin (protegido desde Sprint 7)
│       ├── login/page.tsx
│       ├── page.tsx
│       └── liga-invierno/
├── components/
│   ├── ui/                       # shadcn/ui base
│   ├── layout/                   # Navbar, Footer
│   └── liga/                     # Componentes del torneo
├── content/
│   └── site.ts                   # Textos y datos editables del club
├── lib/
│   └── tournament/               # Lógica pura del torneo (sin UI)
│       ├── types.ts
│       ├── parseScore.ts
│       ├── calculateCourtMatchResult.ts
│       ├── calculateSeriesResult.ts
│       ├── calculateWalkoverSeriesResult.ts
│       ├── calculateStandings.ts
│       ├── sortStandings.ts
│       └── getTeamSchedule.ts
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

### Lógica en `/lib/tournament/`, nunca en componentes

### Admin invisible

`/admin` no está linkeado desde ninguna página pública. Nunca en navbar ni footer.

### Datos sensibles

No mostrar teléfonos en vistas públicas. No commitear `.env`. No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.

---

## Rutas públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Home institucional |
| `/liga-invierno` | Portal del torneo |
| `/liga-invierno/categorias/[slug]` | Tabla, fixture y equipos de categoría |
| `/liga-invierno/equipos/[slug]` | Página de equipo con historial |
| `/liga-invierno/reglamento` | Reglamento resumido |

## Rutas admin (no enlazar públicamente)

| Ruta | Descripción |
|------|-------------|
| `/admin/login` | Login con Supabase Auth |
| `/admin` | Dashboard |
| `/admin/liga-invierno/equipos` | CRUD equipos |
| `/admin/liga-invierno/jugadores` | CRUD jugadores |
| `/admin/liga-invierno/fixture` | Cargar y editar fixture |
| `/admin/liga-invierno/resultados` | Cargar y editar resultados |
| `/admin/liga-invierno/reprogramaciones` | Reprogramar series |

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
