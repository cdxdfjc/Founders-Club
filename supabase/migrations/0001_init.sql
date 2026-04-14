-- Founders Club — schema iniziale
-- Esegui su Supabase via: supabase db push  oppure via SQL Editor del dashboard.

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  bio text,
  city text,
  avatar_url text,
  revenue_note text,                 -- campo libero opzionale sui guadagni
  contact_email text,
  contact_telegram text,
  contact_linkedin text,
  contact_twitter text,
  contact_website text,
  is_mentor boolean not null default false,  -- invite-only: settato da admin
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 1. ANNUNCI (richieste + offerte skill)
-- ============================================================
create type public.listing_type as enum ('cerco', 'offro');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type public.listing_type not null,
  title text not null,
  body text not null,
  tags text[] not null default '{}',
  city text,
  created_at timestamptz not null default now()
);

create index listings_tags_idx on public.listings using gin (tags);
create index listings_created_idx on public.listings (created_at desc);

-- ============================================================
-- 2. PROGETTI (idee & progetti)
-- ============================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  tagline text,
  description text not null,
  tags text[] not null default '{}',
  url text,
  created_at timestamptz not null default now()
);

create index projects_created_idx on public.projects (created_at desc);

create table public.project_likes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create type public.join_status as enum ('pending', 'approved', 'rejected');

create table public.project_join_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status public.join_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text,
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. MENTOR
-- ============================================================
-- I mentor sono profili con is_mentor = true (invite-only, flag gestito da admin).
-- Dettagli addizionali:
create table public.mentor_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  headline text,
  expertise text[] not null default '{}',
  topics text
);

-- ============================================================
-- 4. RISORSE (link + post lunghi)
-- ============================================================
create type public.resource_type as enum ('link', 'post');

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  type public.resource_type not null,
  title text not null,
  body text,                        -- per type='post'
  url text,                         -- per type='link'
  summary text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index resources_tags_idx on public.resources using gin (tags);
create index resources_fts_idx on public.resources
  using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(body,'')));

-- ============================================================
-- 5. EVENTI (meetup locali)
-- ============================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  city text not null,
  venue text,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index events_starts_idx on public.events (starts_at);

create table public.event_attendees (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ============================================================
-- MESSAGGI (semplici, no realtime)
-- ============================================================
create type public.message_context as enum ('mentor', 'join_request', 'generic');

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  context public.message_context not null default 'generic',
  subject text,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_recipient_idx on public.messages (recipient_id, created_at desc);

-- ============================================================
-- TRIGGER: creazione profilo automatica su signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1) || '-' || substr(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.user_projects enable row level security;
alter table public.listings enable row level security;
alter table public.projects enable row level security;
alter table public.project_likes enable row level security;
alter table public.project_join_requests enable row level security;
alter table public.project_members enable row level security;
alter table public.project_comments enable row level security;
alter table public.mentor_profiles enable row level security;
alter table public.resources enable row level security;
alter table public.events enable row level security;
alter table public.event_attendees enable row level security;
alter table public.messages enable row level security;

-- Profiles: tutti leggono, ognuno modifica il proprio
create policy "profiles_select_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- User projects
create policy "user_projects_select_all" on public.user_projects for select using (true);
create policy "user_projects_write_own" on public.user_projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Listings
create policy "listings_select_all" on public.listings for select using (true);
create policy "listings_write_own" on public.listings for all
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Projects
create policy "projects_select_all" on public.projects for select using (true);
create policy "projects_write_own" on public.projects for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Likes
create policy "likes_select_all" on public.project_likes for select using (true);
create policy "likes_write_own" on public.project_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Join requests: visibili al richiedente e all'owner del progetto
create policy "join_req_select" on public.project_join_requests for select using (
  auth.uid() = user_id
  or auth.uid() in (select owner_id from public.projects where id = project_id)
);
create policy "join_req_insert_own" on public.project_join_requests for insert
  with check (auth.uid() = user_id);
create policy "join_req_update_owner" on public.project_join_requests for update using (
  auth.uid() in (select owner_id from public.projects where id = project_id)
);

-- Project members
create policy "members_select_all" on public.project_members for select using (true);
create policy "members_write_owner" on public.project_members for all using (
  auth.uid() in (select owner_id from public.projects where id = project_id)
) with check (
  auth.uid() in (select owner_id from public.projects where id = project_id)
);

-- Comments
create policy "comments_select_all" on public.project_comments for select using (true);
create policy "comments_write_own" on public.project_comments for all
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Mentor profiles: visibili a tutti, scrivibili solo se is_mentor=true
create policy "mentor_select_all" on public.mentor_profiles for select using (true);
create policy "mentor_write_own" on public.mentor_profiles for all using (
  auth.uid() = user_id
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_mentor)
) with check (
  auth.uid() = user_id
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_mentor)
);

-- Resources
create policy "resources_select_all" on public.resources for select using (true);
create policy "resources_write_own" on public.resources for all
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

-- Events
create policy "events_select_all" on public.events for select using (true);
create policy "events_write_own" on public.events for all
  using (auth.uid() = host_id) with check (auth.uid() = host_id);

-- Attendees
create policy "attendees_select_all" on public.event_attendees for select using (true);
create policy "attendees_write_own" on public.event_attendees for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Messages: solo mittente o destinatario
create policy "messages_select_participants" on public.messages for select using (
  auth.uid() = sender_id or auth.uid() = recipient_id
);
create policy "messages_insert_sender" on public.messages for insert
  with check (auth.uid() = sender_id);
create policy "messages_update_recipient" on public.messages for update using (
  auth.uid() = recipient_id
);
