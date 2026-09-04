# ADR-002: Mid Master como módulo aislado (prefijo `mm_`, sin reuso de `lib/tournament/`)

Status: Accepted

## Contexto

Mid Master es un torneo distinto a Liga de Invierno: formato individual
(zonas round-robin → semifinales → final), sin walkover, sistema de
clasificación por partidos ganados (no puntos), desempate propio, y panel
admin propio. `reglas-mid-master.md` lo define explícitamente como
"completamente independiente de Liga de Invierno".

Riesgo si se comparte código con Liga de Invierno: un cambio en las reglas
de un torneo (ej. cómo se calcula el desempate) podría romper el otro sin
que sea obvio, porque las reglas deportivas de ambos son parecidas pero no
iguales (ej. Liga de Invierno usa puntos + WO; Mid Master usa partidos
ganados y no tiene WO).

## Decisión

- Tablas Supabase con prefijo `mm_` — aislamiento total del esquema de Liga
  de Invierno a nivel de base de datos.
- Lógica deportiva propia en `lib/mid-master/`. No reutiliza
  `lib/tournament/`, con una única excepción: `parseScore` (función pura,
  sin estado, sin reglas de negocio — solo parsea un string de score).
- Acceso a datos en `lib/data/mid-master/` (`index.ts`, `types.ts`),
  paralelo a `lib/data/` de Liga de Invierno pero sin compartir queries.
- UI separada: `components/mid-master/`, `components/admin/mid-master/`.
- Rutas públicas bajo `app/mid-master/`, panel admin en `app/panel-master/`
  — mismo Supabase Auth y mismo `isAdminUser()` que `panel-parque`
  (ver [ADR-001](./ADR-001-rename-admin-a-panel-parque.md)), pero rutas y
  matcher separados.
- Los jugadores sí se comparten (tabla `players`) — un jugador puede
  participar en Liga de Invierno y en Mid Master a la vez. Eso es lo único
  intencionalmente compartido a nivel de datos.

## Consecuencias

- Duplicación deliberada: hay dos data layers y dos conjuntos de
  componentes para lógica conceptualmente similar (tabla de posiciones,
  fixture, resultados). Es el costo aceptado a cambio de que ambos torneos
  puedan evolucionar con reglas incompatibles sin arriesgar romper el otro.
- Un cambio en reglas de Liga de Invierno no debería tocar código de Mid
  Master, y viceversa. Si una tarea obliga a cruzar esa frontera, es señal
  de que se está rompiendo el aislamiento intencional — vale la pena
  chequear con el usuario antes de hacerlo.
- `parseScore` es la única superficie de lógica compartida entre ambos
  módulos. Cualquier otra "reutilización" propuesta entre `lib/tournament/`
  y `lib/mid-master/` debería cuestionarse primero, no asumirse como buena
  práctica de DRY.
