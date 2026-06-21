# Open Questions — Parque Tenis Club Web

> Gaps identificados al leer el PRD. No implementar nada relacionado a estas preguntas hasta tener respuesta.
> Preguntar al organizador del torneo antes de decidir.

---

## Pendientes

### OQ-02: ¿Cómo se maneja el bye en la categoría de 5 equipos (Mixto B)?

**Contexto**: En un todos-contra-todos con número impar de equipos (Mixto B = 5 equipos), un equipo queda libre cada fecha.

**Preguntar**:
- ¿Se muestra en el fixture que ese equipo tiene fecha libre?
- ¿El equipo que descansa acumula "partido jugado" o no?
- ¿Aparece en la tabla como "Serie jugada: 0" ese día?

**Impacto**: Afecta la generación del fixture, el conteo de `played` en `standings_snapshot` y el campo `round_number` de `rounds`.

---

### OQ-03b: ¿Qué pasa si sigue el empate después de todos los criterios H2H?

**Contexto**: Se definieron los criterios 5a–5c para enfrentamiento directo (diferencia de canchas, sets y games en H2H). Pero no está definido qué pasa si dos o más equipos siguen exactamente empatados después de 5c.

**Preguntar**: ¿Hay algún criterio de desempate final (sorteo, orden alfabético, etc.)?

**Impacto**: Afecta el caso borde final de `sortStandings()`.

---

### OQ-06: ¿Un jugador de Caballeros A puede también jugar en Caballeros B?

**Contexto**: El PRD dice "A y B cuentan como categorías diferentes", lo que implicaría que sí puede.

**Preguntar**:
- ¿Confirmado? ¿Un jugador puede estar en la lista de buena fe de Caballeros A y también de Caballeros B simultáneamente?
- ¿Hay alguna restricción de nivel entre A y B?

**Impacto**: Afecta la restricción en `team_players` y las validaciones del admin.

---

### OQ-08: ¿Qué pasa si un resultado cargado necesita convertirse en WO general?

**Contexto**: El PRD permite editar resultados (sección 16.7) y cargar WO general (sección 16.6), pero no describe el flujo de conversión.

**Preguntar**:
- ¿Se borran los `court_matches` existentes?
- ¿Se reemplazan por los valores de WO (3-0, 6-0, 36-0)?
- ¿O se mantienen los resultados reales y solo se agrega el flag `is_general_walkover`?

**Impacto**: Afecta el admin de resultados y el recálculo de standings.

---

### OQ-09: ¿Cuál es el número de WhatsApp del club?

**Contexto**: El CTA principal del home es "Consultar por WhatsApp".

**Preguntar**: ¿Cuál es el número de WhatsApp del club? ¿Formato: 54 9 11 XXXX-XXXX?

---

### OQ-10: ¿Cuál es la dirección exacta del club?

**Contexto**: El home tiene una sección "Ubicación / Cómo llegar".

**Preguntar**: ¿Cuál es la dirección del club? ¿Hay un link de Google Maps?

---

### OQ-11: ¿Cuál es el dominio actual del club?

**Contexto**: El PRD dice "el dominio actual del club debe apuntar a esta nueva web".

**Preguntar**: ¿Cuál es el dominio? ¿parquetenis.com.ar? ¿Otro?

---

### OQ-12: ¿Hay fotos reales del club disponibles?

**Contexto**: El diseño requiere "muchas fotos reales del club".

**Preguntar**: ¿Hay fotos disponibles? ¿En qué formato/resolución? ¿Hay restricciones de uso?

---

### OQ-13: ¿Cuáles son las fechas de inicio y fin de la Liga de Invierno 2026?

**Contexto**: El modelo `tournaments` tiene `start_date` y `end_date`.

**Preguntar**: ¿Cuándo arranca y cuándo termina la Liga de Invierno 2026?

---

### OQ-14: ¿Cómo se crean las cuentas admin de Nicolás y su hermano?

**Contexto**: El PRD define dos admins iniciales pero no describe si hay flujo de signup o creación manual.

**Preguntar**:
- ¿Las cuentas se crean manualmente en el dashboard de Supabase?
- ¿O hay un flujo de invitación?
- ¿Puede haber admins adicionales en el futuro?

---

### OQ-15: ¿El fixture ya hecho a mano está en algún formato digital?

**Contexto**: El PRD dice "el fixture ya existe hecho a mano y debe digitalizarse", y define un importador CSV.

**Preguntar**: ¿El fixture está en Excel, papel, WhatsApp? ¿Hay que digitalizarlo primero o se puede exportar directamente a CSV?

---

## Resueltas

### ~~OQ-01~~: ¿Cuál categoría tiene 5 equipos?

**Respuesta**: **Mixto B** tiene 5 equipos. El resto de las categorías tienen 6.

---

### ~~OQ-03~~: ¿Cómo funciona el desempate por enfrentamiento directo?

**Respuesta**: Se arma una mini-tabla solo con los equipos empatados, usando únicamente los resultados de los partidos entre ellos. Criterios dentro de la mini-tabla:

```
5a. Puntos en enfrentamientos directos
5b. Diferencia de canchas en enfrentamientos directos
5c. Diferencia de sets en enfrentamientos directos
5d. Diferencia de games en enfrentamientos directos
```

Para 2 equipos: se comparan las 2 series entre ellos (ida y vuelta).
Para 3 o más: mini-tabla entre el subconjunto completo.

**Nota de implementación**: Se agregó "puntos" como primer criterio H2H (Sprint 6b) — es el criterio estándar de mini-tabla que permite ordenar cuando un equipo ganó más series directas. Los criterios de diferencias (5b–5d) aplican cuando los puntos H2H están empatados.

**Residual**: ver OQ-03b para el caso de empate aun después de 5d.

---

### ~~OQ-04~~: ¿El score del tercer set puede ser distinto de "7-6"?

**Respuesta**: No. El tercer set **siempre se registra como `7-6`**, independientemente del resultado real del supertiebreak. `parseScore` debe aceptar y esperar ese valor fijo para el tercer set.

---

### ~~OQ-05~~: ¿Puede haber WO de cancha en más de una cancha de la misma serie?

**Respuesta**: No. El WO de cancha es siempre de **exactamente 1 cancha**. Un equipo no puede presentar solo 1 cancha con jugadores — el mínimo es 2.

| Canchas con jugadores | Canchas en WO | Clasificación |
|-----------------------|---------------|---------------|
| 3 | 0 | Serie normal |
| 2 | 1 | WO de cancha individual |
| 1 | 2 | WO general |
| 0 | 3 | WO general |

---

### ~~OQ-07~~: ¿Los playoffs son por categoría o cruzados?

**Respuesta**: Cada categoría tiene sus **propios playoffs independientes**. No hay final general entre categorías.

---

### ~~OQ-16~~: ¿`standings_snapshot` necesita historial o solo el estado actual?

**Respuesta**: Solo el **estado actual**. No se necesita historial por fecha. El snapshot siempre refleja la tabla vigente y se sobreescribe en cada recálculo.
