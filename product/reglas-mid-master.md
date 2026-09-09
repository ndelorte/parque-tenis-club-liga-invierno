# Reglas — Mid Master

> Torneo especial de mitad de año. Completamente independiente de Liga de Invierno.
> Fuente de verdad para toda lógica deportiva del módulo Mid Master.

---

## Categorías

| Categoría | Tipo | Zonas | Jugadores/parejas por zona |
|-----------|------|-------|---------------------------|
| Single Caballeros Primera | Singles | 2 | 4 |
| Single Caballeros Intermedia | Singles | 2 | 4 |
| Single Caballeros Segunda | Singles | 2 | 4 |
| Single Caballeros Tercera | Singles | 2 | 4 |
| Single Caballeros +50 | Singles | 2 | 4 |
| Single Damas Segunda | Singles | 2 | 3 |
| Doble Caballeros Segunda | Dobles | 2 | 4 |
| Doble Mixto Segunda | Dobles | 2 | 4 |

**Excepción**: Single Damas Segunda tiene 2 zonas de 3 jugadoras (no 4).

---

## Formato del torneo

### Fase de zonas

- Cada zona juega todos contra todos (round-robin).
- Zona A: 4 participantes → 6 partidos por zona (3 en Damas Segunda).
- Zona B: ídem.
- Los 2 primeros de cada zona avanzan a semifinales.

### Semifinales

```
Semifinal 1: 1° Zona A vs 2° Zona B
Semifinal 2: 1° Zona B vs 2° Zona A
```

### Final

```
Ganador SF1 vs Ganador SF2
```

---

## Formato de partido

### Fase de zonas y semifinales

- Al mejor de 3 sets.
- El tercer set, si llega, es **supertiebreak**.
- El tercer set **siempre se registra como `7-6`**, independientemente del marcador real.

### Final

- A 3 sets completos (sin supertiebreak).
- El tercer set se registra con score real (ej: `6-4`).

---

## Sistema de clasificación en zonas

No hay puntos. Se usa directamente el número de partidos ganados.

| Métrica | Descripción |
|---------|-------------|
| `played` | Partidos jugados |
| `won` | Partidos ganados |
| `lost` | Partidos perdidos |
| `sets_won` / `sets_lost` | Sets totales |
| `games_won` / `games_lost` | Games totales |

---

## Criterios de desempate (dentro de una zona)

Orden:

```
1. Partidos ganados (won)
2. Diferencia de sets (sets_won - sets_lost)
3. Diferencia de games (games_won - games_lost)
4. Enfrentamiento directo H2H
```

Para H2H entre 2 participantes: se compara el único partido entre ellos (ganador, luego sets y games de ese partido).

Para H2H entre 3 o más: mini-tabla con los partidos entre el subconjunto empatado.

---

## Walkover

**No hay walkover en el Mid Master.**

---

## Participantes

- **Singles**: un jugador por participante.
- **Dobles**: dos jugadores por participante (pareja).
- Los jugadores pueden ser los mismos que participan en Liga de Invierno (comparten la tabla `players` de la base de datos).
- No se necesita página pública individual por jugador.

---

## Vistas públicas

| Ruta | Contenido |
|------|-----------|
| `/circuito-del-parque/especiales/[edition]` | Portal de la edición: descripción, lista de categorías |
| `/circuito-del-parque/especiales/[edition]/categorias/[slug]` | Zona A + Zona B (tabla + fixture), bracket semifinal/final |

`/mid-master` y `/mid-master/categorias/[slug]` quedan como redirects 301 a la
edición `mid-master-2026` (Sprint C2 — ver ADR-004). Puede haber más de una
edición (ej. Final Master) bajo `especiales/[edition]`.

No hay página por jugador ni por pareja.

---

## Notas de implementación

- No reutilizar lógica de `lib/tournament/` salvo `parseScore` (función pura).
- Toda lógica deportiva propia en `lib/mid-master/`.
- Tablas Supabase con prefijo `mid_master_` para aislamiento total (corregido —
  el prefijo real en el código es `mid_master_`, no `mm_`; ver ADR-002).
- Panel admin en `/panel-circuito/` — mismo Supabase Auth que `/panel-liga/`
  (rename de rutas, Sprint C1 — ver ADR-003).
