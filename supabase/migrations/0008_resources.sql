-- Founders Club — Sezione Risorse
-- Consigli, link utili e dritte condivise dai membri.
-- Ogni risorsa ha una categoria (lista crowdsourced, estendibile),
-- può avere un URL con anteprima OG (titolo/descrizione/immagine del sito),
-- oppure essere un consiglio solo-testo.

-- NOTA: 0001_init.sql aveva una vecchia tabella "resources" mai usata
-- (tipo enum link/post, tags[], body). La droppiamo qui per sostituirla
-- con lo schema nuovo.
drop table if exists public.resources cascade;
drop type if exists public.resource_type;

-- ============================================================
-- CATEGORIE RISORSE (lista crowdsourced, stile project_categories)
-- ============================================================
create table if not exists public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  emoji text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Seed iniziale
insert into public.resource_categories (slug, name, emoji) values
  ('tool', 'Tool', '🛠️'),
  ('guide', 'Guide', '📖'),
  ('video', 'Video', '🎥'),
  ('dev', 'Dev', '💻'),
  ('ai', 'AI', '🤖'),
  ('design', 'Design', '🎨'),
  ('marketing', 'Marketing', '📣'),
  ('finanziamento', 'Finanziamento', '💰'),
  ('legale', 'Legale', '⚖️'),
  ('mindset', 'Mindset', '🧠'),
  ('analytics', 'Analytics', '📊'),
  ('altro', 'Altro', '🗂️')
on conflict (slug) do nothing;

-- ============================================================
-- RISORSE
-- ============================================================
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.resource_categories(id) on delete set null,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 1200),
  url text check (url is null or char_length(url) <= 600),
  image_url text check (image_url is null or char_length(image_url) <= 800),
  site_name text check (site_name is null or char_length(site_name) <= 120),
  created_at timestamptz not null default now()
);

create index if not exists resources_created_at_idx
  on public.resources (created_at desc);
create index if not exists resources_category_idx
  on public.resources (category_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.resource_categories enable row level security;
alter table public.resources enable row level security;

drop policy if exists "resource_categories_select" on public.resource_categories;
create policy "resource_categories_select"
  on public.resource_categories for select
  to authenticated
  using (true);

drop policy if exists "resource_categories_insert" on public.resource_categories;
create policy "resource_categories_insert"
  on public.resource_categories for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "resources_select" on public.resources;
create policy "resources_select"
  on public.resources for select
  to authenticated
  using (true);

drop policy if exists "resources_insert" on public.resources;
create policy "resources_insert"
  on public.resources for insert
  to authenticated
  with check (author_id = auth.uid());

drop policy if exists "resources_update_own" on public.resources;
create policy "resources_update_own"
  on public.resources for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "resources_delete_own" on public.resources;
create policy "resources_delete_own"
  on public.resources for delete
  to authenticated
  using (author_id = auth.uid());
