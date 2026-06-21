# PRD — Web Parque Tenis Club + Liga de Invierno

## 1. Nombre del proyecto

**Parque Tenis Club Web**

## 2. Objetivo general

Crear una aplicación web real para **Parque Tenis Club**, con dos objetivos principales:

1. Tener una **landing page institucional** que muestre de forma clara, moderna y visual las actividades del club.
2. Tener una sección pública especial para la **Liga de Invierno**, torneo por equipos, donde los jugadores puedan consultar:

   * fixture,
   * equipos,
   * jugadores,
   * tabla de posiciones,
   * resultados anteriores,
   * detalle de cada cancha,
   * historial de cada equipo,
   * próximas fechas.

Además, debe existir un **panel admin privado** para que los organizadores puedan cargar y editar datos del torneo.

---

## 3. Contexto del negocio

Parque Tenis Club es un club de tenis ubicado en Argentina. La web debe funcionar como herramienta comercial e informativa.

La landing institucional debe transmitir:

* actividad deportiva,
* club activo,
* competencia,
* entrenamiento,
* escuela de tenis,
* torneos,
* alquiler de canchas,
* contacto rápido por WhatsApp.

La estética buscada es **deportiva moderna**, con mucha imagen real del club, textos cortos y contundentes, y colores basados en el logo: **verde y naranja**.

La sección de Liga de Invierno es el motivo principal del desarrollo. Debe ser funcional, clara y fácil de consultar desde celular.

---

## 4. Stack técnico recomendado

Usar:

* Next.js
* TypeScript
* App Router
* Tailwind CSS
* shadcn/ui
* Supabase
* Supabase Auth
* Supabase Postgres
* Vercel
* Vitest o Jest para tests de lógica
* React Hook Form
* Zod

No usar:

* backend Express separado,
* MongoDB,
* Webflow,
* Wix,
* Framer,
* lógica de tabla cargada manualmente.

La tabla de posiciones debe salir de los resultados cargados.

---

## 5. Principios de desarrollo

### 5.1 No inferir reglas deportivas

Si falta una regla, no inventarla. Crear o actualizar:

```txt
/product/open-questions.md
```

### 5.2 Separar lógica de UI

La lógica del torneo debe vivir en:

```txt
/lib/tournament
```

La UI solo debe consumir datos ya calculados.

### 5.3 Tests obligatorios para lógica deportiva

Toda lógica de tabla, resultados, WO, scores y desempates debe tener tests.

### 5.4 Mobile first

La mayoría de usuarios va a entrar desde WhatsApp o Instagram. La experiencia mobile es prioritaria.

### 5.5 Admin privado no visible

El home público no debe mostrar link al admin.

El admin vive en:

```txt
/admin/login
```

---

## 6. Usuarios del sistema

### 6.1 Usuario público

Puede ver:

* landing del club,
* información de actividades,
* contacto,
* sección Liga de Invierno,
* categorías,
* equipos,
* jugadores,
* fixture,
* tabla,
* resultados,
* detalle de canchas,
* historial de equipo.

No puede editar nada.

### 6.2 Admin organizador

Puede:

* iniciar sesión,
* cargar equipos,
* cargar jugadores,
* asociar jugadores a equipos,
* cargar fixture,
* editar día y horario por reprogramación,
* cargar resultados,
* editar resultados,
* cargar WO general,
* cargar WO de cancha,
* recalcular tabla.

Admins iniciales:

* Nicolás
* hermano de Nicolás, organizador del torneo

---

## 7. Rutas públicas

### 7.1 Home institucional

```txt
/
```

Debe tener:

* Hero principal con imagen real del club.
* CTA a WhatsApp.
* Actividades principales.
* Alquiler de canchas.
* Entrenamientos.
* Escuela de tenis.
* Torneos.
* Bloque destacado Liga de Invierno.
* Ubicación.
* Contacto.

### 7.2 Liga de Invierno

```txt
/liga-invierno
```

Debe tener:

* portada del torneo,
* logo de Liga de Invierno,
* resumen del formato,
* selector de categorías,
* tabla de posiciones destacada,
* próximas fechas,
* últimos resultados,
* equipos participantes,
* link a reglamento.

