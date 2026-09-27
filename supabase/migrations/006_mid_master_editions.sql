-- ============================================================
-- Sprint C2 — Mid Master multi-edición
-- Agrega mid_master_editions y edition_id a mid_master_categories,
-- con backfill de la edición 2026 (la única que existe hoy).
-- ============================================================

create table public.mid_master_editions (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null,
  year        integer     not null,
  status      text        not null default 'active'
                          check (status in ('upcoming', 'active', 'finished')),
  created_at  timestamptz not null default now()
);

alter table public.mid_master_categories
  add column edition_id uuid references public.mid_master_editions(id);

-- Backfill: la edición 2026 ya está en curso (105 partidos jugados, 15
-- pendientes/programados al momento de esta migración) → status 'active'.
insert into public.mid_master_editions (slug, name, year, status)
values ('mid-master-2026', 'Mid Master', 2026, 'active');

update public.mid_master_categories
  set edition_id = (select id from public.mid_master_editions where slug = 'mid-master-2026')
  where edition_id is null;

alter table public.mid_master_categories
  alter column edition_id set not null;

-- categories.slug era único global (bug latente igual al de Liga en L1):
-- con una 2ª edición, dos categorías podrían compartir slug. Se busca y
-- reemplaza cualquier constraint único existente sobre slug por uno
-- compuesto (edition_id, slug), sin asumir su nombre.
do $$
declare
  existing_constraint text;
begin
  select tc.constraint_name into existing_constraint
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema = kcu.table_schema
  where tc.table_name = 'mid_master_categories'
    and tc.table_schema = 'public'
    and tc.constraint_type = 'UNIQUE'
    and kcu.column_name = 'slug'
  group by tc.constraint_name
  having count(*) = 1;

  if existing_constraint is not null then
    execute format('alter table public.mid_master_categories drop constraint %I', existing_constraint);
  end if;
end $$;

alter table public.mid_master_categories
  add constraint mid_master_categories_edition_slug_key unique (edition_id, slug);
