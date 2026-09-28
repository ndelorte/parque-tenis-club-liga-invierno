-- Sponsors de Liga asociados a una edición. Solo el service role escribe.
create table public.tournament_sponsors (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index tournament_sponsors_tournament_order_idx
  on public.tournament_sponsors (tournament_id, sort_order, created_at);

alter table public.tournament_sponsors enable row level security;

create policy "tournament_sponsors_select_public"
  on public.tournament_sponsors for select using (true);

insert into storage.buckets (id, name, public)
values ('liga-sponsors', 'liga-sponsors', true)
on conflict (id) do nothing;