### 7.3 Categoría

```txt
/liga-invierno/categorias/[slug]
```

Ejemplos:

```txt
/liga-invierno/categorias/caballeros-a
/liga-invierno/categorias/caballeros-b
/liga-invierno/categorias/damas-a
/liga-invierno/categorias/damas-b
/liga-invierno/categorias/mixto-a
/liga-invierno/categorias/mixto-b
```

Debe mostrar:

* nombre de categoría,
* tabla de posiciones,
* fixture completo,
* resultados jugados,
* próximas fechas,
* equipos de la categoría.

### 7.4 Equipo

```txt
/liga-invierno/equipos/[slug]
```

Debe mostrar:

* nombre del equipo,
* categoría,
* capitán,
* lista de buena fe,
* resumen estadístico,
* fechas jugadas,
* fixture pendiente.

En fechas jugadas debe verse el resultado general.

Al tocar o expandir un resultado jugado, debe verse:

* cancha 1,
* cancha 2,
* cancha 3,
* jugadores de ambos equipos,
* resultado exacto,
* ganador de cada cancha,
* indicación de WO si aplica.

### 7.5 Reglamento

```txt
/liga-invierno/reglamento
```

Debe mostrar reglamento resumido:

* formato del torneo,
* sistema de puntos,
* desempates,
* WO,
* fase regular,
* playoffs futuros.

---

## 8. Rutas admin

No deben estar visibles en la navegación pública.

```txt
/admin/login
/admin
/admin/liga-invierno
/admin/liga-invierno/equipos
/admin/liga-invierno/jugadores
/admin/liga-invierno/fixture
/admin/liga-invierno/resultados
/admin/liga-invierno/reprogramaciones
```

---

## 9. Reglas deportivas de Liga de Invierno

### 9.1 Categorías

El torneo tiene 6 categorías:

```txt
Caballeros A
Caballeros B
Damas A
Damas B
Mixto A
Mixto B
```

### 9.2 Formato de fase regular

Cada categoría juega:

```txt
Todos contra todos ida y vuelta.
```

Cada equipo juega dos veces contra cada rival.

Los equipos juegan siempre en Parque Tenis Club.

### 9.3 Cantidad de equipos

Hay categorías de 6 equipos y una categoría de 5 equipos.

El sistema no debe asumir que todas las categorías tienen la misma cantidad de equipos.

### 9.4 Formato de serie

Una serie es un enfrentamiento entre dos equipos.

Cada serie tiene 3 canchas de dobles:

```txt
Cancha 1
Cancha 2
Cancha 3
```

Gana la serie el equipo que gana 2 de las 3 canchas.

Ejemplo:

```txt
Equipo A vs Equipo B

Cancha 1: gana Equipo A
Cancha 2: gana Equipo B
Cancha 3: gana Equipo A

Resultado de serie:
Equipo A gana 2-1
```

### 9.5 Sistema de puntos

```txt
Serie ganada: 2 puntos
Serie perdida: 1 punto
WO general: 0 puntos para el equipo que no se presenta
```

El puntaje se aplica a la serie, no a cada cancha individual.

### 9.6 Desempates

Orden de desempate:

```txt
1. Puntos
2. Diferencia de canchas ganadas
3. Diferencia de sets
4. Diferencia de games
5. Enfrentamiento entre equipos
```

### 9.7 Resultados

Los resultados se cargan con sets completos.

El tercer set, aunque en la realidad sea supertiebreak, se registra como:

```txt
7-6
```

Ejemplo:

```txt
6-4 3-6 7-6
```

### 9.8 WO general

Un WO general ocurre cuando un equipo no se presenta a la serie completa.

Computa así:

Equipo ganador:

```txt
+2 puntos
+3 canchas ganadas
+0 canchas perdidas
+6 sets ganados
+0 sets perdidos
+36 games ganados
+0 games perdidos
```

Equipo perdedor por WO:

```txt
+0 puntos
+0 canchas ganadas
+3 canchas perdidas
+0 sets ganados
+6 sets perdidos
+0 games ganados
+36 games perdidos
```

### 9.9 WO de cancha individual

