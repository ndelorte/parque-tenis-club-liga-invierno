# ADR-001: Renombrar panel admin de `/admin` a `/panel-parque` + auth vía `proxy.ts`

Status: Accepted

## Contexto

Antes de publicar la web (Sprint 13), `/admin` no tenía autenticación real:
cualquiera que entrara manualmente a esa URL veía el panel. Además, `/admin`
es una ruta predecible — cualquiera podía adivinarla y probar acceder.

El pedido del sprint tenía dos partes:

1. Agregar autenticación real (Supabase Auth + rol admin) sobre las rutas
   administrativas y sobre los server actions/API sensibles, no solo sobre
   los componentes visuales.
2. Cambiar la ruta pública del panel a algo menos obvio, para que ni
   siquiera aparezca como "existe un admin acá".

## Decisión

- El panel pasó de `app/admin/*` a `app/panel-parque/*` (login, dashboard,
  todas las subrutas CRUD de Liga de Invierno).
- La protección se implementó en `proxy.ts` (reemplazo de `middleware.ts` en
  Next.js 16), que:
  - valida la sesión contra Supabase con `supabase.auth.getUser()` — no solo
    lee la cookie, la valida contra el servidor;
  - chequea rol admin con `isAdminUser(user)` (`lib/auth/admin.ts`);
  - redirige a `/panel-parque/login` si no hay sesión válida o el usuario no
    es admin, y de `/panel-parque/login` a `/panel-parque` si ya está
    autenticado como admin.
- El mismo mecanismo se extendió a `/panel-master` (panel de Mid Master, ver
  [ADR-002](./ADR-002-mid-master-modulo-aislado.md)) — comparten
  `isAdminUser()` pero son rutas separadas en el `matcher` de `proxy.ts`.
- Regla en `CLAUDE.md` ("Admin invisible"): ni `/panel-parque` ni
  `/panel-master` se linkean desde navbar, footer, ni ninguna página
  pública.

## Consecuencias

- Cualquier referencia vieja a `/admin` (en código, docs, memoria de una
  sesión de agente anterior) está obsoleta. `/admin` ya no existe como
  panel.
- La política de acceso vive en un solo archivo (`proxy.ts`). Si cambia la
  lógica de quién puede entrar, ese es el único lugar que hay que tocar —
  no agregar checks de auth duplicados en cada página.
- `panel-parque` y `panel-master` deben mantenerse sincronizados si cambia
  la lógica de roles, porque comparten `isAdminUser()` pero no comparten
  rutas ni matcher.
