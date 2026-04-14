-- Founders Club — Profile rebuild
-- Aggiunge campi identità al profilo e estende i user_projects
-- con stato, anni, e nota risultati/guadagni per-progetto.

-- ============================================================
-- PROFILES: nuovi campi
-- ============================================================
alter table public.profiles
  add column if not exists age int check (age is null or (age >= 14 and age <= 120)),
  add column if not exists occupation text check (occupation is null or char_length(occupation) <= 120);

-- ============================================================
-- USER_PROJECTS: nuovi campi
-- ============================================================
alter table public.user_projects
  add column if not exists status text not null default 'in_corso'
    check (status in ('in_corso', 'completato', 'chiuso')),
  add column if not exists year_start int
    check (year_start is null or (year_start >= 1970 and year_start <= 2100)),
  add column if not exists year_end int
    check (year_end is null or (year_end >= 1970 and year_end <= 2100)),
  add column if not exists revenue_note text
    check (revenue_note is null or char_length(revenue_note) <= 120);

-- Ordine preferito per la visualizzazione (più recenti prima)
create index if not exists user_projects_user_order_idx
  on public.user_projects (user_id, year_start desc nulls last, created_at desc);
