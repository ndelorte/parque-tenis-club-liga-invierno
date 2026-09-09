# ADR-005: Prefijo `circuito_` para las tablas nuevas del Circuito del Parque, tipadas desde el día 1

Status: Accepted

## Contexto

El Sprint C3 (`product/plan-liga-multitemporada-y-circuito.md` §4.4) va a crear
el modelo de datos del torneo mensual del Circuito del Parque
(`circuito_editions`, `circuito_categories`, `circuito_participants`,
`circuito_matches`, `circuito_ranking_points`). Antes de escribir esa
migración hay dos decisiones a fijar: bajo qué prefijo viven esas tablas, y
si se tipan en `lib/supabase/types.ts` o se accede con `any` como hoy hace
`mid_master_*` (`lib/data/mid-master/index.ts` usa `AnyRow = Record<string, any>`
a propósito).

## Decisión

1. **Prefijo `circuito_`, no extender `mid_master_`.** El circuito mensual
   (torneos con eliminación + repechaje, ranking anual) y Mid Master
   (zonas → semis → final, sin ranking propio) son formatos de torneo
   distintos que conviven bajo la misma sección "Circuito del Parque"
   pero con reglas y esquemas incompatibles — mismo criterio de
   aislamiento que ya separó Liga de Invierno de Mid Master en
   [ADR-002](./ADR-002-mid-master-modulo-aislado.md). Compartir tablas
   entre ambos formaría un acoplamiento que ninguno de los dos necesita.
2. **Tablas `circuito_*` tipadas en `lib/supabase/types.ts` desde que se
   crean**, a diferencia de `mid_master_*` (que usa `any` porque no se tipó
   en su momento — deuda técnica ya identificada, no hay que repetirla).
3. **Módulo lógico propio `lib/circuito/`** (puro, sin UI — motor de
   cuadros de C4, cálculo de puntos de C5) **+ data layer tipado
   `lib/data/circuito/`**, paralelos a `lib/tournament/` / `lib/data/` de
   Liga y a `lib/mid-master/` / `lib/data/mid-master/`, sin compartir
   queries con ninguno de los dos.
4. El único dato compartido entre los tres módulos (Liga, Mid Master,
   Circuito mensual) sigue siendo la tabla `players` — mismo criterio que
   ADR-002.

## Consecuencias

- Sprint C3 crea las tablas con prefijo `circuito_` y las refleja en
  `lib/supabase/types.ts` (`Row`/`Insert`/`Update` para cada una) y en
  `modelo-datos.md` en el mismo commit — no queda pendiente para después.
- `lib/circuito/generateBracket.ts` (C4) y `lib/data/circuito/ranking.ts`
  (C5, único escritor de `circuito_ranking_points`) no deben importar
  nada de `lib/tournament/`, `lib/playoffs/` ni `lib/mid-master/`, salvo
  `parseScore` si el formato de partido coincide exactamente (ver §4.5
  del plan) — cualquier otra dependencia cruzada es señal de estar
  rompiendo el aislamiento intencional.
- Tres data layers paralelos (Liga, Mid Master, Circuito) para conceptos
  similares (tabla de posiciones, bracket, resultados) es duplicación
  deliberada, mismo costo aceptado que en ADR-002, a cambio de que las
  reglas deportivas de cada uno puedan evolucionar sin arriesgar romper
  los otros dos.
