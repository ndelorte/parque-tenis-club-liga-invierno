Quiero agregar una nueva funcionalidad a Liga de Invierno: visualización provisoria de playoffs por categoría y administración de partidos de eliminación directa.

Contexto:
Actualmente cada categoría tiene fase regular con tabla de posiciones. Ahora todas las categorías tienen 6 equipos. El cuadro final debe ser de 8 lugares, pero con 6 equipos reales, por lo tanto los equipos ubicados 1° y 2° pasan con bye en cuartos.

Objetivo público:
En cada página de categoría de Liga de Invierno, agregar un apartado llamado:

“Fase Final”

Debajo del título debe decir en texto más chico:

“Con las posiciones actuales provisorias”

Ese apartado debe mostrar cómo quedarían los cruces si la fase regular terminara con la tabla actual.

Regla de armado de cuadro con 6 equipos:

* El cuadro es de 8 lugares.
* El 1° clasificado va arriba de todo y pasa con bye.
* El 2° clasificado va abajo de todo y pasa con bye.
* Los cruces de cuartos son:

  * 3° vs 6°
  * 4° vs 5°
* Los ganadores de esos cruces avanzan hacia semifinales.
* El 1° espera en semifinal por el ganador del cruce correspondiente.
* El 2° espera en semifinal por el otro ganador.

Visualización pública:

* Mostrar un bracket o bloque visual simple y claro.
* Debe quedar claro que es provisorio y depende de las posiciones actuales.
* Si todavía faltan partidos de fase regular, debe mantenerse la leyenda “provisorio”.
* Mostrar el nombre del equipo y su posición actual.
* En los lugares de bye, mostrar “BYE”.
* En los partidos de cuartos, mostrar la fecha/horario cargada desde admin si existe.
* Si todavía no hay fecha cargada, mostrar “Fecha a confirmar”.
* Debe ser responsive y verse bien en mobile.

Ejemplo visual conceptual:
1° Equipo A — BYE — espera en semifinal

Cuartos de final:
3° Equipo C vs 6° Equipo F
Fecha: 20/07/2026 19:30 hs

4° Equipo D vs 5° Equipo E
Fecha: 20/07/2026 21:00 hs

2° Equipo B — BYE — espera en semifinal

Objetivo admin:
Agregar en el panel admin la posibilidad de administrar playoffs por categoría.

Desde admin se debe poder:

1. Ver cada categoría.
2. Ver los partidos de playoffs:

   * Cuartos de final
   * Semifinal
   * Final
3. Cargar o editar fecha y horario de cada partido.
4. Cargar resultados de esos partidos cuando se jueguen.
5. Cargar detalle de las 3 canchas igual que en una serie normal:

   * cancha 1
   * cancha 2
   * cancha 3
   * jugadores
   * resultado por sets
   * ganador de cancha
   * WO si corresponde
6. Recalcular ganador de serie igual que en fase regular: gana quien gana 2 de 3 canchas.
7. Avanzar automáticamente el ganador a la siguiente ronda del bracket, si la estructura ya está creada.

Reglas importantes:

* No modificar reglas de fase regular.
* No modificar cálculo de tabla de fase regular.
* La tabla sigue calculándose solo con partidos de fase regular.
* Los partidos de playoffs no suman puntos a la tabla.
* Los cruces provisorios se calculan desde standings actuales.
* Cuando la fase regular esté terminada, esos cruces podrán quedar como definitivos.
* Por ahora todas las categorías tienen 6 equipos.
* Diseñar la lógica para que soporte en el futuro categorías con 5, 6, 7 u 8 equipos si es razonable, pero el caso actual obligatorio es 6 equipos.

Modelo de datos sugerido:
Evaluar si conviene crear nuevas tablas específicas para playoffs o reutilizar series con un campo phase/playoff_round.

Opción sugerida:

* series ya puede representar partidos de regular y playoffs si se agrega/usa:

  * phase: "regular" | "quarterfinal" | "semifinal" | "final"
  * bracket_position
  * home_seed
  * away_seed
  * home_team_id nullable
  * away_team_id nullable
  * winner_team_id nullable
  * scheduled_date
  * scheduled_time
  * status

Si ya existe una estructura mejor, respetarla.

Funciones necesarias:
Crear lógica pura en /lib/tournament o /lib/playoffs:

* generateProvisionalPlayoffBracket(standings, category)
  Debe devolver el bracket provisorio según posiciones actuales.

* generateSixTeamQuarterfinals(standings)
  Para 6 equipos:

  * seed 1 bye
  * seed 2 bye
  * seed 3 vs seed 6
  * seed 4 vs seed 5

* getPlayoffMatches(categoryId)
  Obtiene partidos reales de playoffs cargados desde base/admin.

* mergeProvisionalBracketWithScheduledMatches(provisionalBracket, scheduledMatches)
  Para mostrar cruces provisorios con fechas cargadas si existen.

Tests obligatorios:
Agregar tests para:

* categoría con 6 equipos genera 1° y 2° con bye.
* genera cruce 3° vs 6°.
* genera cruce 4° vs 5°.
* si cambia la tabla, cambian los cruces provisorios.
* los playoffs no modifican puntos de fase regular.
* fecha de cuartos se muestra si fue cargada desde admin.
* si no hay fecha, muestra “Fecha a confirmar”.
* resultado de playoff calcula ganador de serie 2 de 3.
* ganador de cuartos puede avanzar a semifinal.
* los byes colocan a 1° y 2° directamente en semifinal.

UI pública:
Agregar componente reutilizable, por ejemplo:

* components/liga/playoff-preview.tsx
* components/liga/playoff-bracket.tsx

Ubicación:
En cada página de categoría:

* Después de tabla de posiciones y antes o después del fixture, donde quede más lógico.
* Título: “Cuartos de final”
* Subtítulo: “Con las posiciones actuales provisorias”

UI admin:
Agregar sección o pestaña:

* Admin → Liga de Invierno → Playoffs
  o dentro de cada categoría:
* Admin → Liga de Invierno → Categoría → Playoffs

Debe permitir:

* seleccionar categoría
* ver partidos de cuartos, semis y final
* cargar fecha y horario
* cargar/editar resultado
* ver estado: pendiente, programado, jugado

Planilla PDF:
Si ya existe o se está implementando “Ver planilla” para series, reutilizarla también para partidos de playoff.

Seguridad:

* La carga y edición de fechas/resultados de playoff es solo admin.
* No mostrar controles admin en páginas públicas.

Importante:
Antes de modificar código, revisá el modelo actual y proponé el mínimo cambio necesario.
No dupliques lógica si series/court_matches ya sirven para playoffs.
No rompas importadores CSV existentes.
No cambies rutas públicas existentes.
No cambies reglas deportivas ya documentadas.
Actualizar documentación en product/:

* reglas-liga-invierno.md
* modelo-datos.md
* open-questions.md si queda algo pendiente
* backlog.md o plan de implementación si existe

Al terminar:

* Ejecutar npm test
* Ejecutar npm run lint
* Ejecutar npm run build
* Informar archivos creados/modificados
* Informar cualquier decisión técnica tomada
