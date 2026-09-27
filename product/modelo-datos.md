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
| slug | text unique | Ej: "liga-invierno-2026" |
| season | integer | Ej: 2026 |
| status | text | `active`, `finished`, `upcoming` (Sprint L1 — selector multi-temporada) |
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
| slug | text | Ej: "caballeros-a". Único por torneo — `unique (tournament_id, slug)` (Sprint L1: el mismo slug puede repetirse en 2 ediciones distintas) |
| phase_format | text | Ej: "round_robin" |
| regular_phase_type | text | Ej: "home_away" (ida y vuelta) |
| teams_count | integer | 5 o 6 según categoría |
| direct_semifinalists_count | integer nullable | Para playoffs futuros |
| quarterfinals_enabled | boolean | Para playoffs futuros |
| sort_order | integer | Orden de visualización |
| manual_champion_name | text nullable | Podio cargado a mano (Sprint L7). Fallback de `getPodiumForCategory` cuando no hay serie "final" digitalizada — ediciones históricas sin fixture completo |
| manual_runner_up_name | text nullable | Ídem, subcampeón |
| manual_third_place_name | text nullable | Ídem, tercer puesto (serie "third_place") |
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

---

## Interparque

Módulo aislado (ver ADR-006) — jugadores y partidos propios, sin relación
con `players`/`teams` de Liga Invierno. Standings calculados en vivo desde
`interparque_matches`, sin snapshot.

### interparque_players

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| first_name | text | |
| last_name | text | |
| active | boolean | Default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### interparque_matches

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| player_a_id | uuid FK → interparque_players | |
| player_b_id | uuid FK → interparque_players | |
| match_date | date nullable | |
| score | text nullable | Ej: `"6-2 6-7 10-8"` — 2 sets + super tie-break opcional de score variable |
| status | text | `scheduled`, `completed` |
| winner_player_id | uuid FK → interparque_players nullable | |
| games_a | integer | Games de jugador A en sets 1-2 (sin contar el super TB) |
| games_b | integer | Games de jugador B en sets 1-2 |
| points_a | integer | Puntos calculados de jugador A (ver `reglas-interparque.md`) |
| points_b | integer | Puntos calculados de jugador B |
| notes | text nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

`games_*`/`points_*`/`winner_player_id` se calculan una única vez al cargar
el score (`lib/interparque/calculateInterparqueMatchResult.ts`) y se
guardan en la fila — nunca se editan a mano. La tabla de posiciones pública
se arma sumando estas columnas en vivo sobre los partidos `completed`
(`lib/interparque/calculateInterparqueStandings.ts`), sin tabla de
snapshot.

---

## Playoffs (Sprint 12)

No se crearon tablas nuevas. Los playoffs reutilizan el modelo existente:

| Tabla | Uso en playoffs |
|-------|----------------|
| `rounds` | `phase = "quarterfinal" \| "semifinal" \| "final"`. Los cuartos usan `round_number = 100`. |
| `series` | Igual que fase regular. `home_team_id` y `away_team_id` son los equipos del cruce. |
| `court_matches` | Igual que fase regular. 3 canchas por partido. |
| `standings_snapshot` | **No se modifica** por resultados de playoffs. Solo refleja fase regular. |

### Convenciones para rounds de playoffs

| phase | round_number | name |
|-------|-------------|------|
| `quarterfinal` | 100 | "Cuartos de Final" |
| `semifinal` | 101 | "Semifinal" |
| `final` | 102 | "Final" |

### Bracket provisorio

Se calcula en runtime desde `standings_snapshot` (no se persiste). La lógica está en `lib/playoffs/generateProvisionalBracket.ts`.

---

## tournament_photos (Sprint L6)

Galería pública de fotos de premiación por edición/categoría. Storage: bucket `premiaciones` en
Supabase Storage, **público de solo lectura** (fotos promocionales, no es dato sensible según
CLAUDE.md — esa regla aplica a teléfonos/contacto).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| tournament_id | uuid FK → tournaments | |
| category_id | uuid FK → categories, nullable | `null` = foto general de la edición |
| storage_path | text | Path dentro del bucket `premiaciones` (`{tournament_id}/{uuid}.{ext}`) |
| caption | text nullable | |
| sort_order | int | Orden dentro del grupo (mismo `tournament_id` + `category_id`) |
| created_at | timestamptz | |

**Único escritor**: `lib/data/tournament-photos.ts` (`addPhoto`, `deletePhoto`, `reorderPhotos`),
llamado desde las server actions de `app/actions/admin.ts` (verifican `isAdminUser`). Las subidas
usan el admin client (service role) para el insert y para `storage.from("premiaciones").upload(...)`.

