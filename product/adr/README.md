# ADR — Architecture Decision Records

Decisiones estructurales del proyecto que ya se implementaron y que, si se
pierden en el historial de chat o de commits, alguien terminaría
"redescubriéndolas" o revirtiéndolas por error.

No es para reglas deportivas (eso vive en `reglas-liga-invierno.md` /
`reglas-mid-master.md`) ni para tareas de sprint (eso vive en `sprintN.md`).
Es específicamente para decisiones de **arquitectura o estructura** con
consecuencias que no son obvias mirando solo el código.

## Cuándo agregar un ADR nuevo

Cuando se tome una decisión que:

- sea difícil de revertir sin repetir la investigación, o
- alguien (humano o agente) podría "corregir" por error si no conoce el motivo, o
- afecte a más de un módulo/ruta y no esté documentada en otro lado.

No crear un ADR por cada cambio — solo cuando el "por qué" no es obvio desde
el diff.

## Formato

Cada ADR es un archivo `ADR-XXX-titulo-corto.md` con:

```md
# ADR-XXX: Título

Status: Proposed | Accepted | Rejected | Deprecated

## Contexto
Qué problema había, qué se pidió, qué restricciones existían.

## Decisión
Qué se decidió hacer, concretamente.

## Consecuencias
Qué implica para el código a futuro. Qué NO hay que hacer por error.
```

## Índice

| ADR | Título | Status |
|---|---|---|
| [ADR-001](./ADR-001-rename-admin-a-panel-parque.md) | Renombrar panel admin de `/admin` a `/panel-parque` + auth vía `proxy.ts` | Accepted |
| [ADR-002](./ADR-002-mid-master-modulo-aislado.md) | Mid Master como módulo aislado (prefijo `mid_master_`, sin reuso de `lib/tournament/`) | Accepted |
| [ADR-003](./ADR-003-rename-paneles-liga-circuito.md) | Rename de paneles `/panel-parque` → `/panel-liga`, `/panel-master` → `/panel-circuito` | Accepted |
| [ADR-004](./ADR-004-mid-master-multi-edicion.md) | Mid Master pasa de una edición implícita a N ediciones (`edition_id`) | Accepted |
| [ADR-005](./ADR-005-prefijo-tablas-circuito.md) | Prefijo `circuito_` para las tablas nuevas del Circuito del Parque, tipadas desde el día 1 | Accepted |
| [ADR-006](./ADR-006-interparque-modulo-aislado.md) | Interparque como módulo aislado (prefijo `interparque_`, jugadores propios, sin snapshot de standings) | Accepted |
