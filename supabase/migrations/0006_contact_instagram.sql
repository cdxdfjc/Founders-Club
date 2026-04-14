-- Founders Club — Aggiunge Instagram ai contatti del profilo
alter table public.profiles
  add column if not exists contact_instagram text;
