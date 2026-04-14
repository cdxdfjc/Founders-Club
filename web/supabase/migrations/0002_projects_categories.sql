-- Founders Club — categorie progetti + stage
-- Esegui dopo 0001_init.sql

-- ============================================================
-- CATEGORIE PROGETTI (lista crowdsourced)
-- ============================================================
create table if not exists public.project_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  emoji text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Seed iniziale
insert into public.project_categories (slug, name, emoji) values
  ('saas', 'SaaS', '☁️'),
  ('ai', 'AI & ML', '🤖'),
  ('marketplace', 'Marketplace', '🛒'),
  ('mobile', 'Mobile app', '📱'),
  ('hardware', 'Hardware', '🔧'),
  ('fintech', 'Fintech', '💳'),
  ('creator', 'Creator economy', '🎨'),
  ('edu', 'Education', '🎓'),
  ('health', 'Health & wellness', '🩺'),
  ('b2b', 'B2B / Enterprise', '🏢'),
  ('consumer', 'Consumer', '🛍️'),
  ('opensource', 'Open source', '🐙'),
  ('devtools', 'Dev tools', '🛠️'),
  ('gaming', 'Gaming', '🎮'),
  ('media', 'Media & content', '📰')
on conflict (slug) do nothing;

-- ============================================================
-- STAGE
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_stage') then
    create type public.project_stage as enum (
      'idea',
      'prototipo',
      'mvp',
      'primi_clienti',
      'profittevole'
    );
  end if;
end$$;

-- ============================================================
-- ALTER projects
-- ============================================================
alter table public.projects
  add column if not exists category_id uuid references public.project_categories(id) on delete set null,
  add column if not exists stage public.project_stage;

create index if not exists projects_category_idx on public.projects (category_id);
create index if not exists projects_stage_idx on public.projects (stage);

-- Full-text index per la ricerca
create index if not exists projects_fts_idx on public.projects
  using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(tagline,'') || ' ' || coalesce(description,'')));

-- ============================================================
-- RLS per project_categories
-- ============================================================
alter table public.project_categories enable row level security;

drop policy if exists "categories_select_all" on public.project_categories;
create policy "categories_select_all" on public.project_categories
  for select using (true);

-- Qualunque utente autenticato può aggiungere una categoria mancante
drop policy if exists "categories_insert_authenticated" on public.project_categories;
create policy "categories_insert_authenticated" on public.project_categories
  for insert with check (auth.uid() is not null and auth.uid() = created_by);