Un WO de cancha individual ocurre cuando un equipo no presenta pareja para una sola cancha.

No cuenta como WO general.

Esa cancha se carga como:

```txt
6-0 6-0
```

La serie sigue normalmente.

### 9.10 Jugadores

Cada equipo tiene lista de buena fe.

La lista suele tener entre 12 y 15 jugadores.

Cada fecha los jugadores pueden formar parejas distintas.

Un jugador puede estar en más de un equipo si son categorías diferentes.

A y B cuentan como categorías diferentes.

No mostrar teléfonos públicamente.

Mostrar públicamente solo:

```txt
nombre del jugador
nombre del capitán
```

---

## 10. Playoffs

Los playoffs no se automatizan en la primera versión.

La primera versión debe dejar el modelo preparado para cargar playoffs manualmente.

Regla futura:

```txt
Brackets base de 8 equipos:
1 vs 8
2 vs 7
3 vs 6
4 vs 5
```

Si hay menos de 8 equipos, se usan byes.

Los byes los reciben los mejores posicionados.

Ejemplo con 6 equipos:

```txt
Bye para 1°
Bye para 2°
```

Primera versión:

```txt
No implementar generación automática de playoffs.
No implementar asignación automática de byes.
Permitir cargar cruces manualmente en el futuro.
```

---

## 11. Fixture y reprogramaciones

El fixture ya existe hecho a mano y debe digitalizarse.

Cada serie debe tener:

```txt
categoría
número de fecha
fase
equipo local
equipo visitante
día
horario
estado
```

El día y horario deben ser editables por reprogramaciones, por ejemplo por lluvia.

Cuando se reprograma una serie, guardar:

```txt
scheduled_date
scheduled_time
original_scheduled_date
original_scheduled_time
rescheduled_reason
status
```

Si se reprograma por lluvia:

```txt
status = "rescheduled"
rescheduled_reason = "Reprogramado por lluvia"
```

En la vista pública se debe mostrar la fecha actualizada.

Si existe motivo de reprogramación, mostrar etiqueta breve:

```txt
Reprogramado por lluvia
```

---

## 12. Modelo de datos

### 12.1 tournaments

```txt
id
name
slug
season
status
description
start_date
end_date
created_at
updated_at
```

Ejemplo:

```txt
name: Liga de Invierno
slug: liga-invierno
season: 2026
status: active
```

### 12.2 categories

```txt
id
tournament_id
name
slug
phase_format
regular_phase_type
teams_count
direct_semifinalists_count
quarterfinals_enabled
sort_order
created_at
updated_at
```

Ejemplos:

```txt
Caballeros A
Caballeros B
Damas A
Damas B
Mixto A
Mixto B
```

### 12.3 teams

```txt
id
category_id
name
slug
captain_name
notes
active
created_at
updated_at
```

No guardar teléfono público.

### 12.4 players

```txt
id
first_name
last_name
display_name
active
created_at
updated_at
```

### 12.5 team_players

```txt
id
team_id
player_id
is_captain
active
created_at
updated_at
```

Esto permite que un jugador esté en distintos equipos si son categorías diferentes.

### 12.6 rounds

```txt
id
category_id
phase
round_number
name
scheduled_date
status
created_at
updated_at
```

Valores posibles de phase:

```txt
regular
quarterfinal
semifinal
final
```

### 12.7 series

```txt
id
round_id
category_id
home_team_id
away_team_id
scheduled_date
scheduled_time
original_scheduled_date
original_scheduled_time
rescheduled_reason
status
is_general_walkover
walkover_winner_team_id
winner_team_id
home_courts_won
away_courts_won
notes
created_at
updated_at
```

Estados posibles:

```txt
scheduled
rescheduled
in_progress
completed
walkover
cancelled
```

### 12.8 court_matches

```txt
id
series_id
court_number
home_player_1_id
home_player_2_id
away_player_1_id
away_player_2_id
score
winner_team_id
is_court_walkover
home_sets_won
away_sets_won
home_games_won
away_games_won
created_at
updated_at
```

Court number:

```txt
1
2
3
```

### 12.9 standings_snapshot

