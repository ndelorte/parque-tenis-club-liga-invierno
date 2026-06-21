# Reglas de desarrollo — Parque Tenis Club Web

> Principios y restricciones que rigen cómo se construye este proyecto.
> Fuente: PRD secciones 5 y 24.

---

## 1. No inferir reglas deportivas

Si falta una regla deportiva, **no inventarla**.

Registrar el gap en:
```
/product/open-questions.md
```

Preguntar al organizador antes de implementar.

---

## 2. Separar lógica de UI

Toda la lógica del torneo (cálculo de tabla, scores, WO, desempates) vive en:
```
/lib/tournament/
```

Los componentes de UI solo consumen datos ya calculados. **Nunca calcular en el componente.**

---

## 3. Tests obligatorios para lógica deportiva

Toda función en `/lib/tournament/` debe tener tests.

Casos mínimos obligatorios:

| Caso | Test |
|------|------|
| Serie 3-0 | ✓ |
| Serie 2-1 | ✓ |
| Tercer set 7-6 | ✓ |
| WO de cancha individual | ✓ |
| WO general | ✓ |
| Desempate por diferencia de canchas | ✓ |
| Desempate por diferencia de sets | ✓ |
| Desempate por diferencia de games | ✓ |
| Historial de equipo con jugados y pendientes | ✓ |
| Detalle de canchas solo en partidos jugados | ✓ |
| Edición de resultado recalcula tabla | ✓ |
| Reprogramación cambia fecha sin alterar resultado | ✓ |

---

## 4. Mobile first

La mayoría de los usuarios entra desde WhatsApp o Instagram.

- Diseñar primero para pantalla de 375px.
- La tabla en mobile muestra versión resumida: Pos, Equipo, PJ, PG, PP, Pts, Dif.
- Al expandir, mostrar canchas, sets y games.

---

## 5. Admin privado e invisible

- El home público no debe mostrar ningún link al admin.
- El admin vive en `/admin/login`.
- No referenciar `/admin` en ninguna página pública, navbar ni footer.

---

## 6. La tabla se calcula desde resultados

- **Prohibido editar puntos manualmente** en `standings_snapshot`.
- Cada vez que se carga o edita un resultado, recalcular la tabla completa de la categoría.
- Al editar un resultado: recalcular desde cero para esa categoría (no sumar sobre lo anterior).

---

## 7. Datos sensibles

- No mostrar teléfonos en ninguna vista pública.
- No commitear `.env` ni claves de Supabase.
- No exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente.

Solo se muestran públicamente:
```
nombre del jugador
nombre del capitán
```

---

## 8. Stack definido — no desviar

Usar:
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Postgres + Auth)
- Vercel
- React Hook Form + Zod
- Vitest o Jest

No usar:
- Backend Express separado
- MongoDB
- Webflow / Wix / Framer
- Lógica de tabla cargada manualmente

---

## 9. Checklist de cierre de sprint

Antes de cerrar cada sprint:

```
[ ] lint pasa
[ ] build pasa
[ ] tests pasan
[ ] informar archivos modificados
[ ] informar qué queda pendiente
```

---

## 10. Flujo de trabajo con el PRD

Antes de modificar código:

1. Leer el PRD: `/product/PRD_PARQUE_TENIS_LIGA_INVIERNO.md`
2. Leer `/product/reglas-liga-invierno.md`
3. Leer `CLAUDE.md`
4. Identificar gaps → agregarlos a `/product/open-questions.md`
5. No inferir reglas deportivas
6. Trabajar por sprint

**Si una decisión cambia: primero actualizar el PRD, luego el código.**