---

## Circuito del Parque (Sprint C3)

Módulo aislado (ver ADR-002/ADR-005) — torneos mensuales del circuito, prefijo `circuito_`,
tipado en `lib/supabase/types.ts` desde el día 1 (no repetir el patrón `any` de `mid_master_*`).
Reglas deportivas: `reglas-circuito-del-parque.md`. `players` es el único dato compartido con
Liga/Mid Master (ADR-002). Todavía sin UI ni motor de cuadros (Sprint C4) ni recálculo de ranking
(Sprint C5) — este sprint solo crea el esquema.

### circuito_editions

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| slug | text, único | |
| name | text | Ej: "Roland Garros" |
| month | int | 1-12. Enero/Mayo/Julio/Septiembre son "Grand Slam" (ver reglas) |
| year | int | |
| status | text | `upcoming`, `active`, `finished` |
| created_at | timestamptz | |

### circuito_categories

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| edition_id | uuid FK → circuito_editions | |
| name | text | Una de las 14 categorías fijas (ver reglas) |
| slug | text | Único por `edition_id` |
| type | text | `single`, `dobles` |
| draw_size | int nullable | Cantidad de inscriptos ese mes — **no es fijo**, varía mes a mes; `null` hasta que cierran inscripciones |
| sort_order | int | |
| created_at / updated_at | timestamptz | |

### circuito_participants

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| category_id | uuid FK → circuito_categories | |
| player_id | uuid FK → players, nullable | `null` en participantes importados de Challonge sin reconciliar todavía (Sprint C7) |
| player_2_id | uuid FK → players, nullable | Pareja, solo en categorías `dobles` |
| display_name | text | Nombre a mostrar; guarda el nombre crudo del import cuando `player_id` es `null` |
| seed | int nullable | Cabeza de serie (ver reglas: ranking vigente / manual en el primer torneo 2026) |
| created_at / updated_at | timestamptz | |

### circuito_matches

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| category_id | uuid FK → circuito_categories | |
| bracket | text | `main`, `repechaje` — el repechaje es un cuadro aparte, solo existe con 8+ inscriptos |
| round_number | int | Ronda dentro de su `bracket` |
| position | int | Índice 0-based dentro de `(category_id, bracket, round_number)` — sin esto no hay forma determinística de saber a qué partido de la ronda siguiente avanza el ganador (Sprint C5, migración 009) |
| zone | text nullable | `A` / `B` — solo en los partidos de zona del formato 6-7 inscriptos (`groups_then_knockout`) |
| participant_a_id / participant_b_id | uuid FK → circuito_participants, nullable | `null` hasta que el motor de cuadros (C4) o un resultado previo define quién juega |
| score | text nullable | Tercer set `7-6` fijo salvo en la final (score real); WO se registra `6-0 6-0` |
| winner_id | uuid FK → circuito_participants, nullable | |
| is_walkover | boolean | Default `false` |
| status | text | `pending`, `scheduled`, `played`, `walkover` |
| scheduled_date / scheduled_time | date / time, nullable | |
| created_at / updated_at | timestamptz | |

Un bye (participante único, `participant_b_id = null` con `participant_a_id` definido) no
necesita carga de resultado — `lib/data/circuito/bracket.ts` lo avanza solo a la ronda
siguiente al generar el cuadro.

### circuito_ranking_points

Snapshot recalculado — **nunca se edita a mano** (mismo criterio que `standings_snapshot`).
Único punto de escritura real: `lib/data/circuito/ranking.ts`
(`upsertCircuitoRankingPoints`/`recalculateAndPersistCircuitRanking`), reforzado por
`lib/data/__tests__/circuito-ranking-write-boundary.test.ts` (Sprint C5). Un participante de
dobles acredita los mismos puntos a sus 2 jugadores (el ranking es por `player_id`, no por pareja).
El import histórico 2026 (Sprint C7, `scripts/import-circuito-ranking-sheet.ts`) también pasa por
`upsertCircuitoRankingPoints`, calculando los puntos desde una planilla externa en vez de
`circuito_matches` — ver `reglas-circuito-del-parque.md`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid PK | |
| player_id | uuid FK → players | |
| category_id | uuid FK → circuito_categories | |
| edition_id | uuid FK → circuito_editions | |
| points | int | Ver escala Grand Slam / normal en `reglas-circuito-del-parque.md` |
| computed_at | timestamptz | |

Unicidad: `(player_id, category_id, edition_id)` — un jugador tiene un único puntaje por
categoría y edición.