```txt
id
category_id
team_id
played
won
lost
points
courts_won
courts_lost
courts_diff
sets_won
sets_lost
sets_diff
games_won
games_lost
games_diff
position
updated_at
```

La tabla puede calcularse en vivo, pero también puede guardarse como snapshot para consulta rápida.

Cada vez que se carga o edita un resultado, recalcular standings de la categoría.

---

## 13. Lógica pura del torneo

Crear carpeta:

```txt
/lib/tournament
```

Crear funciones:

```txt
parseScore(score: string)
calculateCourtMatchResult(match)
calculateSeriesResult(seriesWithCourtMatches)
calculateWalkoverSeriesResult(winnerTeamId, loserTeamId)
calculateStandings(teams, series, courtMatches, rules)
sortStandings(standings, rules)
getTeamSchedule(teamId, series, courtMatches)
```

### 13.1 parseScore

Debe recibir:

```txt
6-4 3-6 7-6
```

Debe devolver:

```txt
sets ganados por cada lado
games ganados por cada lado
ganador
```

### 13.2 calculateCourtMatchResult

Debe calcular:

```txt
ganador de cancha
sets local
sets visitante
games local
games visitante
```

Debe soportar WO de cancha.

### 13.3 calculateSeriesResult

Debe calcular:

```txt
canchas ganadas local
canchas ganadas visitante
ganador de serie
```

Gana la serie quien gana 2 de 3 canchas.

### 13.4 calculateWalkoverSeriesResult

Debe calcular WO general como:

```txt
3-0 canchas
6-0 sets
36-0 games
```

### 13.5 calculateStandings

Debe calcular tabla completa desde resultados.

No permitir edición manual de puntos.

### 13.6 sortStandings

Debe ordenar por:

```txt
1. puntos
2. diferencia de canchas
3. diferencia de sets
4. diferencia de games
5. enfrentamiento entre equipos
```

### 13.7 getTeamSchedule

Debe devolver:

```txt
equipo
categoría
partidos jugados
partidos pendientes
detalle de cada serie
detalle de canchas si la serie está jugada
```

---

## 14. Tests obligatorios

Crear tests para:

```txt
Serie 3-0
Serie 2-1
Partido con tercer set 7-6
WO de cancha individual
WO general
Tabla con desempate por diferencia de canchas
Tabla con desempate por diferencia de sets
Tabla con desempate por diferencia de games
Historial de equipo con partidos jugados y pendientes
Detalle de canchas visible solo en partidos ya jugados
Edición de resultado recalcula tabla
Reprogramación cambia fecha pública sin alterar resultado
```

---

## 15. UI pública — requerimientos de diseño

### 15.1 Estética

Usar estética:

```txt
deportiva moderna
verde y naranja
muchas fotos reales del club
fondos claros
contraste limpio
cards modernas
tablas legibles
mobile first
```

### 15.2 Home

Textos breves.

Botones claros:

```txt
Consultar por WhatsApp
Ver Liga de Invierno
Ver entrenamientos
Cómo llegar
```

### 15.3 Liga de Invierno

Priorizar claridad sobre ornamentación.

Componentes necesarios:

```txt
CategoryTabs
StandingsTable
FixtureList
ResultCard
SeriesDetail
CourtMatchDetail
TeamCard
TeamSchedule
TournamentHeader
```

### 15.4 Tabla en mobile

En mobile mostrar versión resumida:

```txt
Pos
Equipo
PJ
PG
PP
Pts
Dif
```

Al tocar o expandir, mostrar:

```txt
canchas
sets
games
```

---

## 16. Admin — requerimientos funcionales

### 16.1 Login

Usar Supabase Auth.

Ruta:

```txt
/admin/login
```

No mostrar link desde home.

### 16.2 Dashboard

Ruta:

```txt
/admin
```

Mostrar accesos a:

```txt
Equipos
Jugadores
Fixture
Resultados
Reprogramaciones
```

### 16.3 Equipos

Permitir:

```txt
crear equipo
editar equipo
activar/desactivar equipo
asignar categoría
definir capitán visible
```

### 16.4 Jugadores

Permitir:

