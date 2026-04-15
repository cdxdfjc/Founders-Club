-- Founders Club — Inviti ai progetti
-- L'inverso di project_join_requests: owner o membri di un progetto
-- possono invitare altri utenti. L'invitato accetta/rifiuta.

create type public.invite_status as enum ('pending', 'accepted', 'declined');

create table if not exists public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  message text check (message is null or char_length(message) <= 500),
  status public.invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (project_id, invitee_id)
);

create index if not exists project_invites_invitee_idx
  on public.project_invites (invitee_id, status);
create index if not exists project_invites_project_idx
  on public.project_invites (project_id);

-- Trigger: quando l'invito viene accettato, aggiungi l'utente ai membri
create or replace function public.handle_invite_accepted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.project_members (project_id, user_id)
    values (new.project_id, new.invitee_id)
    on conflict do nothing;
    new.responded_at := now();
  elsif new.status = 'declined' and old.status <> 'declined' then
    new.responded_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invite_accepted on public.project_invites;
create trigger trg_invite_accepted
  before update on public.project_invites
  for each row execute function public.handle_invite_accepted();

-- ============================================================
-- RLS
-- ============================================================
alter table public.project_invites enable row level security;

-- SELECT: invitato, chi ha invitato, owner del progetto
drop policy if exists "invites_select" on public.project_invites;
create policy "invites_select"
  on public.project_invites for select
  to authenticated
  using (
    auth.uid() = invitee_id
    or auth.uid() = inviter_id
    or auth.uid() in (select owner_id from public.projects where id = project_id)
  );

-- INSERT: solo owner o membri del progetto
drop policy if exists "invites_insert" on public.project_invites;
create policy "invites_insert"
  on public.project_invites for insert
  to authenticated
  with check (
    inviter_id = auth.uid()
    and (
      auth.uid() in (select owner_id from public.projects where id = project_id)
      or auth.uid() in (
        select user_id from public.project_members where project_id = project_invites.project_id
      )
    )
  );

-- UPDATE: solo l'invitato può rispondere
drop policy if exists "invites_update_invitee" on public.project_invites;
create policy "invites_update_invitee"
  on public.project_invites for update
  to authenticated
  using (auth.uid() = invitee_id)
  with check (auth.uid() = invitee_id);

-- DELETE: inviter può annullare finché pending
drop policy if exists "invites_delete_inviter" on public.project_invites;
create policy "invites_delete_inviter"
  on public.project_invites for delete
  to authenticated
  using (auth.uid() = inviter_id and status = 'pending');
