Antes de pasar al Sprint de Supabase, ajustá la lógica del torneo y rutas según esta revisión.

1. Rutas:
- Eliminar o redirigir la ruta /liga-invierno/equipo/[slug].
- La ruta oficial debe ser /liga-invierno/equipos/[slug].
- Actualizar todos los links internos para usar /liga-invierno/equipos/[slug].

2. parseScore:
Agregar validaciones:
- no aceptar score vacío
- no aceptar sets mal formateados
- no aceptar sets empatados como 6-6
- no aceptar más de 3 sets
- no aceptar menos de 2 sets
- si hay tercer set, solo aceptar 7-6 o 6-7
- agregar tests para cada caso inválido

3. calculateSeriesResult:
- Para una serie completada, validar que existan exactamente 3 canchas con score válido.
- No permitir calcular una serie completada con 1 o 2 canchas solamente.
- Agregar tests para serie incompleta.

4. H2H:
- Documentar en open-questions.md si la regla de enfrentamiento directo todavía no está confirmada.
- Si se implementa, usar:
  1. puntos en enfrentamientos directos
  2. diferencia de canchas en enfrentamientos directos
  3. diferencia de sets en enfrentamientos directos
  4. diferencia de games en enfrentamientos directos
- Agregar tests para H2H con ida y vuelta.

5. Ejecutar:
- npm test
- npm run lint
- npm run build

Informar archivos modificados y cualquier gap pendiente.