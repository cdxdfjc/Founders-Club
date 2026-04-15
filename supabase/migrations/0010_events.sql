-- Founders Club — Sezione Meetup/Eventi
-- Eventi creati dai founder + partecipazioni

-- ============================================================
-- EVENTS
-- ============================================================
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 120),
  description text not null check (char_length(description) between 10 and 4000),
  city text not null check (char_length(city) between 2 and 80),
  venue text not null check (char_length(venue) between 2 and 200),
  starts_at timestamptz not null,
  max_participants int check (max_participants is null or (max_participants between 2 and 500)),
  created_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at asc);
create index if not exists events_city_idx on public.events (city);

-- ============================================================
-- EVENT PARTICIPANTS
-- ============================================================
create table if not exists public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create index if not exists event_participants_user_idx on public.event_participants (user_id);

-- Organizer auto-joined al proprio evento
create or replace function public.auto_join_organizer()
returns trigger
language plpgsql
as $$
begin
  insert into public.event_participants (event_id, user_id)
  values (new.id, new.organizer_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auto_join_organizer on public.events;
create trigger trg_auto_join_organizer
  after insert on public.events
  for each row execute function public.auto_join_organizer();

-- ============================================================
-- RLS
-- ============================================================
alter table public.events enable row level security;
alter table public.event_participants enable row level security;

drop policy if exists "events_select" on public.events;
create policy "events_select"
  on public.events for select
  to authenticated
  using (true);

drop policy if exists "events_insert" on public.events;
create policy "events_insert"
  on public.events for insert
  to authenticated
  with check (organizer_id = auth.uid());

drop policy if exists "events_update_own" on public.events;
create policy "events_update_own"
  on public.events for update
  to authenticated
  using (organizer_id = auth.uid())
  with check (organizer_id = auth.uid());

drop policy if exists "events_delete_own" on public.events;
create policy "events_delete_own"
  on public.events for delete
  to authenticated
  using (organizer_id = auth.uid());

drop policy if exists "event_participants_select" on public.event_participants;
create policy "event_participants_select"
  on public.event_participants for select
  to authenticated
  using (true);

drop policy if exists "event_participants_insert_self" on public.event_participants;
create policy "event_participants_insert_self"
  on public.event_participants for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "event_participants_delete_self" on public.event_participants;
create policy "event_participants_delete_self"
  on public.event_participants for delete
  to authenticated
  using (user_id = auth.uid());
