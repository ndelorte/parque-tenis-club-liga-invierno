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
