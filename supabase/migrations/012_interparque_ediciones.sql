-- ============================================================
-- Interparque multi-edición.
--
-- Hasta ahora Interparque tenía una sola temporada implícita (jugadores y
-- partidos sueltos, con el calendario derivado de "septiembre–octubre").
-- Terminó la primera edición y la siguiente arranca de cero, así que cada
-- edición pasa a ser una entidad propia: define su primer domingo y cuántos
-- domingos dura. El estado (próxima / en juego / finalizada) NO se guarda:
-- se deriva de esas fechas en lib/interparque/editions.ts.
--
-- Los jugadores pertenecen a una edición (cada edición arranca de 0: quien
-- juega dos ediciones tiene una fila por edición). Los campeones se marcan
-- con is_champion en la fila del jugador (puede haber varios).
--
-- Seguridad: igual que las tablas del Circuito (migración 010), la nueva
-- tabla solo tiene lectura pública. Sin policies de escritura la escritura
-- queda para el service_role, que usan únicamente las server actions
-- (app/actions/interparque.ts), y esas validan el rol admin primero.
-- ============================================================

create table public.interparque_editions (
  id             uuid primary key default gen_random_uuid(),
  number         integer not null unique check (number > 0),
  start_date     date not null,                       -- primer domingo de la edición
  sundays_count  integer not null check (sundays_count between 1 and 52),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint interparque_editions_start_is_sunday check (extract(dow from start_date) = 0)
);

alter table public.interparque_editions enable row level security;
create policy "public_select_interparque_editions" on public.interparque_editions for select using (true);

-- Edición 1 a partir de los datos existentes. Reproduce la regla vieja
-- ("primer domingo de septiembre al último domingo de octubre"): el año sale
-- del primer partido cargado (o el año actual si no hay ninguno).
do $$
declare
  v_year   integer;
  v_start  date;
  v_end    date;
  v_count  integer;
begin
  select coalesce(extract(year from min(match_date))::integer, extract(year from current_date)::integer)
    into v_year
    from public.interparque_matches;

  -- Primer domingo en o después del 1° de septiembre.
  v_start := make_date(v_year, 9, 1);
  v_start := v_start + ((7 - extract(dow from v_start)::integer) % 7);

  v_end := make_date(v_year, 10, 31);
  v_count := ((v_end - v_start) / 7) + 1;

  insert into public.interparque_editions (number, start_date, sundays_count)
  values (1, v_start, v_count);
end $$;

-- Jugadores y partidos pertenecen a una edición.
alter table public.interparque_players add column edition_id uuid references public.interparque_editions(id) on delete cascade;
alter table public.interparque_matches add column edition_id uuid references public.interparque_editions(id) on delete cascade;

update public.interparque_players set edition_id = (select id from public.interparque_editions where number = 1);
update public.interparque_matches set edition_id = (select id from public.interparque_editions where number = 1);

alter table public.interparque_players alter column edition_id set not null;
alter table public.interparque_matches alter column edition_id set not null;

create index interparque_players_edition_id_idx on public.interparque_players (edition_id);
create index interparque_matches_edition_id_idx on public.interparque_matches (edition_id);

-- Campeones de la edición (se marcan desde el panel; puede haber varios).
alter table public.interparque_players add column is_champion boolean not null default false;
