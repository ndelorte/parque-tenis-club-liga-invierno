# Open Questions — Parque Tenis Club Web

> Gaps identificados al leer el PRD. No implementar nada relacionado a estas preguntas hasta tener respuesta.
> Preguntar al organizador del torneo antes de decidir.

---

## Pendientes

### OQ-02: ¿Cómo se maneja el bye en la categoría de 5 equipos (Mixto B)?

**Contexto**: En un todos-contra-todos con número impar de equipos (Mixto B = 5 equipos), un equipo queda libre cada fecha.

**Preguntar**:
- ¿Se muestra en el fixture que ese equipo tiene fecha libre?
- ¿El equipo que descansa acumula "partido jugado" o no?
- ¿Aparece en la tabla como "Serie jugada: 0" ese día?

**Impacto**: Afecta la generación del fixture, el conteo de `played` en `standings_snapshot` y el campo `round_number` de `rounds`.

---

### OQ-03b: ¿Qué pasa si sigue el empate después de todos los criterios H2H?

**Contexto**: Se definieron los criterios 5a–5c para enfrentamiento directo (diferencia de canchas, sets y games en H2H). Pero no está definido qué pasa si dos o más equipos siguen exactamente empatados después de 5c.

**Preguntar**: ¿Hay algún criterio de desempate final (sorteo, orden alfabético, etc.)?

**Impacto**: Afecta el caso borde final de `sortStandings()`.

---

### OQ-06: ¿Un jugador de Caballeros A puede también jugar en Caballeros B?

**Contexto**: El PRD dice "A y B cuentan como categorías diferentes", lo que implicaría que sí puede.

**Preguntar**:
- ¿Confirmado? ¿Un jugador puede estar en la lista de buena fe de Caballeros A y también de Caballeros B simultáneamente?
- ¿Hay alguna restricción de nivel entre A y B?

**Impacto**: Afecta la restricción en `team_players` y las validaciones del admin.

---

### OQ-08: ¿Qué pasa si un resultado cargado necesita convertirse en WO general?

**Contexto**: El PRD permite editar resultados (sección 16.7) y cargar WO general (sección 16.6), pero no describe el flujo de conversión.

**Preguntar**:
- ¿Se borran los `court_matches` existentes?
- ¿Se reemplazan por los valores de WO (3-0, 6-0, 36-0)?
- ¿O se mantienen los resultados reales y solo se agrega el flag `is_general_walkover`?

**Impacto**: Afecta el admin de resultados y el recálculo de standings.

---

### OQ-09: ¿Cuál es el número de WhatsApp del club?

**Contexto**: El CTA principal del home es "Consultar por WhatsApp".

**Preguntar**: ¿Cuál es el número de WhatsApp del club? ¿Formato: 54 9 11 XXXX-XXXX?

---

### OQ-10: ¿Cuál es la dirección exacta del club?

**Contexto**: El home tiene una sección "Ubicación / Cómo llegar".

**Preguntar**: ¿Cuál es la dirección del club? ¿Hay un link de Google Maps?

---

### OQ-11: ¿Cuál es el dominio actual del club?

**Contexto**: El PRD dice "el dominio actual del club debe apuntar a esta nueva web".

**Preguntar**: ¿Cuál es el dominio? ¿parquetenis.com.ar? ¿Otro?

---

### OQ-12: ¿Hay fotos reales del club disponibles?

**Contexto**: El diseño requiere "muchas fotos reales del club".

**Preguntar**: ¿Hay fotos disponibles? ¿En qué formato/resolución? ¿Hay restricciones de uso?

---

### OQ-13: ¿Cuáles son las fechas de inicio y fin de la Liga de Invierno 2026?

**Contexto**: El modelo `tournaments` tiene `start_date` y `end_date`.

**Preguntar**: ¿Cuándo arranca y cuándo termina la Liga de Invierno 2026?

---

### OQ-14: ¿Cómo se crean las cuentas admin de Nicolás y su hermano?

**Contexto**: El PRD define dos admins iniciales pero no describe si hay flujo de signup o creación manual.

**Preguntar**:
- ¿Las cuentas se crean manualmente en el dashboard de Supabase?
- ¿O hay un flujo de invitación?
- ¿Puede haber admins adicionales en el futuro?

---

### OQ-15: ¿El fixture ya hecho a mano está en algún formato digital?

**Contexto**: El PRD dice "el fixture ya existe hecho a mano y debe digitalizarse", y define un importador CSV.

**Preguntar**: ¿El fixture está en Excel, papel, WhatsApp? ¿Hay que digitalizarlo primero o se puede exportar directamente a CSV?

---

## Resueltas — Liga Multi-Temporada

### ~~OQ-19~~: Edición cerrada — ¿tabla+cuadro+campeón o sólo cuadro+campeón?

**Respuesta** (2026-09-07): Tabla final + cuadro de playoffs + campeón. Solo se oculta el fixture
fecha por fecha (partidos de fase regular). Implementado en Sprint L3
(`components/liga/ClosedSeasonView.tsx`).

