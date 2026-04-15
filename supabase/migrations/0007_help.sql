-- Founders Club — Sezione Aiuto
-- Richieste di aiuto con categoria, urgenza, stato, e risposte

-- ============================================================
-- HELP REQUESTS
-- ============================================================
create table if not exists public.help_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 10 and 140),
  body text not null check (char_length(body) between 20 and 4000),
  category text not null check (category in (
    'tecnico', 'legale', 'prodotto', 'marketing', 'finanziamento', 'altro'
  )),
  urgency text not null default 'media' check (urgency in ('bassa', 'media', 'alta')),
  status text not null default 'aperta' check (status in ('aperta', 'risolta')),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  reply_count int not null default 0
);

create index if not exists help_requests_last_activity_idx
  on public.help_requests (last_activity_at desc);
create index if not exists help_requests_status_idx
  on public.help_requests (status);
create index if not exists help_requests_category_idx
  on public.help_requests (category);

-- ============================================================
-- HELP REPLIES
-- ============================================================
create table if not exists public.help_replies (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.help_requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists help_replies_request_idx
  on public.help_replies (request_id, created_at asc);

-- ============================================================
-- TRIGGER: bump attività su nuovo reply
-- ============================================================
create or replace function public.bump_help_request_activity()
returns trigger
language plpgsql
as $$
begin
  update public.help_requests
     set last_activity_at = new.created_at,
         reply_count = reply_count + 1
   where id = new.request_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_help_request on public.help_replies;
create trigger trg_bump_help_request
  after insert on public.help_replies
  for each row execute function public.bump_help_request_activity();

-- ============================================================
-- RLS
-- ============================================================
alter table public.help_requests enable row level security;
alter table public.help_replies enable row level security;

drop policy if exists "help_requests_select" on public.help_requests;
create policy "help_requests_select"
  on public.help_requests for select
  to authenticated
  using (true);

drop policy if exists "help_requests_insert" on public.help_requests;
create policy "help_requests_insert"
  on public.help_requests for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "help_requests_update_own" on public.help_requests;
create policy "help_requests_update_own"
  on public.help_requests for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "help_requests_delete_own" on public.help_requests;
create policy "help_requests_delete_own"
  on public.help_requests for delete
  to authenticated
  using (author_id = auth.uid());

drop policy if exists "help_replies_select" on public.help_replies;
create policy "help_replies_select"
  on public.help_replies for select
  to authenticated
  using (true);

drop policy if exists "help_replies_insert" on public.help_replies;
create policy "help_replies_insert"
  on public.help_replies for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "help_replies_delete_own" on public.help_replies;
create policy "help_replies_delete_own"
  on public.help_replies for delete
  to authenticated
  using (author_id = auth.uid());
