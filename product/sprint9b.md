Quiero agregar una funcionalidad nueva al panel admin de Liga de Invierno: generar una planilla PDF automática para cada serie del fixture.

Contexto:
En el admin, dentro de la sección de fixture o resultados, cada serie debe tener una opción/botón llamado “Ver planilla”.

Ruta sugerida:
- /admin/liga-invierno/fixture/[seriesId]/planilla
o acción desde la lista de fixture que abra/genera el PDF.

Objetivo:
Generar automáticamente un PDF imprimible con los datos de la serie para usar el día del partido.

Datos que debe mostrar la planilla:

1. Encabezado:
- Logo de Liga de Invierno, si está disponible.
- Título: “Liga de Invierno”.
- Nombre del club: “Parque Tenis Club”.

2. Datos generales:
- Categoría. Ejemplo: Caballeros A.
- Instancia / fecha. Ejemplo: Fecha 1.
- Día y horario. Ejemplo: 27-06-2026 19:30 hs.
- Equipos enfrentados. Ejemplo: Doble Falta vs Los Campeones.

3. Lista de buena fe:
- Dos columnas, una por equipo.
- Cada columna debe tener un recuadro.
- Título de cada columna con el nombre del equipo.
- Debajo, lista de jugadores habilitados de ese equipo.
- Mostrar nombre y apellido/display_name.
- No mostrar teléfonos ni datos privados.

4. Recuadro de resultados:
Crear una tabla para completar manualmente los resultados de las 3 canchas.

Filas:
- Cancha 1
- Cancha 2
- Cancha 3

Columnas:
- Set 1 Local
- Set 1 Visitante
- Set 2 Local
- Set 2 Visitante
- Set 3 Local
- Set 3 Visitante
- W.O.
- Ganador

El diseño debe dejar espacio en blanco suficiente para escribir a mano.

5. Observaciones:
- Recuadro grande para observaciones.

6. Firmas:
- Recuadro para firma del capitán del equipo local.
- Recuadro para firma del capitán del equipo visitante.

Importante:
- Tomar como referencia conceptual una planilla de torneo con datos de partido, formación, resultado, W.O., firmas y observaciones.
- No copiar diseño exacto de terceros.
- Crear un diseño propio para Parque Tenis Club / Liga de Invierno.
- Estética limpia, imprimible, blanco y negro con detalles en verde/naranja si corresponde.
- Formato A4 vertical.
- Debe poder imprimirse correctamente.

Implementación técnica:
- Evaluar la mejor librería para generar PDF en Next.js.
- Preferir una solución compatible con server-side.
- No generar el PDF en el cliente si eso complica la impresión.
- Crear una función reutilizable para generar planilla de una serie.
- La planilla debe obtener datos reales desde la capa de datos:
  - series
  - category
  - round
  - home_team
  - away_team
  - team_players
  - players

Si todavía no está Supabase conectado o los datos reales no están disponibles, implementar primero con mocks respetando la misma estructura de datos.

Rutas/API sugeridas:
- GET /api/admin/series/[seriesId]/planilla.pdf

Comportamiento:
- Desde el admin, botón “Ver planilla”.
- Al hacer click, abrir el PDF en una nueva pestaña.
- El PDF debe generarse con los datos actuales de la serie.
- Si una serie fue reprogramada, mostrar scheduled_date y scheduled_time actualizados.
- Si existe original_scheduled_date/original_scheduled_time, no hace falta mostrarlos en la planilla salvo que sea útil.

Seguridad:
- Esta funcionalidad es del admin.
- No linkear desde páginas públicas.
- Proteger la ruta si ya existe autenticación admin.
- No exponer datos privados.
- Solo mostrar nombres de jugadores y capitanes.

Archivos sugeridos:
- lib/pdf/generateMatchSheetPdf.ts
- app/api/admin/series/[seriesId]/planilla.pdf/route.ts
- components/admin/fixture/MatchSheetButton.tsx

Tests / validaciones:
- Verificar que si la serie existe, genera PDF.
- Verificar que si la serie no existe, devuelve error claro.
- Verificar que no muestra teléfonos.
- Verificar que lista jugadores de ambos equipos.
- Verificar que usa la fecha reprogramada si corresponde.

Actualizar documentación:
- product/backlog.md
- product/rutas.md
- product/modelo-datos.md si hace falta
- README con cómo probar la generación de planilla

No modificar reglas deportivas.
No modificar cálculo de tabla.
No modificar importadores.
No cambiar rutas públicas.