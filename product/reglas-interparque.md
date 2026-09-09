# Reglas — Interparque

> Modalidad de partidos de single exclusiva para alumnos del club.
> Completamente independiente de Liga de Invierno, Mid Master y Circuito del Parque.
> Fuente: 3 flyers oficiales del club ("INTERPARQUE — Cada game suma") + Google
> Sheet provisorio del organizador. Fuente de verdad para toda lógica deportiva
> del módulo Interparque.

---

## Qué es

Formato nuevo, exclusivo para alumnos del club, pensado para poner en práctica
en el juego lo que se viene entrenando. Propone una serie de partidos de
single entre alumnos, divididos en **dos niveles** que juegan con rivales
diferentes — cada uno suma puntos partido a partido. Los niveles son por
categoría y **mezclan varones y mujeres**.

**Estado actual (implementación inicial)**: una sola tabla general, sin
separación por niveles todavía (ver OQ-IP-03 en `open-questions.md`).

---

## Duración y calendario

- Desde el primer domingo de septiembre hasta el último domingo de octubre.
- No es obligatorio jugar todas las fechas — cuantas más se juegan, más
  oportunidad de sumar puntos.
- Hay fecha todos los domingos, en horario a convenir.
- Antes de empezar el torneo se arma una grilla con todos los jugadores;
  cada semana se programa el horario de cada partido.

---

## Formato de partido

- Al mejor de 3 sets.
- El tercer set, si llega (sets 1-1), es un **super tie-break** — a
  diferencia de Liga Invierno y Mid Master, acá el super tie-break **no**
  tiene un score fijo: se juega hasta que alguien llega a 10+ puntos con 2
  de diferencia (ej. `10-8`, `11-9`, `12-10`). El score se registra tal cual
  se jugó.

---

## Puntaje

Confirmado con el club a partir de 3 de los 4 partidos reales de la Fecha 1
del Sheet provisorio (los que no fueron a super tie-break cierran exacto con
esta fórmula):

1. Cada jugador suma **1 punto por cada game ganado**, contando solo los
   games del set 1 y el set 2 (el super tie-break del set 3 **no** cuenta
   como games).
2. El **ganador del partido** suma **3 puntos bonus**.
3. Si hubo super tie-break, el **ganador del super tie-break** suma
   **1 punto bonus extra**.

**Ejemplo** (del flyer): partido 6-2 6-3 → el ganador suma 15 puntos
(12 games + 3 de bonus), el rival suma 5 (solo games).

**Ejemplo con super tie-break**: partido 6-2 / 6-7 / 10-8 → el ganador del
super tie-break suma 16 puntos (12 games de los sets 1-2 + 3 por ganar el
partido + 1 por ganar el super TB), el rival suma 9 (solo games).

> Nota: el Sheet provisorio del club tiene una fila (Fecha 1, el único
> partido con super tie-break) que no cierra exacto con esta fórmula
> (17/8 en el Sheet vs 16/9 según la fórmula). El club confirmó la fórmula
> de arriba como la correcta; esa fila puntual del Sheet se considera un
> error de carga manual, no un caso especial de la regla.

---

## Costo

$12.000 por partido. Incluye cancha y pelotas. (No se gestiona pago desde la
web — solo informativo en la sección de reglas.)

---

## Tabla de posiciones

Se calcula en vivo a partir de los partidos `completed` — nunca se persiste
un snapshot ni se edita a mano (ver ADR-006). Columnas: jugador, partidos
jugados, puntos.

**Desempate**: no definido por el club todavía (ver OQ-IP-01). Implementación
actual: a igualdad de puntos, orden alfabético por nombre (estable, sin
significado deportivo).

---

## Premio

El ganador de cada categoría se lleva entrenamiento sin cargo en el grupo de
adultos, dos veces por semana durante el mes de noviembre.

---

## Walkover / ausencias

**No definido.** Los flyers no mencionan qué pasa si un jugador no se
presenta. No implementar nada al respecto hasta tener respuesta — ver
OQ-IP-02.

---

## Participantes

- Un jugador por participante (single).
- Jugadores **propios de Interparque** — a diferencia de Mid Master y
  Circuito del Parque, acá **no** se comparte la tabla `players` de Liga de
  Invierno (decisión explícita del club: la población de alumnos de
  Interparque no se mezcla con la de otras áreas). Ver ADR-006.
- Se cargan con nombre y apellido desde el panel admin, y quedan disponibles
  para cargarles partidos durante toda la competencia.

---

## Vistas públicas

| Ruta | Contenido |
|------|-----------|
| `/interparque` | Reglas, tabla de posiciones y partidos jugados (una sola página) |

---

## Notas de implementación

- No reutiliza `lib/tournament/parseScore.ts` (Liga) ni `lib/mid-master/parseMmScore.ts`
  — ambos fuerzan el tercer set a un score fijo (`7-6`), e Interparque tiene
  un super tie-break de score variable. Parser propio en
  `lib/interparque/parseInterparqueScore.ts`.
- Toda lógica deportiva propia en `lib/interparque/`.
- Tablas Supabase con prefijo `interparque_` (`interparque_players`,
  `interparque_matches`) — aislamiento total, incluyendo jugadores propios.
- Panel admin en `/panel-interparque/` — mismo Supabase Auth que
  `/panel-parque/` y `/panel-master/`.
