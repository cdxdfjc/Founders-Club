-- Founders Club — Bar (chat globale stile forum)
-- Thread + risposte, ordinamento per ultima attività

-- ============================================================
-- THREADS
-- ============================================================
create table if not exists public.bar_threads (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  reply_count int not null default 0
);

create index if not exists bar_threads_last_activity_idx
  on public.bar_threads (last_activity_at desc);

-- ============================================================
-- REPLIES
-- ============================================================
create table if not exists public.bar_replies (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.bar_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists bar_replies_thread_idx
  on public.bar_replies (thread_id, created_at asc);

-- ============================================================
-- TRIGGER: aggiorna last_activity_at + reply_count su nuovo reply
-- ============================================================
create or replace function public.bump_bar_thread_activity()
returns trigger
language plpgsql
as $$
begin
  update public.bar_threads
     set last_activity_at = new.created_at,
         reply_count = reply_count + 1
   where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_bar_thread on public.bar_replies;
create trigger trg_bump_bar_thread
  after insert on public.bar_replies
  for each row execute function public.bump_bar_thread_activity();

-- ============================================================
-- RLS
-- ============================================================
alter table public.bar_threads enable row level security;
alter table public.bar_replies enable row level security;

drop policy if exists "bar_threads_select" on public.bar_threads;
create policy "bar_threads_select"
  on public.bar_threads for select
  to authenticated
  using (true);

drop policy if exists "bar_threads_insert" on public.bar_threads;
create policy "bar_threads_insert"
  on public.bar_threads for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "bar_threads_delete_own" on public.bar_threads;
create policy "bar_threads_delete_own"
  on public.bar_threads for delete
  to authenticated
  using (author_id = auth.uid());

drop policy if exists "bar_replies_select" on public.bar_replies;
create policy "bar_replies_select"
  on public.bar_replies for select
  to authenticated
  using (true);

drop policy if exists "bar_replies_insert" on public.bar_replies;
create policy "bar_replies_insert"
  on public.bar_replies for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "bar_replies_delete_own" on public.bar_replies;
create policy "bar_replies_delete_own"
  on public.bar_replies for delete
  to authenticated
  using (author_id = auth.uid());