```txt
crear jugador
editar jugador
asociar jugador a equipo
marcar capitán
activar/desactivar jugador
```

### 16.5 Fixture

Permitir:

```txt
crear serie
editar serie
asignar fecha
asignar día
asignar horario
reprogramar serie
```

### 16.6 Resultados

Permitir cargar por serie:

```txt
cancha 1
cancha 2
cancha 3
jugadores local
jugadores visitante
score
WO de cancha
WO general
```

Al guardar:

```txt
calcular ganador de cancha
calcular ganador de serie
actualizar resultado general
recalcular tabla
```

### 16.7 Edición de resultados

Debe poder editarse un resultado por error.

Al editar:

```txt
recalcular todo desde cero para esa categoría
no sumar duplicado
no dejar standings inconsistentes
```

---

## 17. Importador de fixture

Crear script:

```txt
/scripts/import-fixture.ts
```

CSV esperado:

```csv
categoria,fase,fecha_numero,fecha_nombre,equipo_local,equipo_visitante,dia,hora
Caballeros A,regular,1,Fecha 1,Equipo A,Equipo B,2026-07-10,20:00
```

El script debe:

```txt
validar categoría
validar equipos
crear rounds si no existen
crear series
evitar duplicados
reportar errores claros
permitir dry-run
```

Comando deseado:

```bash
npm run import:fixture -- --file ./data/fixture.csv --dry-run
npm run import:fixture -- --file ./data/fixture.csv
```

---

## 18. Seguridad y permisos

### 18.1 Lectura pública

La información publicada de Liga de Invierno debe poder leerse sin login.

### 18.2 Escritura restringida

Solo admins autenticados pueden:

```txt
crear equipos
editar equipos
crear jugadores
editar jugadores
crear fixture
editar fixture
cargar resultados
editar resultados
recalcular tabla
```

### 18.3 Datos sensibles

No mostrar teléfonos públicamente.

No exponer claves de Supabase.

No commitear `.env`.

---

## 19. Deploy

Deploy en Vercel.

El dominio actual del club debe apuntar a esta nueva web.

Preparar:

```txt
variables de entorno
metadata SEO
favicon
robots.txt
sitemap
optimización de imágenes
build limpio
lint limpio
```

---

## 20. SEO básico

Home:

```txt
title: Parque Tenis Club
description: Club de tenis, entrenamientos, torneos, escuela y alquiler de canchas.
```

Liga de Invierno:

```txt
title: Liga de Invierno | Parque Tenis Club
description: Fixture, resultados, equipos y tabla de posiciones de la Liga de Invierno de Parque Tenis Club.
```

---

## 21. Criterios de aceptación del MVP

El MVP está terminado cuando:

```txt
La landing institucional está online.
La sección /liga-invierno está online.
Se pueden ver las 6 categorías.
Se puede ver tabla por categoría.
Se puede ver fixture por categoría.
Se pueden ver equipos y jugadores.
Se puede ver página de equipo.
La página de equipo muestra jugados y pendientes.
Los resultados jugados muestran detalle de las 3 canchas.
El admin puede iniciar sesión.
El admin puede cargar equipos.
El admin puede cargar jugadores.
El admin puede cargar fixture.
El admin puede cargar resultados.
El admin puede editar resultados.
El admin puede reprogramar fechas.
La tabla se recalcula automáticamente.
WO general funciona.
WO de cancha funciona.
Build y lint pasan.
La web está deployada en Vercel.
El dominio apunta a la nueva web.
```

---

## 22. Fuera de alcance del MVP

No implementar todavía:

```txt
playoffs automáticos
byes automáticos
Liga de Verano
carga de resultados por capitanes
notificaciones por WhatsApp
fotos por equipo
logos por equipo
estadísticas individuales avanzadas
app mobile
sistema de reservas de cancha
pagos online
```

---

## 23. Sprints recomendados

### Sprint 1 — Documentación y estructura

Crear:

```txt
/product/vision.md
/product/reglas-liga-invierno.md
/product/modelo-datos.md
/product/rutas.md
/product/backlog.md
/product/open-questions.md
CLAUDE.md
```

### Sprint 2 — Proyecto Next.js

Crear estructura base:

