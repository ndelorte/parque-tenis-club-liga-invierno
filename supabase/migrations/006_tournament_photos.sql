-- ============================================================
-- Fotos de premiación — Sprint L6
-- Galería pública de fotos por edición/categoría. Bucket público
-- de solo lectura (no es dato sensible, ver CLAUDE.md).
-- ============================================================

create table public.tournament_photos (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  storage_path text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index tournament_photos_tournament_id_idx on public.tournament_photos(tournament_id);
create index tournament_photos_category_id_idx on public.tournament_photos(category_id);

alter table public.tournament_photos enable row level security;

-- Lectura pública (igual que el resto de las tablas de la liga).
-- Las escrituras se hacen únicamente con el service role (admin client),
-- que bypasea RLS — no hace falta política de insert/update/delete.
create policy "tournament_photos_select_public"
  on public.tournament_photos for select
  using (true);

-- Bucket de Storage público de solo lectura.
insert into storage.buckets (id, name, public)
values ('premiaciones', 'premiaciones', true)
on conflict (id) do nothing;
