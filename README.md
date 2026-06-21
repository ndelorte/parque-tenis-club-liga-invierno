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

Copiá el template y completalo con los datos reales:

```bash
cp data/templates/lista-buena-fe.example.csv data/listas-buena-fe.csv
# editá data/listas-buena-fe.csv con los datos reales
```

**Formato** (`data/templates/lista-buena-fe.example.csv`):

```
categoria,equipo,capitan,jugador
```

| Columna | Descripción |
|---------|-------------|
| `categoria` | Nombre **exacto** de la categoría en Supabase. Ej: `Caballeros A` |
| `equipo` | Nombre del equipo. Se genera el slug automáticamente. |
| `capitan` | Nombre completo del capitán. Debe ser igual en todas las filas del equipo. |
| `jugador` | Nombre completo del jugador. **Una fila por jugador.** |

**Reglas importantes:**
- El capitán debe aparecer también como `jugador` en alguna fila del mismo equipo.
- Si un equipo tiene 5 jugadores, tiene 5 filas (todas con el mismo `equipo` y `capitan`).
- Un jugador puede estar en equipos de **distintas** categorías.
- Un jugador **no puede** estar en dos equipos de la misma categoría (el importador lo rechaza).
- Los nombres deben ser consistentes en todas las filas — una variación de mayúsculas o tilde crea un jugador duplicado.

```bash
# Validar el CSV sin escribir nada en la base
npm run import:rosters -- --file ./data/listas-buena-fe.csv --dry-run

# Importar
npm run import:rosters -- --file ./data/listas-buena-fe.csv
```

### Fixture

Copiá el template y completalo con los datos reales:

```bash
cp data/templates/fixture.example.csv data/fixture.csv
# editá data/fixture.csv con los datos reales
```

**Formato** (`data/templates/fixture.example.csv`):

```
categoria,fase,fecha_numero,fecha_nombre,equipo_local,equipo_visitante,dia,hora
```

| Columna | Descripción |
|---------|-------------|
| `categoria` | Nombre **exacto** de la categoría en Supabase. |
| `fase` | `regular` \| `quarterfinal` \| `semifinal` \| `final` |
| `fecha_numero` | Número entero de la fecha: `1`, `2`, `3`… |
| `fecha_nombre` | Nombre legible: `Fecha 1`, `Semifinal`, etc. |
| `equipo_local` | Nombre del equipo local (debe existir en la categoría). |
| `equipo_visitante` | Nombre del equipo visitante (debe existir en la categoría). |
| `dia` | Fecha en formato `YYYY-MM-DD`. Ej: `2026-07-10` |
| `hora` | Hora de inicio en formato `HH:MM`. Ej: `20:00`. Se puede dejar vacío. |

**Reglas importantes:**
- Los equipos **deben existir** antes de importar el fixture. Si falta alguno, el importador falla con un mensaje claro indicando qué equipo y qué categoría.
- El orden correcto siempre es: listas de buena fe → fixture.
- Los nombres de equipos deben coincidir exactamente con los importados (mismo texto, mismas tildes).
- Las series duplicadas (mismo round + mismo par de equipos) se omiten con un aviso, no con error.

```bash
# Validar el CSV sin escribir nada en la base
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
- Cantidad de equipos por categoría vs. `teams_count` esperado en Supabase
- Equipos sin jugadores o sin capitán asignado
- Jugadores activos en dos equipos de la misma categoría
- Series que referencian equipos fuera de la categoría
- Series duplicadas en el mismo round
- Series sin horario definido

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
