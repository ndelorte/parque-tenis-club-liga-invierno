# Reglas — Circuito del Parque

> Torneos mensuales por categoría (ex "Mid Master" ampliado). Completamente independiente de
> Liga de Invierno. Mid Master y Final Master son **torneos especiales** dentro del Circuito,
> con reglas propias (ver `reglas-mid-master.md`) — no comparten ranking con los torneos mensuales.
>
> Fuente de verdad para toda lógica deportiva del módulo Circuito del Parque. Relevado con el
> organizador el 2026-09-07, respondiendo el cuestionario de `plan-liga-multitemporada-y-circuito.md` §10.
> Alimenta la `CircuitoFormatSpec` (tipo declarativo, `plan-liga-multitemporada-y-circuito.md` §4.5)
> que consume el motor de cuadros (`lib/circuito/generateBracket.ts`, Sprint C4).

---

## Categorías 2026

14 categorías. El `draw_size` (cantidad de inscriptos) **no es fijo**: varía mes a mes según
quién se anota. Mínimo **4 inscriptos** para que una categoría se juegue ese mes — con menos, la
categoría no se disputa ese mes.

| Categoría | Tipo |
|---|---|
| Caballeros Primera | Single |
| Caballeros Intermedia | Single |
| Caballeros Segunda | Single |
| Caballeros Tercera | Single |
| Caballeros +50 | Single |
| Damas Primera | Single |
| Damas Segunda | Single |
| Caballeros Primera | Dobles |
| Caballeros Intermedia | Dobles |
| Caballeros Segunda | Dobles |
| Damas Primera | Dobles |
| Damas Segunda | Dobles |
| Mixto Intermedia | Dobles |
| Mixto Segunda | Dobles |

Todas las categorías comparten la misma `CircuitoFormatSpec` (formato según inscriptos, seeding,
repechaje, puntaje) — no hay reglas diferenciadas por categoría.

---

## Formato del torneo según cantidad de inscriptos

El armado del cuadro **cambia según N** (cantidad de inscriptos ese mes). Esto es la
`drawRules` de la `CircuitoFormatSpec` — dato, no lógica hardcodeada.

| Inscriptos (N) | Formato | Detalle |
|---|---|---|
| < 4 | No se juega | Categoría no se disputa ese mes |
| **4** | Round robin + final | Zona única, todos contra todos. Los 2 primeros juegan la final. |
| **5** | Round robin puro | Zona única, todos contra todos. **Sin final**: el campeón es el 1° de la tabla de posiciones. El 2° es subcampeón a todos los efectos (incluido el puntaje). |
| **6–7** | Grupos + llave | Dos zonas. Los 2 primeros de cada zona pasan a semifinal. Hay **final** (ganadores de semifinal). **No hay partido de tercer puesto.** |
| **8+** | Eliminación simple | Se completan byes hasta la potencia de 2 más cercana. Los perdedores de **1ª ronda** pasan a un cuadro de **repechaje** aparte (ver abajo). |

---

## Seeding (cabezas de serie y reparto de byes)

- **Fuente**: el **ranking vigente del circuito** (acumulado del año en curso hasta ese momento).
  Los mejores ubicados reciben los byes cuando hace falta completar potencia de 2 (formato 8+).
- **Sin ranking del año en curso todavía** (primeros torneos de años futuros, antes de que haya
  resultados de ese año): se usa el **ranking final del año anterior**.
- **Excepción única — primer torneo de 2026**: al ser el primer año en que el sistema calcula
  ranking formal (aunque el circuito ya existía por Challonge, sin ranking anual sistematizado),
  no hay ranking previo disponible. Ese primer torneo, los cabezas de serie los define
  **manualmente la coordinadora**.
- **Armado de las 2 zonas (formato 6-7 inscriptos)**: mismo criterio de ranking que las byes,
  repartido en **serpentina** para equilibrar el nivel de cada zona — 1° al ranking → Zona A, 2° y
  3° → Zona B, 4° y 5° → Zona A, 6° (y 7° si lo hay) → Zona B.

---

## Repechaje

Solo existe cuando el formato es **eliminación simple** (8+ inscriptos).

- **Elegibles**: únicamente los perdedores de la **1ª ronda** del cuadro principal.
- **Estructura**: eliminación directa (cuadro propio, separado del principal). Si el número de
  elegibles no es potencia de 2, se completan byes con el **mismo criterio de seeding** que el
  cuadro principal (ranking vigente).
