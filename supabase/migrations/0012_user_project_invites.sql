-- Founders Club — Inviti ai progetti del portfolio (user_projects)
-- L'owner di un user_project può invitare altri utenti a collaborare.

create table if not exists public.user_project_members (
  id uuid primary key default gen_random_uuid(),
  user_project_id uuid not null references public.user_projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  unique (user_project_id, user_id)
);

create table if not exists public.user_project_invites (
  id uuid primary key default gen_random_uuid(),
  user_project_id uuid not null references public.user_projects(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  message text check (message is null or char_length(message) <= 500),
  status public.invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (user_project_id, invitee_id)
);

create index if not exists user_project_invites_invitee_idx
  on public.user_project_invites (invitee_id, status);
create index if not exists user_project_invites_project_idx
  on public.user_project_invites (user_project_id);

-- Trigger: quando l'invito viene accettato, aggiungi l'utente ai membri
create or replace function public.handle_user_project_invite_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.user_project_members (user_project_id, user_id)
    values (new.user_project_id, new.invitee_id)
    on conflict do nothing;
    new.responded_at := now();
  elsif new.status = 'declined' and old.status <> 'declined' then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_user_project_invite_accepted on public.user_project_invites;
create trigger trg_user_project_invite_accepted
  before update on public.user_project_invites
  for each row execute function public.handle_user_project_invite_accepted();

-- ============================================================
-- RLS
-- ============================================================
alter table public.user_project_members enable row level security;
alter table public.user_project_invites enable row level security;

-- Members: tutti possono leggere, solo owner può inserire/cancellare
drop policy if exists "upm_select" on public.user_project_members;
create policy "upm_select" on public.user_project_members for select using (true);

drop policy if exists "upm_delete" on public.user_project_members;
create policy "upm_delete" on public.user_project_members for delete
  to authenticated
  using (
    auth.uid() in (select user_id from public.user_projects where id = user_project_id)
    or auth.uid() = user_id
  );

-- Invites SELECT: invitato, chi ha invitato, owner del progetto
drop policy if exists "upi_select" on public.user_project_invites;
create policy "upi_select" on public.user_project_invites for select
  to authenticated
  using (
    auth.uid() = invitee_id
    or auth.uid() = inviter_id
    or auth.uid() in (select user_id from public.user_projects where id = user_project_id)
  );

-- Invites INSERT: solo owner del user_project
drop policy if exists "upi_insert" on public.user_project_invites;
create policy "upi_insert" on public.user_project_invites for insert
  to authenticated
  with check (
    inviter_id = auth.uid()
    and auth.uid() in (select user_id from public.user_projects where id = user_project_id)
  );

-- Invites UPDATE: solo l'invitato può rispondere
drop policy if exists "upi_update" on public.user_project_invites;
create policy "upi_update" on public.user_project_invites for update
  to authenticated
  using (auth.uid() = invitee_id)
  with check (auth.uid() = invitee_id);

-- Invites DELETE: inviter può annullare finché pending
drop policy if exists "upi_delete" on public.user_project_invites;
create policy "upi_delete" on public.user_project_invites for delete
  to authenticated
  using (auth.uid() = inviter_id and status = 'pending');