**Actualización** (2026-09-09): El organizador cambió de decisión. En una edición `finished` ahora
se muestra **solo el podio por categoría** (campeón, subcampeón, tercer puesto) — ni tabla final ni
cuadro de playoffs completo. `getPodiumForCategory` (`lib/data/playoffs.ts`) deriva el podio de las
series `final` y `third_place`; `ClosedSeasonView` renderiza `PodiumBanner` en vez de
`StandingsTable`/`PlayoffBracket`.

---

### ~~OQ-20~~: ¿Cierre por torneo o por categoría?

**Respuesta** (2026-09-07): Por torneo completo — `tournaments.status` (no se agrega
`categories.status`). Todas las categorías de una edición cierran juntas.

---

### ~~OQ-21~~: Vista "Próximamente" — ¿elige categoría o pantalla única?

**Respuesta** (2026-09-07): Pantalla única (logo + "Próximamente" + reloj de arena animado).
No hay selector de categoría porque todavía no existen categorías/equipos cargados para esa
edición. Implementado en Sprint L5 (`components/liga/ComingSoonView.tsx`).

---

### ~~OQ-35~~: Formato de las planillas de ediciones anteriores

**Respuesta** (2026-09-09): El organizador pasó las posiciones finales (campeón/subcampeón/tercer
puesto por categoría) por chat, no hay planillas partido a partido digitalizadas. Como la vista de
edición cerrada ahora solo muestra podio (ver actualización de OQ-19), esto alcanza — no hace falta
reconstruir fixture ni resultados de cancha (se descarta el "Camino A" del plan original).

Cargado en `supabase/seeds/003_liga_historica_podios.sql` como `categories.manual_champion_name` /
`manual_runner_up_name` / `manual_third_place_name` (fallback — Sprint L7):
- Liga de Invierno 2025, Liga de Verano 2025/2026: creadas sin categorías todavía, se cargan por
  primera vez con este seed.
- Liga de Verano 2024/2025: no existía como torneo en el selector multi-temporada; se crea con este
  seed (`season = 2024`, `status = 'finished'`). En Damas B, Caballeros A y Caballeros B había un
  4° puesto en la planilla original que no se carga (la vista pública es solo top 3).
- Liga de Invierno 2026: ya tenía categorías con fixture real (torneo activo durante la temporada).
  El podio manual es solo respaldo — `getPodiumForCategory` siempre prioriza la serie "final"/
  "third_place" digitalizada si existe. Se marcó `status = 'finished'` (el organizador confirmó que
  ya se jugaron todas las finales).

---

## Resueltas — Circuito del Parque

Relevadas con el organizador el 2026-09-07 (cuestionario C0, `plan-liga-multitemporada-y-circuito.md` §10).
Volcadas en `reglas-circuito-del-parque.md` (canónico).

### ~~OQ-23~~: Lista definitiva de categorías 2026 (+ draw_size/tipo)

**Respuesta**: 14 categorías — Single: Caballeros Primera/Intermedia/Segunda/Tercera/+50, Damas
Primera/Segunda. Dobles: Caballeros Primera/Intermedia/Segunda, Damas Primera/Segunda, Mixto
Intermedia/Segunda. `draw_size` no es fijo (varía mes a mes según inscriptos); mínimo 4 inscriptos
para que la categoría se juegue ese mes.

---

### ~~OQ-27~~: Reparto de byes / formato según cantidad de inscriptos (núcleo del motor)

**Respuesta**: N=4 round robin+final; N=5 round robin puro sin final (campeón=1° de zona);
N=6-7 dos zonas→semis→final (sin 3er puesto); N≥8 eliminación simple con byes a potencia de 2
(mejor ranking), perdedores de 1ª ronda a repechaje aparte. Detalle completo en
`reglas-circuito-del-parque.md`.

---

### ~~OQ-26~~: Seeding

**Respuesta**: Ranking vigente del circuito (año en curso). Si no hay ranking del año en curso
aún, usa el ranking final del año anterior. Excepción única: primer torneo de 2026 (sin ranking
formal previo) → lo arma la coordinadora a mano.

---

### ~~OQ-28~~: Repechaje — quiénes entran y formato

**Respuesta**: Solo perdedores de 1ª ronda (solo aplica con eliminación simple, 8+). Eliminación
directa, byes con mismo criterio que el cuadro principal. Campeón propio, no reingresa al cuadro
principal.

---

### ~~OQ-29~~: Formato de partido del circuito mensual

**Respuesta**: Mejor de 3 sets. Tercer set = supertiebreak registrado como `7-6` fijo, **excepto
en la final** de cada categoría, que juega el tercer set completo con score real.

---

### ~~OQ-30~~: ¿Hay walkover en el circuito mensual?

**Respuesta**: Sí. Se registra `6-0 6-0` (igual que Liga/Mid Master). El ganador por WO recibe
los mismos puntos de ranking que una victoria jugada.

---

### ~~OQ-31~~: ¿Ganar el repechaje da puntos? ¿Qué escala de puntos por instancia?

