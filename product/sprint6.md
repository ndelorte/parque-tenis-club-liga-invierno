Implementá la lógica pura del torneo en /lib/tournament y agregá tests.
Funciones:
- parseScore(score: string)
- calculateCourtMatchResult(match)
13
- calculateSeriesResult(seriesWithCourtMatches)
- calculateWalkoverSeriesResult(winnerTeamId, loserTeamId)
- calculateStandings(teams, series, courtMatches, rules)
- sortStandings(standings, rules)
- getTeamSchedule(teamId, series, courtMatches)
Reglas:
- Una serie tiene 3 canchas.
- Gana la serie quien gana 2 de 3 canchas.
- Serie ganada: 2 puntos.
- Serie perdida: 1 punto.
- WO general: ganador suma 2 puntos, perdedor suma 0.
- WO general computa estadísticamente como:
 - 3-0 en canchas
 - 6-0 en sets
 - 36-0 en games
- WO de cancha individual se computa como 6-0 6-0.
- El tercer set, aunque sea supertiebreak, se registra como 7-6.
- Desempates:
 1. puntos
 2. diferencia de canchas
 3. diferencia de sets
 4. diferencia de games
 5. enfrentamiento entre equipos
Tests obligatorios:
- Serie 3-0
- Serie 2-1
- Partido con tercer set 7-6
- WO de cancha individual
- WO general
- Tabla con desempate por diferencia de canchas
- Tabla con desempate por diferencia de sets
- Tabla con desempate por diferencia de games
- Historial de equipo con partidos jugados y pendientes
- Detalle de canchas visible solo en partidos ya jugados