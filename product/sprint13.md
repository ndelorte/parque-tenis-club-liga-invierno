Necesito agregar seguridad real al panel admin antes de publicar la web.

Problema:
Actualmente si alguien entra manualmente a /admin podría acceder al panel. Necesito que /admin y todas sus subrutas estén protegidas por login.

Objetivo:
Agregar autenticación de administrador usando Supabase Auth.

Requisitos:

1. Rutas públicas:

* / debe seguir siendo pública
* /liga-invierno debe seguir siendo pública
* /liga-invierno/categorias/[slug] debe seguir siendo pública
* /liga-invierno/equipos/[slug] debe seguir siendo pública

2. Rutas privadas:
   Proteger:

* /admin
* /admin/*
* todas las rutas de carga/edición de resultados
* todas las rutas de carga/edición de fixture
* todas las rutas de importación o acciones sensibles
* todas las API routes bajo /api/admin/*

3. Login:
   Crear o revisar:

* /admin/login

El login debe pedir:

* email
* password

Debe autenticar con Supabase Auth.

4. Redirecciones:

* Si un usuario no autenticado intenta entrar a /admin, redirigir a /admin/login.
* Si un usuario autenticado entra a /admin/login, redirigir a /admin.
* Agregar botón “Cerrar sesión” dentro del admin.

5. Roles:
   No cualquier usuario autenticado puede ser admin.
   Agregar control de rol admin.

Opciones aceptables:

* usar una tabla admin_users con user_id o email
* o usar metadata/claims de Supabase si ya está implementado

Requisito:
Solo los usuarios marcados como admin pueden entrar al panel.

6. Seguridad real:
   No alcanza con proteger componentes visuales.
   También proteger server actions/API routes.
   Antes de modificar datos, cada endpoint debe verificar:

* usuario autenticado
* usuario con rol admin

7. Supabase:
   Usar las variables existentes:

* NEXT_PUBLIC_SUPABASE_URL
* NEXT_PUBLIC_SUPABASE_ANON_KEY
* SUPABASE_SERVICE_ROLE_KEY solo del lado servidor si hace falta

Nunca exponer SUPABASE_SERVICE_ROLE_KEY al cliente.

8. Middleware:
   Evaluar si conviene usar middleware.ts para proteger rutas /admin.
   Si se usa middleware, mantenerlo simple y seguro.

9. RLS:
   Revisar Row Level Security.
   Las tablas públicas pueden permitir lectura pública si corresponde.
   Las operaciones de escritura deben estar restringidas a admin.
   No dejar permisos públicos de insert/update/delete sobre tablas sensibles.

10. Admin inicial:
    Crear instrucciones claras para crear el primer usuario admin:

* desde Supabase Dashboard Auth Users
* o mediante script seguro
* documentarlo en README

11. Tests/verificación:
    Agregar una checklist manual:

* entrar a /admin sin login redirige a /admin/login
* login correcto entra a /admin
* usuario no admin no puede entrar
* logout funciona
* APIs admin rechazan usuarios no autenticados
* APIs admin rechazan usuarios no admin
* páginas públicas siguen funcionando

Importante:

* No cambiar reglas deportivas.
* No modificar cálculo de tabla.
* No tocar importadores salvo que tengan endpoints admin inseguros.
* No exponer admin en navbar/footer.
* Ejecutar npm run lint y npm run build al terminar.
* Informar archivos modificados.


y tambien Quiero cambiar la ruta pública del panel administrativo para que no sea /admin.

Objetivo:
Reemplazar /admin por una ruta menos obvia para el panel de gestión.

Nueva ruta deseada:
Usar /panel-parque

Cambios requeridos:

* /admin debe dejar de ser la ruta principal del panel.
* El login debe pasar de /admin/login a /panel-parque/login.
* El dashboard debe pasar de /admin a /panel-parque.
* Todas las subrutas administrativas deben pasar a:

  * /panel-parque/*
* Actualizar todos los links internos del panel.
* No mostrar ningún link al panel en navbar/footer público.

Seguridad:

* Este cambio NO reemplaza el login.
* Mantener o implementar login obligatorio.
* Si un usuario no autenticado entra a /panel-parque o /panel-parque/*, redirigir a /panel-parque/login.
* Si un usuario autenticado entra a /panel-parque/login, redirigir a /panel-parque.
* Solo usuarios con rol admin pueden acceder.
* Proteger también todas las acciones/API sensibles.

Compatibilidad:

* Si alguien entra a /admin, devolver 404 o redirigir a /panel-parque/login.
* Preferencia: devolver 404 para que /admin no revele el panel.
* No cambiar rutas públicas:

  * /
  * /liga-invierno
  * /liga-invierno/categorias/[slug]
  * /liga-invierno/equipos/[slug]

APIs:

* Revisar rutas /api/admin/*
* Pueden seguir llamándose /api/admin/* si están bien protegidas por auth y rol admin.
* Pero cada endpoint sensible debe validar:

  * usuario autenticado
  * usuario con rol admin

Documentación:
Actualizar README o documentación interna indicando:

* URL del panel: /panel-parque
* cómo crear usuario admin
* cómo probar protección antes de publicar

Checklist obligatorio:

* /admin no muestra el panel.
* /panel-parque sin login redirige a /panel-parque/login.
* /panel-parque/login permite iniciar sesión.
* usuario no admin no puede entrar.
* usuario admin puede entrar.
* logout funciona.
* APIs sensibles no permiten escritura sin login.
* páginas públicas siguen funcionando.

Al terminar:

* Ejecutar npm run lint
* Ejecutar npm run build
* Informar archivos modificados.
