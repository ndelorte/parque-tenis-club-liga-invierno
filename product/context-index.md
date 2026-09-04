# Context Index — Parque Tenis Club Web

Mapa rápido de "si la tarea toca X, leé Y". No reemplaza los documentos — evita
tener que abrirlos todos para saber cuál corresponde antes de tocar código.

---

## Reglas deportivas (canónico — nunca inferir)

| Si la tarea toca... | Leer |
|---|---|
| Liga de Invierno: puntos, WO, desempate, formato de serie | `reglas-liga-invierno.md` |
| Mid Master: zonas, semifinales, desempate, formato de partido | `reglas-mid-master.md` |
| Una regla deportiva que no aparece en ninguno de los dos | No inventarla — agregarla a `open-questions.md` |

## Producto / alcance

| Si la tarea toca... | Leer |
|---|---|
| Qué construir, features, prioridad | `PRD_PARQUE_TENIS_LIGA_INVIERNO.md` |
| Objetivos, usuarios, alcance del MVP | `vision.md` |
| Qué falta, próximos sprints | `backlog.md` |
| Un gap o una duda sobre una regla existente | `open-questions.md` |

## Arquitectura y decisiones

| Si la tarea toca... | Leer |
|---|---|
| Esquema de tablas Supabase (Liga de Invierno + Mid Master) | `modelo-datos.md` |
| Por qué se tomó una decisión estructural (rename de rutas, aislamiento de un módulo, etc.) | `adr/README.md` y el ADR correspondiente |
| Principios generales de desarrollo (no reglas deportivas) | `reglas.md` |

## Historial de sprints

Los archivos `sprintN.md` (`sprint3.md` … `sprint14.md`, `SPRINT7.md`) son el
pedido original de cada sprint tal como lo dio el usuario. Sirven para
entender **por qué** algo se implementó de una forma, no como fuente de
verdad del estado actual. Si un sprint viejo contradice `reglas-liga-invierno.md`,
`reglas-mid-master.md` o el código actual, gana el código/reglas actuales.

---

## Jerarquía de autoridad

```
reglas-liga-invierno.md / reglas-mid-master.md  → reglas deportivas (canónico)
PRD                                              → alcance y features
modelo-datos.md                                  → esquema pretendido
adr/                                              → decisiones estructurales aceptadas
código actual                                     → comportamiento implementado
tests                                             → comportamiento verificado
sprintN.md                                        → contexto histórico, no autoritativo
```

Si un doc viejo contradice el código actual: confiar en el código, señalarlo
al usuario, y no "arreglar" el código para que la documentación vieja tenga
razón.
