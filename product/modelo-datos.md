# Modelo de datos — Parque Tenis Club Web

> Fuente: PRD sección 12.
> Base de datos: Supabase Postgres.

---

## Diagrama de relaciones

```
tournaments
  └── categories (tournament_id)
        └── teams (category_id)
        │     └── team_players (team_id) ──► players
        └── rounds (category_id)
              └── series (round_id, category_id, home_team_id, away_team_id)
                    └── court_matches (series_id)
        └── standings_snapshot (category_id, team_id)
```

---

## tournaments

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| name | text | Ej: "Liga de Invierno" |
| slug | text unique | Ej: "liga-invierno" |
| season | integer | Ej: 2026 |
| status | text | `active`, `finished` |
| description | text nullable | |
| start_date | date nullable | |
| end_date | date nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## categories

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| tournament_id | uuid FK → tournaments | |
| name | text | Ej: "Caballeros A" |
| slug unique| text | Ej: "caballeros-a" |
| phase_format | text | Ej: "round_robin" |
| regular_phase_type | text | Ej: "home_away" (ida y vuelta) |
| teams_count | integer | 5 o 6 según categoría |
| direct_semifinalists_count | integer nullable | Para playoffs futuros |
| quarterfinals_enabled | boolean | Para playoffs futuros |
| sort_order | integer | Orden de visualización |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Valores definidos:

| slug | name |
|------|------|
| caballeros-a | Caballeros A |
| caballeros-b | Caballeros B |
| damas-a | Damas A |
| damas-b | Damas B |
| mixto-a | Mixto A |
| mixto-b | Mixto B |

---

## teams

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| category_id | uuid FK → categories | |
| name | text | Nombre del equipo |
| slug | text | URL-friendly |
| captain_name | text nullable | Nombre visible públicamente |
| notes | text nullable | Uso interno |
| active | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**No guardar teléfono en esta tabla.**

---

## players

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| first_name | text | |
| last_name | text | |
| display_name | text | Nombre a mostrar públicamente |
| active | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**No guardar teléfono. No guardar datos de contacto.**

---

## team_players

Tabla de unión que permite que un jugador pertenezca a distintos equipos (en categorías diferentes).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| team_id | uuid FK → teams | |
| player_id | uuid FK → players | |
| is_captain | boolean | Default false |
| active | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Restricción: un jugador no puede estar activo en dos equipos de la misma categoría. Esta restricción se valida desde la lógica de aplicación o mediante trigger, porque category_id se obtiene desde teams.

---

## rounds

Representa una fecha del torneo dentro de una categoría.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| category_id | uuid FK → categories | |
| phase | text | `regular`, `quarterfinal`, `semifinal`, `final` |
| round_number | integer | Número de fecha (1, 2, 3...) |
| name | text | Ej: "Fecha 1" |
| scheduled_date | date nullable | Fecha planificada de la ronda |
| status | text | `scheduled`, `completed`, `cancelled` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## series

Representa el enfrentamiento entre dos equipos en una fecha.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| round_id | uuid FK → rounds | |
| category_id | uuid FK → categories | Desnormalizado para queries directas |
| home_team_id | uuid FK → teams | |
| away_team_id | uuid FK → teams | |
| scheduled_date | date nullable | Fecha de juego (puede ser reprogramada) |
| scheduled_time | time nullable | Hora de juego |
| original_scheduled_date | date nullable | Fecha original si fue reprogramada |
| original_scheduled_time | time nullable | Hora original si fue reprogramada |
| rescheduled_reason | text nullable | Ej: "Reprogramado por lluvia" |
| status | text | Ver estados posibles abajo |
| is_general_walkover | boolean | Default false |
| walkover_winner_team_id | uuid FK → teams nullable | Equipo ganador del WO general |
| winner_team_id | uuid FK → teams nullable | Ganador de la serie |
| home_courts_won | integer nullable | Canchas ganadas por local |
| away_courts_won | integer nullable | Canchas ganadas por visitante |
| notes | text nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Estados posibles de series.status

| Status | Descripción |
|--------|-------------|
| `scheduled` | Programada, sin jugar |
| `rescheduled` | Reprogramada (nueva fecha asignada) |
| `in_progress` | En curso (uso futuro) |
| `completed` | Jugada con resultado cargado |
| `walkover` | WO general |
| `cancelled` | Cancelada |

---

## court_matches

Representa el resultado de una cancha individual dentro de una serie.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| series_id unique| uuid FK → series | |
| court_number unique| integer | 1, 2 o 3 |
| home_player_1_id | uuid FK → players nullable | |
| home_player_2_id | uuid FK → players nullable | |
| away_player_1_id | uuid FK → players nullable | |
| away_player_2_id | uuid FK → players nullable | |
| score | text nullable | Ej: "6-4 3-6 7-6" |
| winner_team_id | uuid FK → teams nullable | |
| is_court_walkover | boolean | Default false |
| home_sets_won | integer nullable | |
| away_sets_won | integer nullable | |
| home_games_won | integer nullable | |
| away_games_won | integer nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### Formato del campo `score`

- Sets separados por espacio.
- Cada set como `games_local-games_visitante`.
- Ejemplo 2 sets: `"6-4 6-2"`
- Ejemplo 3 sets: `"6-4 3-6 7-6"`
- WO de cancha: `"6-0 6-0"` con `is_court_walkover = true`
- El tercer set (supertiebreak) siempre se registra como `7-6`.

---

## standings_snapshot

Tabla de posiciones calculada y guardada como snapshot para consulta rápida.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| category_id | uuid FK → categories | |
| team_id | uuid FK → teams | |
| played | integer | Series jugadas |
| won | integer | Series ganadas |
| lost | integer | Series perdidas |
| points | integer | Puntos acumulados |
| courts_won | integer | Total canchas ganadas |
| courts_lost | integer | Total canchas perdidas |
| courts_diff | integer | Diferencia de canchas |
| sets_won | integer | Total sets ganados |
| sets_lost | integer | Total sets perdidos |
| sets_diff | integer | Diferencia de sets |
| games_won | integer | Total games ganados |
| games_lost | integer | Total games perdidos |
| games_diff | integer | Diferencia de games |
| position | integer | Posición en la tabla |
| updated_at | timestamptz | |

La tabla puede calcularse en vivo desde los resultados, pero este snapshot permite consultas rápidas.

**Regla de negocio**: cada vez que se carga o edita un resultado, recalcular los standings completos de esa categoría y actualizar este snapshot.

**No se permite edición manual de puntos.**

---

## Notas sobre el modelo

- `category_id` está desnormalizado en `series` para facilitar queries directas sin join a `rounds`.
- Los campos `_diff` en `standings_snapshot` son calculados (`courts_won - courts_lost`, etc.) y pueden mantenerse como columnas computadas o actualizarse en cada recálculo.
- `standings_snapshot` tiene una entrada por equipo por categoría (no por ronda).
- El cálculo de desempate por enfrentamiento directo requiere acceder a la tabla `series` en el momento del sort, no se persiste en el snapshot.
