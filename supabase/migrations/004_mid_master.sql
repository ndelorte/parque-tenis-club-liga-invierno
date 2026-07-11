-- ============================================================
-- Parque Tenis Club Web — Mid Master
-- Tablas independientes de Liga de Invierno (prefijo mm_)
-- ============================================================

-- mm_editions: instancia del torneo Mid Master
create table public.mm_editions (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        not null unique,
  year        integer     not null,
  status      text        not null default 'active'
                          check (status in ('upcoming', 'active', 'finished')),
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- mm_categories: cada categoría dentro de una edición
create table public.mm_categories (
  id          uuid        primary key default gen_random_uuid(),
  edition_id  uuid        not null references public.mm_editions(id) on delete cascade,
  name        text        not null,
  slug        text        not null,
  short_name  text        not null,
  type        text        not null check (type in ('singles', 'doubles')),
  zone_size   integer     not null default 4 check (zone_size in (3, 4)),
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (edition_id, slug)
);

-- mm_zones: Zona A / Zona B por categoría
create table public.mm_zones (
  id          uuid        primary key default gen_random_uuid(),
  category_id uuid        not null references public.mm_categories(id) on delete cascade,
  name        text        not null check (name in ('Zona A', 'Zona B')),
  created_at  timestamptz not null default now(),
  unique (category_id, name)
);

-- mm_participants: jugador o pareja inscripta en una zona
create table public.mm_participants (
  id           uuid        primary key default gen_random_uuid(),
  zone_id      uuid        not null references public.mm_zones(id) on delete cascade,
  display_name text        not null,
  seed         integer,
  active       boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- mm_matches: partido entre dos participantes (zona, semifinal o final)
create table public.mm_matches (
  id                  uuid        primary key default gen_random_uuid(),
  category_id         uuid        not null references public.mm_categories(id) on delete cascade,
  zone_id             uuid        references public.mm_zones(id),       -- null en knockout
  phase               text        not null check (phase in ('zone', 'semifinal', 'final')),
  participant_a_id    uuid        references public.mm_participants(id),
  participant_b_id    uuid        references public.mm_participants(id),
  participant_a_label text        not null default '',   -- etiqueta si aún no hay participante
  participant_b_label text        not null default '',
  scheduled_date      date,
  scheduled_time      time,
  score               text,       -- ej: "6-4 3-6 7-6"
  winner_id           uuid        references public.mm_participants(id),
  status              text        not null default 'pending'
                                  check (status in ('pending', 'scheduled', 'completed')),
  sets_a              integer     not null default 0,
  sets_b              integer     not null default 0,
  games_a             integer     not null default 0,
  games_b             integer     not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- mm_zone_standings: tabla de posiciones por zona (snapshot calculado)
create table public.mm_zone_standings (
  id             uuid        primary key default gen_random_uuid(),
  zone_id        uuid        not null references public.mm_zones(id) on delete cascade,
  participant_id uuid        not null references public.mm_participants(id) on delete cascade,
  position       integer     not null default 0,
  played         integer     not null default 0,
  won            integer     not null default 0,
  lost           integer     not null default 0,
  sets_won       integer     not null default 0,
  sets_lost      integer     not null default 0,
  sets_diff      integer     not null default 0,
  games_won      integer     not null default 0,
  games_lost     integer     not null default 0,
  games_diff     integer     not null default 0,
  advances       boolean     not null default false,
  updated_at     timestamptz not null default now(),
  unique (zone_id, participant_id)
);

-- ── Índices ───────────────────────────────────────────────────
create index mm_categories_edition_id_idx on public.mm_categories (edition_id);
create index mm_zones_category_id_idx     on public.mm_zones (category_id);
create index mm_participants_zone_id_idx  on public.mm_participants (zone_id);
create index mm_matches_category_id_idx   on public.mm_matches (category_id);
create index mm_matches_zone_id_idx       on public.mm_matches (zone_id);
create index mm_zone_standings_zone_id_idx on public.mm_zone_standings (zone_id);

-- ── Row Level Security ────────────────────────────────────────
alter table public.mm_editions        enable row level security;
alter table public.mm_categories      enable row level security;
alter table public.mm_zones           enable row level security;
alter table public.mm_participants    enable row level security;
alter table public.mm_matches         enable row level security;
alter table public.mm_zone_standings  enable row level security;

-- Lectura pública (como el resto del torneo)
create policy "public_select_mm_editions"
  on public.mm_editions for select using (true);
create policy "public_select_mm_categories"
  on public.mm_categories for select using (true);
create policy "public_select_mm_zones"
  on public.mm_zones for select using (true);
create policy "public_select_mm_participants"
  on public.mm_participants for select using (true);
create policy "public_select_mm_matches"
  on public.mm_matches for select using (true);
create policy "public_select_mm_zone_standings"
  on public.mm_zone_standings for select using (true);

-- Escritura solo para usuarios autenticados
-- (service_role bypasea RLS para server actions de admin)
create policy "auth_insert_mm_editions"
  on public.mm_editions for insert to authenticated with check (true);
create policy "auth_update_mm_editions"
  on public.mm_editions for update to authenticated using (true);

create policy "auth_insert_mm_categories"
  on public.mm_categories for insert to authenticated with check (true);
create policy "auth_update_mm_categories"
  on public.mm_categories for update to authenticated using (true);

create policy "auth_insert_mm_zones"
  on public.mm_zones for insert to authenticated with check (true);

create policy "auth_all_mm_participants"
  on public.mm_participants for all to authenticated using (true) with check (true);

create policy "auth_all_mm_matches"
  on public.mm_matches for all to authenticated using (true) with check (true);

create policy "auth_all_mm_zone_standings"
  on public.mm_zone_standings for all to authenticated using (true) with check (true);