**Respuesta**: El repechaje **no otorga puntos**. Escala por instancia (dos tablas, ver OQ-anexo
Grand Slam): Campeón / Subcampeón / Semifinal / Cuartos / Octavos / 16vos o más.

---

### ~~OQ-32~~: Ranking — ¿suma todo o mejores N?

**Respuesta**: Suma **todos** los torneos jugados en el año. No se descartan resultados.

---

### ~~OQ-33~~: ¿Mínimo de torneos para ranking / Final Master?

**Respuesta**: No hay mínimo.

---

### ~~OQ-34~~: Cupos por categoría a Final Master

**Respuesta**: 8 clasificados por categoría (los mejores del ranking anual).

---

### ~~OQ-22~~: ¿Mid Master conserva nombre? ¿Sus resultados puntúan al ranking anual?

**Respuesta**: Conserva el nombre "Mid Master". Ni Mid Master ni Final Master suman puntos al
ranking anual del circuito mensual — son independientes.

---

### ~~OQ (nueva — meses Grand Slam)~~: ¿Qué torneos del año son "Grand Slam" (escala de puntos mayor)?

**Respuesta**: Enero, Mayo, Julio, Septiembre. El resto de los meses usan la escala "normal".
Ver tabla completa de puntos en `reglas-circuito-del-parque.md`.

---

### ~~OQ (nueva — Challonge scores_csv)~~: ¿Challonge expone detalle set por set?

**Respuesta**: No verificado aún — se confirma en el Sprint C7 (import) antes de programar el
import definitivo. Si no expone `scores_csv`, se define ahí un desempate alternativo solo para
datos importados (no se infiere ahora).

---

## Resueltas — Mid Master

### ~~MM-01~~: ¿Cuántos sets gana un partido?

**Respuesta**: Al mejor de 3 sets. El tercero es supertiebreak, salvo en la **final** que se juega a 3 sets completos.

---

### ~~MM-02~~: ¿Cómo se anota el tercer set?

**Respuesta**: Siempre como `7-6`, igual que Liga de Invierno.

---

### ~~MM-03~~: ¿Cuáles son los criterios de desempate dentro de una zona?

**Respuesta**:
```
1. Partidos ganados (wins)
2. Diferencia de sets (sets_diff)
3. Diferencia de games (games_diff)
4. Enfrentamiento directo H2H
```

---

### ~~MM-04~~: ¿Hay walkover?

**Respuesta**: No. El Mid Master no contempla walkover.

---

### ~~MM-05~~: ¿Se necesita página pública de jugador individual?

**Respuesta**: No. Solo existe la página de categoría con zonas y bracket.

---

## Resueltas

### ~~OQ-01~~: ¿Cuál categoría tiene 5 equipos?

**Respuesta**: **Mixto B** tiene 5 equipos. El resto de las categorías tienen 6.

---

### ~~OQ-03~~: ¿Cómo funciona el desempate por enfrentamiento directo?

**Respuesta**: Se arma una mini-tabla solo con los equipos empatados, usando únicamente los resultados de los partidos entre ellos. Criterios dentro de la mini-tabla:

```
5a. Puntos en enfrentamientos directos
5b. Diferencia de canchas en enfrentamientos directos
5c. Diferencia de sets en enfrentamientos directos
5d. Diferencia de games en enfrentamientos directos
```

Para 2 equipos: se comparan las 2 series entre ellos (ida y vuelta).
Para 3 o más: mini-tabla entre el subconjunto completo.

**Nota de implementación**: Se agregó "puntos" como primer criterio H2H (Sprint 6b) — es el criterio estándar de mini-tabla que permite ordenar cuando un equipo ganó más series directas. Los criterios de diferencias (5b–5d) aplican cuando los puntos H2H están empatados.

**Residual**: ver OQ-03b para el caso de empate aun después de 5d.

---

### ~~OQ-04~~: ¿El score del tercer set puede ser distinto de "7-6"?

**Respuesta**: No. El tercer set **siempre se registra como `7-6`**, independientemente del resultado real del supertiebreak. `parseScore` debe aceptar y esperar ese valor fijo para el tercer set.

---

### ~~OQ-05~~: ¿Puede haber WO de cancha en más de una cancha de la misma serie?

**Respuesta**: No. El WO de cancha es siempre de **exactamente 1 cancha**. Un equipo no puede presentar solo 1 cancha con jugadores — el mínimo es 2.

| Canchas con jugadores | Canchas en WO | Clasificación |
|-----------------------|---------------|---------------|
| 3 | 0 | Serie normal |
| 2 | 1 | WO de cancha individual |
| 1 | 2 | WO general |
| 0 | 3 | WO general |

---

### ~~OQ-07~~: ¿Los playoffs son por categoría o cruzados?

**Respuesta**: Cada categoría tiene sus **propios playoffs independientes**. No hay final general entre categorías.

---

### ~~OQ-16~~: ¿`standings_snapshot` necesita historial o solo el estado actual?

**Respuesta**: Solo el **estado actual**. No se necesita historial por fecha. El snapshot siempre refleja la tabla vigente y se sobreescribe en cada recálculo.
