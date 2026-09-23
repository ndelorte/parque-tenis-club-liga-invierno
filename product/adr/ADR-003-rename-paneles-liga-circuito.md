# ADR-003: Rename de paneles `/panel-parque` → `/panel-liga`, `/panel-master` → `/panel-circuito`

Status: Accepted

## Contexto

El plan de implementación de Liga Multi-Temporada y Circuito del Parque
(`product/plan-liga-multitemporada-y-circuito.md`, Sprint C1) generaliza
"Mid Master" a una sección madre más amplia, "Circuito del Parque"
(torneos mensuales + torneos especiales como Mid Master + ranking anual).

Los nombres de panel admin heredados (`/panel-parque` para Liga,
`/panel-master` para Mid Master) quedaron desalineados con esa nueva
identidad: "parque" no distingue de qué sección es, y "master" ya no
describe la sección completa (Mid Master es solo un torneo especial
dentro de Circuito del Parque, no toda la sección).

## Decisión

- `app/panel-parque/*` → `app/panel-liga/*` (login, dashboard, todas las
  subrutas CRUD de Liga de Invierno).
- `app/panel-master/*` → `app/panel-circuito/*` (login, dashboard, carga de
  resultados de Mid Master).
- `proxy.ts` actualizado: `matcher` incluye las 4 rutas (viejas + nuevas);
  la variable `isMasterPanel` se renombra a `isCircuitoPanel`; las rutas
  viejas (`/panel-parque/*`, `/panel-master/*`) devuelven un redirect 301 a
  su equivalente nuevo **antes** de la lógica de autenticación.
- Los server actions (`app/actions/admin.ts`, `app/actions/auth.ts`,
  `app/actions/mid-master.ts`) actualizan sus `redirect()` y
  `revalidatePath()` a las rutas nuevas.
- El home (`app/page.tsx`) y `lib/site.ts` (`NAV_LINKS`, fuente real del
  nav — ver nota abajo) pasan a nombrar la sección pública como "Circuito
  del Parque" en vez de "Mid Master"; el componente
  `components/mid-master/MidMasterPromo.tsx` se renombra a
  `components/circuito/CircuitoPromo.tsx`. La ruta pública `/mid-master`
  **no se mueve todavía** — sigue funcionando como hoy hasta que el Sprint
  C2 generalice el data layer a multi-edición y pueda vivir bajo
  `/circuito-del-parque/especiales/[edition]`.

### Nota: `NAV_LINKS` vive en `lib/site.ts`, no en `components/layout/`

Durante este rename se detectó que `components/layout/Navbar.tsx` y
`components/layout/Footer.tsx` tienen su propia lista de links hardcodeada,
pero **no están importados en ningún lado** — el header/footer real del
sitio son `components/site-header.tsx` / `components/site-footer.tsx`, que
usan `NAV_LINKS` de `lib/site.ts`. Los archivos de `components/layout/`
quedan como código muerto; no se tocaron en este ADR. Si en el futuro se
detecta que también están desactualizados y se decide reactivarlos o
borrarlos, confirmar primero que siguen sin uso.

## Consecuencias

- Cualquier referencia vieja a `/panel-parque` o `/panel-master` (código,
  docs, memoria de una sesión de agente anterior) está obsoleta, salvo como
  redirect de compatibilidad en `proxy.ts` — no reintroducirlas como rutas
  reales.
- La política de acceso sigue centralizada en `proxy.ts` (consistente con
  [ADR-001](./ADR-001-rename-admin-a-panel-parque.md)): si cambia la lógica
  de quién puede entrar, ese es el único lugar que hay que tocar.
- ⛔ **OQ-24 (roles separados liga/circuito) queda postergada.** Este rename
  es solo de rutas — `isAdminUser()` sigue siendo un único rol compartido
  entre ambos paneles. No introducir roles nuevos ni checks de permisos
  diferenciados sin volver a levantar esa pregunta con el organizador.
- `reglas-mid-master.md` y este mismo documento (ADR-002) tenían un error
  de deuda documental (`mm_` en vez de `mid_master_`, `panel-master` en vez
  de `panel-circuito`) — corregido junto con este ADR.
