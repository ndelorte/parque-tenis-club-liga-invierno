# ADR-006: Interparque como módulo aislado (prefijo `interparque_`, jugadores propios, sin snapshot de standings)

Status: Accepted

## Contexto

Interparque es una modalidad de partidos de single, exclusiva para alumnos
del club, nueva y sin relación deportiva con Liga de Invierno, Mid Master ni
Circuito del Parque (ver `reglas-interparque.md`). El club la venía llevando
provisoriamente en un Google Sheet y pidió sacarla a producción rápido, en
paralelo al refactor en curso de multi-temporada/Circuito del Parque
(rama `feat/circuito-c2-mid-master-multi-edicion`), sin esperar a que ese
refactor termine.

Mismo criterio de aislamiento ya usado para Mid Master (ADR-002) y decidido
para Circuito del Parque (ADR-005): cada formato de torneo con reglas
propias vive en su propio módulo, para que un cambio en las reglas de uno
no arriesgue romper los otros.

## Decisión

1. **Prefijo `interparque_`** para las tablas nuevas
   (`interparque_players`, `interparque_matches`), sin relación con
   `players`/`teams` de Liga Invierno ni con `mid_master_*`/`circuito_*`.

2. **Jugadores propios, no compartidos** (`interparque_players`) — a
   diferencia de Mid Master y Circuito del Parque, que sí comparten la
   tabla `players` con Liga Invierno (ADR-002 §"jugadores se comparten").
   Acá el club pidió explícitamente que la población de alumnos de
   Interparque **no** se mezcle con la de otras áreas: el selector de
   jugadores del panel admin de Interparque solo debe mostrar jugadores
   cargados como jugadores de Interparque. Esto rompe a propósito el
   patrón de "players es la única tabla compartida" que documentan
   ADR-002/ADR-005 — es una excepción deliberada para este módulo, no un
   cambio de criterio general.

3. **Parser de score propio**
   (`lib/interparque/parseInterparqueScore.ts`), no reutiliza
   `lib/tournament/parseScore.ts` (Liga) ni
   `lib/mid-master/parseMmScore.ts` — ambos fuerzan el tercer set a un
   score fijo (`7-6`/`6-7`), mientras que el super tie-break de Interparque
   tiene un score variable (gana quien llega a 10+ con 2 de diferencia).

4. **Sin tabla de standings/snapshot.** A diferencia de `standings_snapshot`
   de Liga Invierno (que sí se persiste, con un test de write-boundary que
   fuerza que solo `lib/data/standings.ts` la escriba), la tabla de
   posiciones de Interparque se calcula en vivo en cada request desde
   `interparque_matches` (`lib/interparque/calculateInterparqueStandings.ts`).
   Mismo criterio simple que ya usa Mid Master para sus standings de zona
   — a esta escala (unos pocos jugadores, actualización semanal) no
   justifica la complejidad de un snapshot separado. Lo que sí se persiste
   por partido es el resultado ya calculado
   (`games_a/games_b/points_a/points_b/winner_player_id`), calculado una
   única vez al cargar o corregir el score — nunca editado a mano.

5. **Tablas tipadas en `lib/supabase/types.ts` desde el día 1** (como
   `circuito_*` decidió ADR-005), no como `mid_master_*` (que usa `any` por
   deuda técnica ya identificada).

6. **Panel admin propio** (`/panel-interparque`), mismo Supabase Auth y
   `isAdminUser()` que `/panel-parque` y `/panel-master` — sin
   granularidad de roles adicional (confirmado con el usuario: los mismos
   admins que ya entran a los otros paneles pueden entrar acá).

7. **Rama nueva desde `main`** (`feat/interparque`), no arriba de
   `feat/circuito-c2-mid-master-multi-edicion` — para poder salir a
   producción sin esperar a que termine ese refactor. Ver nota de
   reconciliación en `plan-liga-multitemporada-y-circuito.md` sobre
   posibles conflictos de merge en `proxy.ts`, `Navbar.tsx` y `Footer.tsx`.

## Consecuencias

- Interparque es el módulo más aislado de los cuatro: además de tener
  lógica y prefijo de tabla propios (como Mid Master y Circuito), tiene
  también su propia tabla de jugadores. Un jugador que participa en Liga
  Invierno y en Interparque necesita dos altas manuales independientes —
  costo aceptado a cambio de que el club pueda gestionar la lista de
  alumnos de Interparque sin que se mezcle con otras áreas.
- Al no haber snapshot de standings, no hace falta un test de
  write-boundary sobre una tabla de posiciones — en su lugar, el invariante
  "nunca se editan puntos a mano" se sostiene porque `points_a`/`points_b`
  solo se escriben desde `updateInterparqueMatchResult`
  (`app/actions/interparque.ts`), siempre recalculados desde el score.
- Al mergear `feat/interparque` y la rama de refactor circuito/multi-edición
  a `main`, hay que revisar a mano `proxy.ts` (matcher + lookup de
  paneles), `components/layout/Navbar.tsx` y `Footer.tsx` — ambas ramas los
  tocan de forma independiente.
