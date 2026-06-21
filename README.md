# Parque Tenis Club Web

Web institucional del Parque Tenis Club + Liga de Invierno.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · Vercel

---

## Configuración inicial

### 1. Variables de entorno

```bash
cp .env.example .env.local
```

Completar `.env.local` con los valores del proyecto Supabase:

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key (Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **nunca exponer al browser** |

### 2. Base de datos

Las migraciones están en `/supabase/migrations/`. Ejecutarlas en orden en el editor SQL de Supabase:

```
001_schema.sql   — tablas, FKs, índices
002_rls.sql      — Row Level Security (lectura pública, escritura solo autenticados)
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Correr en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm test` | Tests (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run import:rosters` | Importar listas de buena fe desde CSV |
| `npm run import:fixture` | Importar fixture desde CSV |
| `npm run validate:data` | Validar datos importados |

---

## Importación de datos iniciales

### Orden de importación

```
1. Ejecutar migraciones SQL en Supabase
2. Crear el torneo y las categorías en Supabase (manualmente o por SQL seed)
3. Importar listas de buena fe (equipos y jugadores)
4. Importar fixture (fechas y series)
5. Validar datos
```

### Listas de buena fe

Crear `data/listas-buena-fe.csv` con el formato:

```csv
categoria,equipo,capitan,jugador
Caballeros A,Los Halcones,Juan Pérez,Juan Pérez
Caballeros A,Los Halcones,Juan Pérez,Martín Gómez
Caballeros A,Drop Shot,Carlos López,Carlos López
```

- `categoria` debe coincidir exactamente con el nombre de la categoría en Supabase.
- El `capitan` debe aparecer también como `jugador` en alguna fila del mismo equipo.
- Un jugador puede estar en equipos de **distintas** categorías, pero no en dos equipos de la misma categoría.

```bash
# Probar sin escribir nada
npm run import:rosters -- --file ./data/listas-buena-fe.csv --dry-run

# Importar
npm run import:rosters -- --file ./data/listas-buena-fe.csv
```

### Fixture

Crear `data/fixture.csv` con el formato:

```csv
categoria,fase,fecha_numero,fecha_nombre,equipo_local,equipo_visitante,dia,hora
Caballeros A,regular,1,Fecha 1,Los Halcones,Drop Shot,2026-07-10,20:00
```

- `fase`: `regular` | `quarterfinal` | `semifinal` | `final`
- `dia`: formato `YYYY-MM-DD`
- `hora`: formato `HH:MM`
- Los equipos deben existir previamente (importar listas de buena fe primero).

```bash
# Probar sin escribir nada
npm run import:fixture -- --file ./data/fixture.csv --dry-run

# Importar
npm run import:fixture -- --file ./data/fixture.csv
```

### Validación

```bash
# Validar todos los datos
npm run validate:data

# Validar una categoría específica
npm run validate:data -- --category "Caballeros A"
```

El validador reporta:
- Cantidad de equipos por categoría vs. lo esperado
- Equipos sin jugadores o sin capitán
- Jugadores en dos equipos de la misma categoría
- Series con equipos inexistentes, duplicadas o sin horario

---

## Estructura principal

```
/
├── app/                    # Next.js App Router
│   ├── liga-invierno/      # Sección pública del torneo
│   └── admin/              # Panel admin (no enlazado públicamente)
├── components/             # Componentes React
├── lib/
│   ├── supabase/           # Clientes Supabase (server, client, admin)
│   ├── data/               # Queries a Supabase (tournaments, categories, teams, series, standings)
│   └── tournament/         # Lógica pura del torneo (sin UI, con tests)
├── supabase/
│   └── migrations/         # SQL migrations
└── product/                # Documentación del producto
```

---

## Seguridad

- `.env.local` está en `.gitignore` — nunca se commitea.
- `SUPABASE_SERVICE_ROLE_KEY` solo se usa en el servidor (`lib/supabase/admin.ts`).
- La lectura de la Liga de Invierno es pública (RLS con `SELECT using (true)`).
- La escritura requiere usuario autenticado via Supabase Auth.
- Teléfonos y datos de contacto de jugadores y capitanes nunca se almacenan ni exponen.

---

## Deploy

El proyecto se despliega en [Vercel](https://vercel.com). Agregar las variables de entorno en el panel de Vercel antes del primer deploy.
