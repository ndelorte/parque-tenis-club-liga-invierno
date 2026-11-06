# Plan — Liga de Verano 2026/2027: inscripción online + medallas de podio

> Origen: ideas del organizador (03/11/2026). Decisiones confirmadas el 06/11/2026.
> Edición objetivo: `liga-verano-2026-2027` (hoy `upcoming`, sin categorías).

---

## Decisiones tomadas

| Tema | Decisión |
|------|----------|
| Estado de la edición | Pasa a `active` ya. La inscripción vive dentro de la edición activa. Invierno 2026 está `finished`, así que no se rompe el supuesto de "una sola edición activa" (`getActiveTournament`, `getAdminActiveTournament`). |
| Flujo de inscripción | La solicitud queda **pendiente**. El admin valida cada jugador y aprueba; recién ahí se crea el equipo en la categoría. También puede rechazar. Nada de lo que manda el público aparece en el sitio sin revisión. |
| Campos del formulario | Nombre del equipo · Categoría (Damas A, Damas B, Caballeros A, Caballeros B, Mixto A, Mixto B) · Jugadores: nombre, apellido y DNI de cada uno · Capitán: se marca uno de los jugadores cargados · Teléfono del capitán · Observaciones (opcional; el texto aclara que es para restricciones de horario o sugerencias). |
| Cantidad de jugadores y cierre | Se configuran **desde el panel** por edición: inscripción abierta/cerrada, fecha de cierre, mínimo y máximo de jugadores. |
| DNI | Se guarda al confirmar el jugador, en una tabla **privada** (`player_private`). No va en `players`, porque `players` tiene `select using (true)` público (002_rls.sql). Si el DNI ya existe, el match es exacto. |
| Mínimo y máximo por defecto | **6 y 12** jugadores, mientras el organizador no los configure desde el panel. |
| DNI ya asignado a otro jugador | **No frena el envío del formulario**: el formulario público no consulta `player_private`. Frena la **aprobación** en el panel, que avisa y no permite pisar el DNI. |
| Fecha de cierre | La inscripción sigue abierta hasta el final del día elegido (hora Argentina). |
| Límite de envíos | No hay límite por persona. Solo el honeypot anti-bots; las solicitudes duplicadas se rechazan desde el panel. |
| Medallas | Cuentan los podios de **Verano e Invierno**. La medalla aclara la temporada: "Campeón Verano 2025/26", "Subcampeón Invierno 2025". |

---

## Fase V1 — Inscripción online + validación en el panel

### Base de datos (migración `013_liga_inscripcion.sql`)

1. `tournaments`: agregar `registration_open boolean not null default false`,
   `registration_deadline date null`, `registration_min_players int null`,
   `registration_max_players int null`.
2. `liga_registrations`
   - `id uuid pk`, `tournament_id fk`, `category_id fk`, `team_name text not null`,
     `captain_phone text not null`, `notes text null`,
     `status text check in ('pending','approved','rejected') default 'pending'`,
     `team_id uuid fk → teams null` (lo completa la aprobación),
     `reviewed_at timestamptz null`, `created_at`, `updated_at`.
3. `liga_registration_players`
   - `id uuid pk`, `registration_id fk on delete cascade`, `first_name`, `last_name`,
     `dni text not null` (solo dígitos), `is_captain boolean`, `sort_order int`,
     `resolved_player_id uuid fk → players null`,
     `resolution text check in ('pending','existing','new') default 'pending'`.
   - Exactamente un capitán por inscripción (se valida en la app y con un índice único parcial).
4. `player_private`: `player_id uuid pk fk → players on delete cascade`, `dni text unique not null`, timestamps.
5. RLS: las tres tablas nuevas tienen RLS **activado y sin policies para anon/authenticated**.
   Todo pasa por server actions con service role (mismo criterio que 010_circuito_rls_solo_service_role.sql).
   Teléfono y DNI nunca llegan al cliente público.
6. Seed de la edición (`supabase/seeds/004_liga_verano_2026_2027.sql`): crear las 6 categorías
   (damas-a, damas-b, caballeros-a, caballeros-b, mixto-a, mixto-b; `round_robin`/`home_away`;
   `teams_count` 6, a ajustar cuando se conozcan los inscriptos) y pasar la edición a `active` con
   `registration_open = true`. Las migraciones las aplica el organizador a mano en Supabase.

### Público

> Aclaración del organizador (06/11/2026): mientras la inscripción está abierta, la página de la
> edición es **principalmente el formulario**, con un resumen del reglamento y acceso al reglamento
> completo. Los equipos aprobados **no se muestran** hasta que se cierre la inscripción y se sorteen
> los cuadros.

- **Etapa de inscripción** (edición `active`, `registration_open = true`, sin series cargadas):
  `/ligas-invierno-verano/[season]` muestra, en este orden:
  1. El hero de la edición (fecha de cierre si la hay).
  2. **El formulario de inscripción**, que es el contenido principal, embebido en la página.
  3. El resumen del reglamento: reusar `components/liga/liga-reglamento.tsx` y sus datos actuales.
     No inventar reglas nuevas.
  4. El link al reglamento completo (`/ligas-invierno-verano/reglamento` y el PDF).
     **Pendiente:** por ahora se usa el reglamento actual tal como está (06/11/2026). El organizador
     va a pasar después los cambios de Verano 2026/27: fechas, precios y algunas reglas, en especial
     los avisos de WO en el mismo día. Esas reglas no se infieren: cuando lleguen, se actualizan
     `reglas-liga-invierno.md` (o un archivo de reglas de verano), el resumen, la página del
     reglamento y el PDF.

  En esta etapa no hay tabla, fixture, categorías con equipos ni listado de equipos.
