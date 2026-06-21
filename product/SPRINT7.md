Conectá la app a Supabase.
Crear:
- variables de entorno
- cliente Supabase para server
- cliente Supabase para browser si hace falta
- tipos TypeScript
- queries en /lib/data
- migraciones SQL en /supabase/migrations
Tablas:
- tournaments
- categories
- teams
- players
- team_players
- rounds
- series
- court_matches
- standings_snapshot
15
Requisitos:
- No guardar claves privadas en el repo.
- Usar RLS donde corresponda.
- La lectura pública de Liga de Invierno debe estar permitida.
- La escritura debe estar restringida a admins.
- No exponer teléfonos de jugadores ni capitanes públicamente.
- Mostrar públicamente solo nombre de capitán.
- Actualizar README con pasos de configuración.