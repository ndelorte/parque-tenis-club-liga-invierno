Ajustá el Sprint 8 para importar datos reales iniciales de Liga de Invierno.

Necesitamos tres importadores o un flujo equivalente:

1. Importador de equipos/listas de buena fe
2. Importador de fixture
3. Validación de datos importados

IMPORTADOR DE LISTAS DE BUENA FE

Crear:
/scripts/import-rosters.ts

CSV esperado:
categoria,equipo,capitan,jugador

Ejemplo:
Caballeros A,Los Halcones,Juan Pérez,Juan Pérez
Caballeros A,Los Halcones,Juan Pérez,Martín Gómez
Caballeros A,Los Halcones,Juan Pérez,Federico Díaz
Caballeros A,Drop Shot,Carlos López,Carlos López
Caballeros A,Drop Shot,Carlos López,Tomás Ruiz

Debe:
- validar que la categoría exista
- crear el equipo si no existe
- generar slug del equipo
- guardar captain_name en teams
- crear el jugador si no existe
- generar display_name
- asociar jugador al equipo en team_players
- marcar is_captain si jugador coincide con capitan
- evitar duplicados de equipo por category_id + slug
- evitar duplicados de jugador dentro del mismo equipo
- validar que un jugador no esté activo en dos equipos de la misma categoría
- permitir que un jugador esté en equipos de categorías diferentes
- permitir dry-run
- reportar errores claros

Comandos:
npm run import:rosters -- --file ./data/listas-buena-fe.csv --dry-run
npm run import:rosters -- --file ./data/listas-buena-fe.csv

IMPORTADOR DE FIXTURE

Crear:
/scripts/import-fixture.ts

CSV esperado:
categoria,fase,fecha_numero,fecha_nombre,equipo_local,equipo_visitante,dia,hora

Ejemplo:
Caballeros A,regular,1,Fecha 1,Los Halcones,Drop Shot,2026-07-10,20:00

Debe:
- validar que la categoría exista
- validar que equipo_local exista en esa categoría
- validar que equipo_visitante exista en esa categoría
- crear rounds si no existen
- crear series
- evitar duplicados
- permitir dry-run
- reportar errores claros

Importante:
- El importador de fixture NO debe crear equipos por defecto.
- Si falta un equipo, debe fallar indicando equipo y categoría.
- El orden correcto es:
  1. importar listas de buena fe
  2. importar fixture

VALIDACIÓN

Crear un comando o función que revise:
- cantidad de equipos por categoría
- cantidad de jugadores por equipo
- equipos sin capitán
- equipos sin jugadores
- fixture con equipos inexistentes
- series duplicadas
- fechas sin horario

Actualizar README con instrucciones.
No borrar datos reales automáticamente.