```txt
/
app/
components/
content/
lib/
lib/tournament/
public/images/
```

### Sprint 3 — Landing institucional con mocks

Implementar home con contenido editable.

### Sprint 4 — Liga de Invierno pública con mocks

Implementar:

```txt
/liga-invierno
/liga-invierno/categorias/[slug]
/liga-invierno/equipos/[slug]
/liga-invierno/reglamento
```

### Sprint 5 — Lógica deportiva + tests

Implementar funciones de torneo y tests.

### Sprint 6 — Supabase

Crear migraciones, tablas y conexión.

### Sprint 7 — Admin

Implementar login y gestión básica.

### Sprint 8 — Importador de fixture

Crear importador CSV.

### Sprint 9 — Deploy

Preparar producción en Vercel.

---

## 24. Instrucciones para Claude Code

Antes de modificar código:

```txt
1. Leer este PRD.
2. Leer /product/reglas-liga-invierno.md si existe.
3. Leer CLAUDE.md si existe.
4. Identificar gaps.
5. No inferir reglas deportivas.
6. Trabajar por sprint.
7. Ejecutar lint/build/tests antes de cerrar cada sprint.
8. Informar archivos modificados.
9. Informar qué queda pendiente.
```

---

## 25. Primer prompt sugerido para Claude Code

```txt
Leé este PRD completo y creá la documentación base del proyecto.

No escribas todavía código de aplicación.

Creá:
- /product/vision.md
- /product/reglas-liga-invierno.md
- /product/modelo-datos.md
- /product/rutas.md
- /product/backlog.md
- /product/open-questions.md
- CLAUDE.md

El proyecto es una web real para Parque Tenis Club con una sección pública de Liga de Invierno y un panel admin privado.

Respetá todas las reglas deportivas del PRD.
No inventes reglas faltantes.
Todo gap debe quedar en /product/open-questions.md.
```

---

## 26. Segundo prompt sugerido para Claude Code

```txt
Ahora creá la estructura inicial del proyecto Next.js.

Requisitos:
- App Router
- TypeScript
- Tailwind
- estructura escalable
- datos mockeados
- sin Supabase todavía
- rutas públicas
- rutas admin
- componentes base
- navbar público sin link visible al admin
- footer
- carpeta /content
- carpeta /lib/tournament

No implementar lógica compleja todavía.
No implementar base de datos todavía.
```

---

## 27. Tercer prompt sugerido para Claude Code

```txt
Implementá la landing institucional pública en /.

Debe tener:
- Hero con imagen real o placeholder
- CTA a WhatsApp
- Actividades
- Alquiler de canchas
- Entrenamientos
- Escuela de tenis
- Torneos
- Bloque destacado Liga de Invierno
- Ubicación
- Contacto

Usar estética deportiva moderna, verde y naranja, mobile first.
Textos editables desde /content/site.ts.
```

---

## 28. Cuarto prompt sugerido para Claude Code

```txt
Implementá la sección pública de Liga de Invierno con datos mockeados.

Rutas:
- /liga-invierno
- /liga-invierno/categorias/[slug]
- /liga-invierno/equipos/[slug]
- /liga-invierno/reglamento

Debe mostrar:
- categorías
- tabla
- fixture
- resultados
- equipos
- jugadores
- historial de equipo
- detalle expandible de canchas en partidos jugados

No conectar Supabase todavía.
```

---

## 29. Quinto prompt sugerido para Claude Code

```txt
Implementá la lógica pura del torneo en /lib/tournament y agregá tests.

Funciones:
- parseScore
- calculateCourtMatchResult
- calculateSeriesResult
- calculateWalkoverSeriesResult
- calculateStandings
- sortStandings
- getTeamSchedule

Cubrir con tests:
- Serie 3-0
- Serie 2-1
- Tercer set 7-6
- WO de cancha
- WO general
- Desempates
- Historial de equipo
- Reprogramación
```

---

## 30. Notas finales

Este PRD es la fuente de verdad del proyecto.

Si una decisión cambia, actualizar primero este PRD y luego el código.

No permitir que la implementación quede por encima del documento.

El código debe derivarse del spec.
