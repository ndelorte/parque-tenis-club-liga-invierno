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

## Playoffs (Sprint 12)

### Formato del cuadro con 6 equipos

El cuadro base es de 8 lugares. Con 6 equipos reales:

- **1°** → bye directo a semifinal
- **2°** → bye directo a semifinal
- **CF1**: 3° vs 6° → ganador juega semifinal contra 1°
- **CF2**: 4° vs 5° → ganador juega semifinal contra 2°

```
1° — BYE — Semifinal
         ↑
CF1: 3° vs 6°

CF2: 4° vs 5°
         ↓
2° — BYE — Semifinal
```

### Reglas de playoffs

- Los partidos de cuartos, semifinal y final siguen la misma lógica que la fase regular: **3 canchas, gana 2 de 3**.
- Los resultados de playoffs **no modifican** la tabla de posiciones de fase regular.
- Los playoffs usan las mismas tablas `rounds` (phase ≠ "regular"), `series` y `court_matches`.
- El bracket provisorio se calcula desde los standings actuales de la fase regular.
- La visualización pública es siempre "provisoria" hasta que la fase regular esté completa.

### Vista pública

- Se muestra en cada página de categoría, debajo de la tabla de posiciones.
- Título: **"Fase Final"**, subtítulo: *"Con las posiciones actuales provisorias"*.
- Si hay fecha cargada por admin → se muestra.
- Si no hay fecha → se muestra *"Fecha a confirmar"*.

### Administración

- Desde el panel admin → tab **"Playoffs"**.
- Por cada categoría con ≥ 6 equipos se puede:
  - Ver el bracket provisorio.
  - Crear partidos de cuartos (crea round + series en la DB).
  - Cargar o editar fecha y hora.
  - Cargar resultado con detalle de 3 canchas (igual que fase regular).
- Semifinal y final se crean cuando se conozcan los ganadores de cuartos.