- **Campeón de repechaje**: es un resultado aparte. **No reingresa** al cuadro principal.
- **Puntos**: ganar el repechaje **no otorga puntos de ranking**. Su función es exclusivamente
  garantizar que todo participante juegue como mínimo 2 partidos (los formatos de zona ya lo
  garantizan por diseño; la eliminación simple sin repechaje no lo garantizaría para los
  perdedores de 1ª ronda).

---

## Formato de partido

- Al mejor de 3 sets.
- El tercer set es **supertiebreak** y se registra siempre como **`7-6`** (igual que Liga de
  Invierno y Mid Master) — **excepto en la final** de cada categoría, donde el tercer set se
  juega **completo** y se registra con el **score real**.
- **Walkover**: existe. Se registra como **`6-0 6-0`** (mismo criterio que Liga/Mid Master). El
  ganador por WO recibe **los mismos puntos de ranking** que si hubiera ganado jugando.

---

## Puntos y ranking

### Tipo de torneo: Grand Slam vs. normal

Los torneos de **enero, mayo, julio y septiembre** son "**Grand Slam**" (fechas fijas del
calendario, mismas para todas las categorías). El resto de los meses son torneos "**normales**".
Cada tipo tiene su propia escala de puntos.

| Instancia | Grand Slam | Normal |
|---|---|---|
| Campeón | 2000 | 1000 |
| Subcampeón | 1300 | 650 |
| Semifinal | 800 | 400 |
| Cuartos | 400 | 200 |
| Octavos | 200 | 100 |
| 16vos o más | 100 | 50 |
| Repechaje (cualquier resultado) | 0 | 0 |

### Cómo se traduce la tabla según el formato jugado ese mes

Los formatos de zona (4, 5, 6–7 inscriptos) no tienen instancias de cuartos/octavos — se
comprimen así:

| Inscriptos | Campeón | Subcampeón | Semifinal | Resto |
|---|---|---|---|---|
| 4 | 1° de la final | 2° de la final | — | Los 2 que no llegan a la final → **16vos o más** |
| 5 | 1° de la zona | 2° de la zona | — | 3°, 4°, 5° de la zona → **16vos o más** |
| 6–7 | Ganador de la final | Perdedor de la final | Los 2 perdedores de semifinal | Los que no llegan a semifinal → **16vos o más** |
| 8+ | Ganador del cuadro | Perdedor de la final | Perdedores de semifinal | Cuartos / Octavos / 16vos según instancia real alcanzada |

### Acumulado anual

- El ranking anual **suma los puntos de TODOS los torneos jugados en el año** (no se descartan
  los peores resultados — no hay esquema "mejores N").
- **No hay mínimo de torneos jugados** para figurar en el ranking ni para clasificar a la Final
  Master.

---

## Mid Master y Final Master (torneos especiales)

- **Mid Master conserva su nombre** dentro del Circuito del Parque — es un "torneo especial",
  no un torneo mensual más. Sus reglas propias siguen en `reglas-mid-master.md`.
- **Los resultados de Mid Master y Final Master NO suman al ranking anual del circuito mensual.**
  Son eventos independientes con su propio prestigio, sin mezclar escalas de puntos.
- **Final Master**: clasifican los **8 mejores** del ranking anual, por categoría.

---

## Import histórico Challonge (Sprint C7)

Pendiente de verificar en el Sprint C7, antes de programar el import: **¿la cuenta de Challonge
(`elcircuitodelparque`) expone el detalle set por set de cada partido (`scores_csv`), o solo el
resultado agregado (ej. `2-1`)?** Si no expone detalle de sets, el ranking importado no puede usar
diferencia de games como desempate para esos datos — definir en ese momento un desempate
alternativo **solo** para partidos importados (no inventarlo ahora).

---

## Participantes

- **Single**: un jugador por participante.
- **Dobles**: dos jugadores por participante (pareja).
- Los jugadores comparten la tabla `players` con Liga de Invierno y Mid Master (único dato
  compartido intencional entre módulos — ADR-002).

---

## Notas de implementación

- No reutilizar lógica de `lib/tournament/` ni `lib/playoffs/` (son de Liga) salvo `parseScore`
  si el formato de partido coincide exactamente — si no, `lib/circuito/parseCircuitoScore.ts`.
- Toda lógica deportiva propia en `lib/circuito/` (puro) + `lib/data/circuito/` (data layer
  tipado — ver ADR-005, no repetir el patrón `any` de `mid_master_*`).
- Tablas Supabase con prefijo `circuito_` (ver ADR-005).
- La `CircuitoFormatSpec` (tipo declarativo) es la que este documento alimenta. El motor de
  cuadros (`generateBracket.ts`) la interpreta como datos — cambiar una regla deportiva es
  cambiar este documento + la spec, no el código del motor.
