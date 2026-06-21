# Reglas deportivas — Liga de Invierno

> Fuente: PRD secciones 9, 10, 11.
> No inferir reglas no documentadas. Todo gap va a `/product/open-questions.md`.

---

## Categorías

El torneo tiene 6 categorías:

| Slug | Nombre |
|------|--------|
| `caballeros-a` | Caballeros A |
| `caballeros-b` | Caballeros B |
| `damas-a` | Damas A |
| `damas-b` | Damas B |
| `mixto-a` | Mixto A |
| `mixto-b` | Mixto B |

A y B cuentan como categorías diferentes a todos los efectos.

---

## Cantidad de equipos

- La mayoría de las categorías tienen **6 equipos**.
- **Mixto B** tiene **5 equipos**.
- El sistema no debe asumir que todas las categorías tienen la misma cantidad de equipos.

---

## Formato de fase regular

- Todos contra todos, **ida y vuelta**.
- Cada equipo juega **dos veces** contra cada rival (ambas en Parque Tenis Club).
- Todos los partidos se juegan en Parque Tenis Club.

---

## Serie


Una serie es el enfrentamiento entre dos equipos en una fecha.

Cada serie se compone de **3 canchas de dobles**:

```
Cancha 1
Cancha 2
Cancha 3
```

**Gana la serie** el equipo que gane **2 de las 3 canchas**.

Ejemplo:
```
Equipo A vs Equipo B

Cancha 1: gana Equipo A
Cancha 2: gana Equipo B
Cancha 3: gana Equipo A

Resultado: Equipo A gana la serie 2-1
```

---

## Sistema de puntos

| Resultado | Puntos |
|-----------|--------|
| Serie ganada | 2 puntos |
| Serie perdida | 1 punto |
| WO general (equipo ausente) | 0 puntos |

Los puntos se aplican a la **serie**, no a cada cancha individual.

El equipo ganador en un WO general recibe 2 puntos (ver sección WO general).

---

## Resultados de canchas

Los scores se cargan con **sets completos**.

El tercer set, aunque en la realidad se juegue como supertiebreak, se registra siempre como:

```
7-6
```

Ejemplo de score completo:
```
6-4 3-6 7-6
```

---

## WO general

Ocurre cuando un equipo **no se presenta a la serie completa**.

### Computa para el equipo ganador:

| Estadística | Valor |
|-------------|-------|
| Puntos | +2 |
| Canchas ganadas | +3 |
| Canchas perdidas | +0 |
| Sets ganados | +6 |
| Sets perdidos | +0 |
| Games ganados | +36 |
| Games perdidos | +0 |

### Computa para el equipo perdedor (ausente):

| Estadística | Valor |
|-------------|-------|
| Puntos | +0 |
| Canchas ganadas | +0 |
| Canchas perdidas | +3 |
| Sets ganados | +0 |
| Sets perdidos | +6 |
| Games ganados | +0 |
| Games perdidos | +36 |

En la base de datos: `series.is_general_walkover = true`.

---

## WO de cancha individual

Ocurre cuando un equipo **no presenta pareja para exactamente una cancha**, pero sí se presenta con jugadores en las otras dos.

- **No cuenta como WO general.**
- Esa cancha se carga como: `6-0 6-0` con `is_court_walkover = true`.
- La serie continúa normalmente con las otras dos canchas.

### Regla de presentación mínima

Un equipo **debe presentar pareja para al menos 2 canchas**. No puede presentar jugadores en solo 1 cancha.

| Canchas con jugadores | Canchas en WO | Clasificación |
|-----------------------|---------------|---------------|
| 3 | 0 | Serie normal |
| 2 | 1 | WO de cancha individual |
| 1 | 2 | WO general |
| 0 | 3 | WO general |

En la base de datos: `court_matches.is_court_walkover = true` (solo para esa cancha).

---

## Desempate en tabla de posiciones

Orden estricto de desempate:

```
1. Puntos
2. Diferencia de canchas ganadas (canchas_ganadas - canchas_perdidas)
3. Diferencia de sets (sets_ganados - sets_perdidos)
4. Diferencia de games (games_ganados - games_perdidos)
5. Enfrentamiento directo (ver detalle abajo)
```

### Detalle del desempate por enfrentamiento directo

Si dos o más equipos quedan igualados después de los criterios 1–4, se arma una **mini-tabla solo con los equipos empatados**, considerando únicamente los resultados de los partidos entre ellos.

Dentro de esa mini-tabla se aplica el mismo orden de criterios:

```
5a. Diferencia de canchas en enfrentamientos directos
5b. Diferencia de sets en enfrentamientos directos
5c. Diferencia de games en enfrentamientos directos
```

Si al aplicar 5a–5c sigue el empate, queda sin resolver (pendiente definición de criterio final — ver OQ-03 actualizado).

**Para 2 equipos empatados**: se comparan solo las 2 series jugadas entre ellos (ida y vuelta).

**Para 3 o más equipos empatados**: se arma la mini-tabla con todos los partidos entre ese subconjunto de equipos, y se aplican los criterios 5a–5c.

---

## Jugadores

- Cada equipo tiene una **lista de buena fe** con entre 12 y 15 jugadores.
- Cada fecha los jugadores pueden formar **parejas distintas** (no hay parejas fijas).
- Un jugador puede estar en **más de un equipo** siempre que sean categorías diferentes.
- Un jugador **no puede estar** en dos equipos de la misma categoría.

### Datos visibles públicamente:
```
nombre del jugador
nombre del capitán
```

### Datos NO visibles públicamente:
```
teléfono
cualquier dato de contacto personal
```

---

## Reprogramaciones

Cuando se reprograma una serie (ej: por lluvia):

```
status = "rescheduled"
rescheduled_reason = "Reprogramado por lluvia"
scheduled_date = nueva fecha
scheduled_time = nuevo horario
original_scheduled_date = fecha original
original_scheduled_time = horario original
```

La vista pública muestra la **fecha actualizada** con una etiqueta:
```
Reprogramado por lluvia
```

---

## Playoffs (fase futura — no implementar en MVP)

Brackets base de 8 equipos:
```
1 vs 8
2 vs 7
3 vs 6
4 vs 5
```

Si hay menos de 8 equipos se usan byes. Los byes los reciben los mejor posicionados.

Ejemplo con 6 equipos:
```
Bye para 1°
Bye para 2°
```

**En el MVP:**
- No implementar generación automática de playoffs.
- No implementar asignación automática de byes.
- El modelo de datos debe permitir cargar cruces manualmente en el futuro.