- **Etapa "inscripción cerrada, sin sorteo"** (`registration_open = false` y sin series): se muestra
  "Inscripción cerrada — estamos armando los cuadros", el resumen del reglamento y el link al
  reglamento completo. Tampoco se muestran los equipos.
- **Etapa de juego** (hay series cargadas, o sea, se sortearon los cuadros): la vista activa de siempre
  (tabla, fixture, equipos).
- **Regla de visibilidad de equipos:** en una edición activa, los equipos (páginas de categoría,
  página de equipo y listados) se ven solo cuando `registration_open = false` **y** la categoría tiene
  series cargadas. El criterio se calcula en una función pura de `lib/liga/` con tests; no hay un flag
  manual. Las páginas de categoría y equipo de esa edición devuelven `notFound()` o un aviso mientras
  no se cumpla.
  *Decisión (06/11/2026):* el ocultamiento es solo en las páginas. No se restringe por RLS la lectura
  pública de `teams` y `team_players` antes del sorteo; el organizador lo aceptó así.
- La ruta `/ligas-invierno-verano/[season]/inscripcion` también existe como acceso directo y muestra el
  mismo formulario. Si la inscripción está cerrada o ya pasó la fecha de cierre, muestra
  "La inscripción está cerrada".
- Validaciones: entre `min` y `max` jugadores; DNI de 7 u 8 dígitos (se aceptan puntos y se limpian);
  DNI no repetido dentro de la misma inscripción; un capitán exacto; teléfono obligatorio.
- Server action pública `submitLigaRegistration`, en un archivo propio
  `app/actions/liga-registration-public.ts`, porque no puede tener guardia admin. Revalida con Zod en
  el servidor, vuelve a chequear abierta/fecha/min/max, usa un honeypot anti-bots y limita el tamaño
  de los textos. El test `admin-guard.test.ts` suma esa única excepción explícita, con comentario.
- Confirmación: "Recibimos la inscripción de <equipo>. El organizador la va a revisar y se va a
  comunicar con el capitán." No muestra ningún dato sensible.

### Panel (`/panel-liga?seccion=inscripciones`)

- Nueva sección "Inscripciones" en `components/admin/panels.ts`.
- **Configuración de la edición activa**: abierta/cerrada, fecha de cierre, mínimo y máximo.
- **Listado** de solicitudes por estado (pendientes primero), con categoría, equipo, capitán,
  teléfono, cantidad de jugadores y fecha.
- **Detalle / validación** de una solicitud, jugador por jugador:
  1. DNI ya en `player_private` → match exacto, "Ya existe: X" (preseleccionado).
  2. Si no hay DNI, se buscan candidatos con `findSimilarPlayers` de `lib/players/similarNames.ts`
     sobre `"Apellido Nombre"`, que es el formato del sitio. Muestra "¿Este jugador coincide con X?"
     con los candidatos ("same" primero).
     El admin elige un candidato (`existing`) o "Es otro jugador → crear nuevo" (`new`).
     Si el candidato elegido ya tiene otro DNI en `player_private`, se avisa y no se pisa sin confirmar.
  3. Aviso si el jugador ya está activo en otro equipo de la misma categoría (restricción del modelo).
- **Aprobar** (solo con todos los jugadores resueltos): crea el `team` en la categoría (slug único
  dentro de la categoría), crea los `players` nuevos (`display_name` = "Apellido Nombre"), guarda los
  DNI en `player_private`, crea los `team_players` con `is_captain`, setea `teams.captain_name` y
  marca la solicitud como `approved` con su `team_id`. Si algo falla, no queda nada a medias.
- **Rechazar**: `status = rejected`, sin crear nada.
- Toda action nueva del panel valida admin en la primera línea.

### Lógica pura (con tests Vitest)

- `lib/liga/registration/schema.ts`: el schema Zod compartido entre cliente y servidor (min/max por parámetro).
- `lib/liga/registration/normalizeDni.ts`.
- `lib/liga/registration/suggestPlayerMatches.ts`: primero DNI, después nombre (reusa `similarNames`).

---

## Fase V2 — Medallas de podio por equipo

- Fuente de los podios: `getPodiumForCategory` (series reales primero, campos `manual_*` como respaldo)
  de todas las ediciones `finished`, Verano e Invierno.
- Al validar una inscripción, el panel sugiere los podios cuyo nombre de equipo se parezca al nombre
  inscripto. Usa el mismo fuzzy, pero también acepta nombres de una sola palabra cuando coinciden
  exactamente ("Pinamar"). El admin tilda los que corresponden.
- Tabla `team_medals` (`team_id`, `source_category_id`, `place` 1|2|3, `label`); se guarda al aprobar.
  Lectura pública (solo nombre, puesto y temporada).
- UI: componente `TeamMedals`, con oro/plata/bronce y texto "Campeón Verano 2025/26". Aparece en la
  tarjeta del equipo, en la página del equipo, en el fixture y en los partidos. Un equipo puede tener
  varias medallas, ordenadas por año (la más reciente primero).
- La maqueta visual de la medalla se aprueba antes de implementarla.

---

## Fuera de alcance (por ahora)

- Notificaciones por email/WhatsApp al aprobar o rechazar.
- Editar desde el panel los datos de una inscripción ya enviada (si hace falta, se rechaza y se vuelve a inscribir).
- Pago de inscripción.
