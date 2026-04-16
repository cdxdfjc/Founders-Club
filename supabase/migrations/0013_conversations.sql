-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint conversations_ordered check (user_a < user_b),
  constraint conversations_unique unique (user_a, user_b)
);

create index conversations_user_a_idx on public.conversations (user_a, last_message_at desc);
create index conversations_user_b_idx on public.conversations (user_b, last_message_at desc);

-- Aggiungere conversation_id ai messaggi
alter table public.messages add column conversation_id uuid references public.conversations(id) on delete cascade;
create index messages_conversation_idx on public.messages (conversation_id, created_at);

-- RLS su conversations
alter table public.conversations enable row level security;

create policy "conversations_select_participants" on public.conversations
  for select using (auth.uid() = user_a or auth.uid() = user_b);

create policy "conversations_insert_participant" on public.conversations
  for insert with check (auth.uid() = user_a or auth.uid() = user_b);

create policy "conversations_update_participant" on public.conversations
  for update using (auth.uid() = user_a or auth.uid() = user_b);

-- Abilitare realtime sulla tabella messages
alter publication supabase_realtime add table public.messages;
