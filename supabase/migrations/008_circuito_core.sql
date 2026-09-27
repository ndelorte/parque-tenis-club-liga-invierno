-- ============================================================
-- Sprint C3 — Circuito del Parque: modelo de datos del torneo mensual
-- Tablas independientes de Liga y Mid Master (prefijo circuito_,
-- ver ADR-005). players se comparte con Liga/Mid Master (ADR-002).
-- ============================================================

-- circuito_editions: una edición mensual del circuito (ej. "Roland Garros" mayo 2026)
create table public.circuito_editions (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null,
  month       integer     not null check (month between 1 and 12),
  year        integer     not null,
  status      text        not null default 'upcoming'
                          check (status in ('upcoming', 'active', 'finished')),
  created_at  timestamptz not null default now()
);

-- circuito_categories: categoría dentro de una edición (14 categorías fijas,
-- ver reglas-circuito-del-parque.md; draw_size varía mes a mes según inscriptos)
create table public.circuito_categories (
  id          uuid        primary key default gen_random_uuid(),
  edition_id  uuid        not null references public.circuito_editions(id) on delete cascade,
  name        text        not null,
  slug        text        not null,
  type        text        not null check (type in ('single', 'dobles')),
  draw_size   integer,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (edition_id, slug)
);

-- circuito_participants: jugador (single) o pareja (dobles) inscripta en una
-- categoría. display_name guarda el nombre crudo para el import de Challonge
-- (Sprint C7) cuando todavía no hay match con un player_id.
create table public.circuito_participants (
  id            uuid        primary key default gen_random_uuid(),
  category_id   uuid        not null references public.circuito_categories(id) on delete cascade,
  player_id     uuid        references public.players(id),
  player_2_id   uuid        references public.players(id),
  display_name  text        not null,
  seed          integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- circuito_matches: partido del cuadro principal o del repechaje
create table public.circuito_matches (
  id                uuid        primary key default gen_random_uuid(),
  category_id       uuid        not null references public.circuito_categories(id) on delete cascade,
  bracket           text        not null check (bracket in ('main', 'repechaje')),
  round_number      integer     not null,
  participant_a_id  uuid        references public.circuito_participants(id),
  participant_b_id  uuid        references public.circuito_participants(id),
  score             text,
  winner_id         uuid        references public.circuito_participants(id),
  is_walkover       boolean     not null default false,
  status            text        not null default 'pending'
                                check (status in ('pending', 'scheduled', 'played', 'walkover')),
  scheduled_date    date,
  scheduled_time    time,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- circuito_ranking_points: snapshot recalculado (Sprint C5), nunca editado a mano
create table public.circuito_ranking_points (
  id           uuid        primary key default gen_random_uuid(),
  player_id    uuid        not null references public.players(id),
  category_id  uuid        not null references public.circuito_categories(id) on delete cascade,
  edition_id   uuid        not null references public.circuito_editions(id) on delete cascade,
  points       integer     not null,
  computed_at  timestamptz not null default now(),
  unique (player_id, category_id, edition_id)
);

-- ── Índices ───────────────────────────────────────────────────
create index circuito_categories_edition_id_idx      on public.circuito_categories (edition_id);
create index circuito_participants_category_id_idx   on public.circuito_participants (category_id);
create index circuito_participants_player_id_idx     on public.circuito_participants (player_id);
create index circuito_matches_category_id_idx        on public.circuito_matches (category_id);
create index circuito_ranking_points_player_id_idx   on public.circuito_ranking_points (player_id);
create index circuito_ranking_points_edition_id_idx  on public.circuito_ranking_points (edition_id);

-- ── Row Level Security ────────────────────────────────────────
alter table public.circuito_editions        enable row level security;
alter table public.circuito_categories      enable row level security;
alter table public.circuito_participants    enable row level security;
alter table public.circuito_matches         enable row level security;
alter table public.circuito_ranking_points  enable row level security;

-- Lectura pública (mismo criterio que Liga e Interparque)
create policy "public_select_circuito_editions"
  on public.circuito_editions for select using (true);
create policy "public_select_circuito_categories"
  on public.circuito_categories for select using (true);
create policy "public_select_circuito_participants"
  on public.circuito_participants for select using (true);
create policy "public_select_circuito_matches"
  on public.circuito_matches for select using (true);
create policy "public_select_circuito_ranking_points"
  on public.circuito_ranking_points for select using (true);

-- Escritura solo para usuarios autenticados
-- (service_role bypasea RLS para server actions de admin)
create policy "auth_all_circuito_editions"
  on public.circuito_editions for all to authenticated using (true) with check (true);
create policy "auth_all_circuito_categories"
  on public.circuito_categories for all to authenticated using (true) with check (true);
create policy "auth_all_circuito_participants"
  on public.circuito_participants for all to authenticated using (true) with check (true);
create policy "auth_all_circuito_matches"
  on public.circuito_matches for all to authenticated using (true) with check (true);
create policy "auth_all_circuito_ranking_points"
  on public.circuito_ranking_points for all to authenticated using (true) with check (true);
