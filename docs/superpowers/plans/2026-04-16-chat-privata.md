# Chat Privata tra Utenti — Piano di Implementazione

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere una chat privata 1-a-1 in tempo reale tra utenti di Founders Club, con tabella `conversations`, lista conversazioni, pagina chat, e entry point da profilo e pagina messaggi.

**Architecture:** Nuova tabella `conversations` con vincolo unique su coppia utenti + colonna `conversation_id` sulla tabella `messages` esistente. La lista conversazioni è un Server Component; la chat è un Client Component con Supabase Realtime subscription per ricevere messaggi istantaneamente. Le server actions gestiscono invio messaggi e creazione conversazioni.

**Tech Stack:** Next.js 16, Supabase (DB + Realtime), React 19, Tailwind v4

---

## File Structure

### Nuovi file
- `supabase/migrations/0013_conversations.sql` — migrazione DB: tabella conversations, aggiorna messages, RLS
- `src/lib/actions/chat.ts` — server actions: sendMessage, getOrCreateConversation, markAsRead
- `src/app/(app)/messaggi/layout.tsx` — layout a due colonne (sidebar + chat area)
- `src/app/(app)/messaggi/page.tsx` — riscrittura: lista conversazioni + stato vuoto
- `src/app/(app)/messaggi/nuovo/page.tsx` — pagina "nuova conversazione" con ricerca utenti
- `src/app/(app)/messaggi/[username]/page.tsx` — pagina conversazione con un utente
- `src/components/ChatMessages.tsx` — client component: lista messaggi + realtime subscription
- `src/components/ChatInput.tsx` — client component: input per scrivere e inviare messaggi
- `src/components/ConversationList.tsx` — client component: lista conversazioni con realtime updates
- `src/components/UserSearch.tsx` — client component: campo ricerca utenti per nuova conversazione

### File da modificare
- `src/app/(app)/profilo/[username]/page.tsx` — aggiungere pulsante "Invia messaggio"
- `src/app/(app)/layout.tsx` — badge messaggi non letti nell'header

---

### Task 1: Migrazione Database

**Files:**
- Create: `supabase/migrations/0013_conversations.sql`

- [ ] **Step 1: Scrivere la migrazione SQL**

```sql
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
```

- [ ] **Step 2: Applicare la migrazione**

Run: `cd /Users/federico/Desktop/startup\ community && npx supabase db push`

Se non usi la CLI Supabase in locale, eseguire l'SQL manualmente dal dashboard Supabase (SQL Editor).

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0013_conversations.sql
git commit -m "feat: add conversations table and update messages schema"
```

---

### Task 2: Server Actions per la Chat

**Files:**
- Create: `src/lib/actions/chat.ts`

- [ ] **Step 1: Creare le server actions**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Restituisce o crea la conversazione tra l'utente corrente e un altro utente */
export async function getOrCreateConversation(otherUserId: string) {
  const { supabase, user } = await requireUser();
  if (otherUserId === user.id) return null;

  const [userA, userB] =
    user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

  // Prova a trovare la conversazione esistente
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .maybeSingle();

  if (existing) return existing.id;

  // Crea nuova conversazione
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_a: userA, user_b: userB })
    .select("id")
    .single();

  if (error) {
    // Race condition: un'altra request ha creato la conversazione
    const { data: retry } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle();
    return retry?.id ?? null;
  }

  return created.id;
}

/** Invia un messaggio in una conversazione */
export async function sendMessage(formData: FormData) {
  const { supabase, user } = await requireUser();

  const conversationId = formData.get("conversation_id") as string;
  const recipientId = formData.get("recipient_id") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!conversationId || !recipientId || !body) return;
  if (body.length > 2000) return;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    recipient_id: recipientId,
    body,
  });

  // Aggiorna last_message_at sulla conversazione
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath("/messaggi");
}

/** Segna tutti i messaggi di una conversazione come letti */
export async function markAsRead(conversationId: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("recipient_id", user.id)
    .is("read_at", null);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/actions/chat.ts
git commit -m "feat: add chat server actions (send, getOrCreate, markAsRead)"
```

---

### Task 3: Componente ChatMessages (Realtime)

**Files:**
- Create: `src/components/ChatMessages.tsx`

- [ ] **Step 1: Creare il componente client con realtime subscription**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markAsRead } from "@/lib/actions/chat";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function ChatMessages({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read on mount
  useEffect(() => {
    markAsRead(conversationId);
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Segna come letto se siamo il destinatario
          if (newMsg.sender_id !== currentUserId) {
            markAsRead(conversationId);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <div className="text-center text-ink/40 py-12">
          <div className="text-4xl mb-2">💬</div>
          <p>Inizia la conversazione!</p>
        </div>
      )}
      {messages.map((msg) => {
        const isMine = msg.sender_id === currentUserId;
        return (
          <div
            key={msg.id}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMine
                  ? "text-white rounded-br-md"
                  : "bg-white/70 backdrop-blur border border-white/80 text-ink rounded-bl-md"
              }`}
              style={
                isMine
                  ? {
                      background:
                        "linear-gradient(135deg, #32CBFF, #89A1EF 60%, #EF9CDA)",
                    }
                  : undefined
              }
            >
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              <p
                className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-ink/40"}`}
              >
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChatMessages.tsx
git commit -m "feat: add ChatMessages component with realtime subscription"
```

---

### Task 4: Componente ChatInput

**Files:**
- Create: `src/components/ChatInput.tsx`

- [ ] **Step 1: Creare il componente input**

```tsx
"use client";

import { useRef } from "react";
import { sendMessage } from "@/lib/actions/chat";

export function ChatInput({
  conversationId,
  recipientId,
}: {
  conversationId: string;
  recipientId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const body = (formData.get("body") as string)?.trim();
    if (!body) return;
    formRef.current?.reset();
    await sendMessage(formData);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="border-t border-ink/8 p-3 sm:p-4"
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <input type="hidden" name="recipient_id" value={recipientId} />
      <div className="flex items-end gap-2">
        <textarea
          name="body"
          placeholder="Scrivi un messaggio..."
          rows={1}
          maxLength={2000}
          onKeyDown={handleKeyDown}
          className="field !rounded-2xl !py-3 !px-4 resize-none flex-1"
          style={{ minHeight: "44px", maxHeight: "120px" }}
        />
        <button
          type="submit"
          className="btn-gradient !py-3 !px-4 !rounded-full shrink-0"
        >
          <span className="sr-only">Invia</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ChatInput.tsx
git commit -m "feat: add ChatInput component"
```

---

### Task 5: Componente UserSearch

**Files:**
- Create: `src/components/UserSearch.tsx`

- [ ] **Step 1: Creare il componente di ricerca utenti**

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Profile = {
  username: string;
  full_name: string | null;
};

export function UserSearch({ currentUserId }: { currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("username, full_name")
        .neq("id", currentUserId)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      setResults((data as Profile[]) ?? []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, currentUserId]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Cerca per nome o username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="field"
        autoFocus
      />
      {loading && <p className="text-sm text-ink/40">Cerco...</p>}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((p) => {
            const initial = (p.full_name ?? p.username).charAt(0).toUpperCase();
            return (
              <Link
                key={p.username}
                href={`/messaggi/${p.username}`}
                className="card !rounded-2xl p-3 sm:p-4 flex items-center gap-3 hover:border-wisteria/40"
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
                  }}
                >
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {p.full_name ?? p.username}
                  </p>
                  <p className="text-xs text-ink/50">@{p.username}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {query.trim().length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-ink/40 text-center py-4">
          Nessun utente trovato
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/UserSearch.tsx
git commit -m "feat: add UserSearch component for new conversations"
```

---

### Task 6: Layout Messaggi e Lista Conversazioni

**Files:**
- Create: `src/app/(app)/messaggi/layout.tsx`
- Create: `src/components/ConversationList.tsx`
- Modify: `src/app/(app)/messaggi/page.tsx`

- [ ] **Step 1: Creare il componente ConversationList (client, con realtime)**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  other_username: string;
  other_full_name: string | null;
  last_message_body: string | null;
  last_message_at: string;
  unread_count: number;
};

function timeAgo(iso: string): string {
  const s = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}g`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}

export function ConversationList({
  initialConversations,
  currentUserId,
}: {
  initialConversations: Conversation[];
  currentUserId: string;
}) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const pathname = usePathname();

  // Update list when initialConversations change (server re-render)
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Listen for new messages to update the sidebar
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("conversation-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refetch conversation list on any new message
          window.location.href = pathname;
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname]);

  if (conversations.length === 0) return null;

  return (
    <div className="space-y-1">
      {conversations.map((c) => {
        const initial = (c.other_full_name ?? c.other_username)
          .charAt(0)
          .toUpperCase();
        const isActive = pathname === `/messaggi/${c.other_username}`;

        return (
          <Link
            key={c.id}
            href={`/messaggi/${c.other_username}`}
            className={`flex items-center gap-3 p-3 rounded-2xl transition ${
              isActive
                ? "bg-white/80 shadow-sm border border-wisteria/30"
                : "hover:bg-white/50"
            }`}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
              }}
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">
                  {c.other_full_name ?? c.other_username}
                </p>
                <span className="text-[10px] text-ink/40 shrink-0">
                  {timeAgo(c.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-ink/50 truncate">
                  {c.last_message_body ?? "..."}
                </p>
                {c.unread_count > 0 && (
                  <span
                    className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                    }}
                  >
                    {c.unread_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Creare il layout messaggi a due colonne**

File: `src/app/(app)/messaggi/layout.tsx`

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConversationList } from "@/components/ConversationList";

type ConversationRow = {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string;
};

export default async function MessaggiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch tutte le conversazioni dell'utente
  const { data: rawConversations } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, last_message_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const convos = (rawConversations ?? []) as ConversationRow[];

  // Fetch profili degli altri utenti e ultimo messaggio + unread count
  const conversations = await Promise.all(
    convos.map(async (c) => {
      const otherId = c.user_a === user.id ? c.user_b : c.user_a;

      const [{ data: profile }, { data: lastMsg }, { count: unreadCount }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("username, full_name")
            .eq("id", otherId)
            .maybeSingle(),
          supabase
            .from("messages")
            .select("body")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("recipient_id", user.id)
            .is("read_at", null),
        ]);

      return {
        id: c.id,
        other_username: profile?.username ?? "utente",
        other_full_name: profile?.full_name ?? null,
        last_message_body: lastMsg?.body ?? null,
        last_message_at: c.last_message_at,
        unread_count: unreadCount ?? 0,
      };
    }),
  );

  return (
    <div className="rise max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="font-display-tight font-semibold text-3xl sm:text-5xl md:text-6xl leading-none tracking-tighter">
          <span className="gradient-text">Messaggi</span>
        </h1>
      </header>

      <div className="flex gap-5" style={{ minHeight: "70vh" }}>
        {/* Sidebar */}
        <aside className="hidden sm:block w-72 lg:w-80 shrink-0">
          <div className="card p-3 sticky top-24">
            <Link
              href="/messaggi/nuovo"
              className="btn-gradient !py-2.5 !px-4 !text-sm w-full mb-3"
            >
              + Nuovo messaggio
            </Link>
            <ConversationList
              initialConversations={conversations}
              currentUserId={user.id}
            />
            {conversations.length === 0 && (
              <p className="text-sm text-ink/40 text-center py-6">
                Nessuna conversazione
              </p>
            )}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Riscrivere la pagina messaggi principale**

File: `src/app/(app)/messaggi/page.tsx` — sostituire completamente il contenuto:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite, declineInvite } from "@/lib/actions/invites";
import {
  acceptUserProjectInvite,
  declineUserProjectInvite,
} from "@/lib/actions/user-project-invites";
import { SubmitButton } from "@/components/SubmitButton";

type InviteRow = {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  project: { id: string; title: string; tagline: string | null } | null;
  inviter: { username: string; full_name: string | null } | null;
};

type PortfolioInviteRow = {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  user_project: { id: string; name: string; description: string | null } | null;
  inviter: { username: string; full_name: string | null } | null;
};

export default async function MessaggiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: invites } = await supabase
    .from("project_invites")
    .select(
      `
      id, message, status, created_at,
      project:projects ( id, title, tagline ),
      inviter:profiles!project_invites_inviter_id_fkey ( username, full_name )
      `,
    )
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const list = (invites as unknown as InviteRow[] | null) ?? [];

  const { data: portfolioInvites } = await supabase
    .from("user_project_invites")
    .select(
      `
      id, message, status, created_at,
      user_project:user_projects ( id, name, description ),
      inviter:profiles!user_project_invites_inviter_id_fkey ( username, full_name )
      `,
    )
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const portfolioList =
    (portfolioInvites as unknown as PortfolioInviteRow[] | null) ?? [];

  const hasInvites = list.length > 0 || portfolioList.length > 0;

  return (
    <div className="space-y-6">
      {/* Mobile: pulsante nuovo messaggio + link a lista conversazioni */}
      <div className="sm:hidden space-y-3">
        <Link
          href="/messaggi/nuovo"
          className="btn-gradient !py-2.5 !px-4 !text-sm w-full text-center"
        >
          + Nuovo messaggio
        </Link>
      </div>

      {/* Stato vuoto (visibile su desktop quando nessuna chat è selezionata) */}
      <div className="hidden sm:block">
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">💬</div>
          <h3 className="font-display font-semibold text-xl">
            Seleziona una conversazione
          </h3>
          <p className="mt-2 text-sm text-ink/60 max-w-sm mx-auto">
            Scegli una conversazione dalla lista o iniziane una nuova.
          </p>
        </div>
      </div>

      {/* Inviti (mantenuti) */}
      {hasInvites && (
        <>
          {list.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                  <span>📬</span> Inviti ai progetti
                </h2>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{
                    background: "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                  }}
                >
                  {list.length}
                </span>
              </div>
              <div className="space-y-3">
                {list.map((inv) => {
                  const inviterName =
                    inv.inviter?.full_name ??
                    inv.inviter?.username ??
                    "qualcuno";
                  return (
                    <div key={inv.id} className="card p-4 sm:p-5">
                      <p className="text-sm text-ink/60">
                        <strong className="text-ink/80">{inviterName}</strong> ti
                        ha invitato in{" "}
                        {inv.project ? (
                          <Link
                            href={`/progetti/${inv.project.id}`}
                            className="font-semibold hover:underline"
                          >
                            {inv.project.title}
                          </Link>
                        ) : (
                          <span className="text-ink/40">
                            (progetto eliminato)
                          </span>
                        )}
                      </p>
                      {inv.message && (
                        <blockquote className="mt-2 text-sm text-ink/70 italic border-l-2 border-ink/15 pl-3">
                          &ldquo;{inv.message}&rdquo;
                        </blockquote>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <form action={acceptInvite}>
                          <input
                            type="hidden"
                            name="invite_id"
                            value={inv.id}
                          />
                          <SubmitButton
                            className="btn-gradient !py-2 !px-4 !text-xs"
                            pendingLabel="..."
                          >
                            Accetta
                          </SubmitButton>
                        </form>
                        <form action={declineInvite}>
                          <input
                            type="hidden"
                            name="invite_id"
                            value={inv.id}
                          />
                          <SubmitButton
                            className="btn-ghost !py-2 !px-4 !text-xs"
                            pendingLabel="..."
                          >
                            Rifiuta
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {portfolioList.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                  <span>🚀</span> Inviti al portfolio
                </h2>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{
                    background: "linear-gradient(135deg, #32CBFF, #89A1EF)",
                  }}
                >
                  {portfolioList.length}
                </span>
              </div>
              <div className="space-y-3">
                {portfolioList.map((inv) => {
                  const inviterName =
                    inv.inviter?.full_name ??
                    inv.inviter?.username ??
                    "qualcuno";
                  return (
                    <div key={inv.id} className="card p-4 sm:p-5">
                      <p className="text-sm text-ink/60">
                        <strong className="text-ink/80">{inviterName}</strong> ti
                        ha invitato a collaborare su{" "}
                        <span className="font-semibold">
                          {inv.user_project?.name ?? "(progetto eliminato)"}
                        </span>
                      </p>
                      {inv.message && (
                        <blockquote className="mt-2 text-sm text-ink/70 italic border-l-2 border-ink/15 pl-3">
                          &ldquo;{inv.message}&rdquo;
                        </blockquote>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <form action={acceptUserProjectInvite}>
                          <input
                            type="hidden"
                            name="invite_id"
                            value={inv.id}
                          />
                          <SubmitButton
                            className="btn-gradient !py-2 !px-4 !text-xs"
                            pendingLabel="..."
                          >
                            Accetta
                          </SubmitButton>
                        </form>
                        <form action={declineUserProjectInvite}>
                          <input
                            type="hidden"
                            name="invite_id"
                            value={inv.id}
                          />
                          <SubmitButton
                            className="btn-ghost !py-2 !px-4 !text-xs"
                            pendingLabel="..."
                          >
                            Rifiuta
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ConversationList.tsx src/app/\(app\)/messaggi/layout.tsx src/app/\(app\)/messaggi/page.tsx
git commit -m "feat: add chat layout with conversation sidebar"
```

---

### Task 7: Pagina Conversazione (`/messaggi/[username]`)

**Files:**
- Create: `src/app/(app)/messaggi/[username]/page.tsx`

- [ ] **Step 1: Creare la pagina conversazione**

```tsx
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateConversation } from "@/lib/actions/chat";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Trova l'altro utente
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .eq("username", username)
    .maybeSingle();

  if (!otherProfile || otherProfile.id === user.id) notFound();

  // Ottieni o crea la conversazione
  const conversationId = await getOrCreateConversation(otherProfile.id);
  if (!conversationId) notFound();

  // Carica i messaggi esistenti
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const initial = (otherProfile.full_name ?? otherProfile.username)
    .charAt(0)
    .toUpperCase();

  return (
    <div className="card flex flex-col" style={{ height: "70vh" }}>
      {/* Header conversazione */}
      <div className="flex items-center gap-3 p-4 border-b border-ink/8">
        <Link href="/messaggi" className="sm:hidden text-ink/50 hover:text-ink">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19L5 12L12 5" />
          </svg>
        </Link>
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{
            background: "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
          }}
        >
          {initial}
        </span>
        <div className="min-w-0">
          <Link
            href={`/profilo/${otherProfile.username}`}
            className="font-semibold text-sm hover:underline"
          >
            {otherProfile.full_name ?? otherProfile.username}
          </Link>
          <p className="text-xs text-ink/50">@{otherProfile.username}</p>
        </div>
      </div>

      {/* Messaggi */}
      <ChatMessages
        conversationId={conversationId}
        currentUserId={user.id}
        initialMessages={messages ?? []}
      />

      {/* Input */}
      <ChatInput
        conversationId={conversationId}
        recipientId={otherProfile.id}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/messaggi/\[username\]/page.tsx
git commit -m "feat: add conversation page with realtime chat"
```

---

### Task 8: Pagina Nuova Conversazione

**Files:**
- Create: `src/app/(app)/messaggi/nuovo/page.tsx`

- [ ] **Step 1: Creare la pagina di ricerca utenti**

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserSearch } from "@/components/UserSearch";
import Link from "next/link";

export default async function NuovaConversazionePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="card p-5 sm:p-8">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/messaggi" className="text-ink/50 hover:text-ink">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19L5 12L12 5" />
          </svg>
        </Link>
        <h2 className="font-display font-semibold text-xl">
          Nuovo messaggio
        </h2>
      </div>
      <UserSearch currentUserId={user.id} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/messaggi/nuovo/page.tsx
git commit -m "feat: add new conversation page with user search"
```

---

### Task 9: Pulsante "Invia messaggio" sul Profilo

**Files:**
- Modify: `src/app/(app)/profilo/[username]/page.tsx`

- [ ] **Step 1: Aggiungere il pulsante accanto a "Modifica profilo"**

Nella sezione dove c'è `{isOwnProfile && (` (circa riga 124), aggiungere un else branch:

Trovare:
```tsx
              {isOwnProfile && (
                <Link
                  href="/impostazioni"
                  className="btn-gradient !py-2.5 !px-5 !text-sm shrink-0"
                >
                  ✏️ Modifica profilo
                </Link>
              )}
```

Sostituire con:
```tsx
              {isOwnProfile ? (
                <Link
                  href="/impostazioni"
                  className="btn-gradient !py-2.5 !px-5 !text-sm shrink-0"
                >
                  ✏️ Modifica profilo
                </Link>
              ) : user ? (
                <Link
                  href={`/messaggi/${profile.username}`}
                  className="btn-ghost !py-2.5 !px-5 !text-sm shrink-0"
                >
                  ✉️ Messaggio
                </Link>
              ) : null}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/profilo/\[username\]/page.tsx
git commit -m "feat: add send message button to user profile"
```

---

### Task 10: Badge Messaggi Non Letti nell'Header

**Files:**
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Aggiungere query per conteggio messaggi non letti**

Nel `Promise.all` del layout (circa riga 35), aggiungere una query in più:

Trovare:
```tsx
  const [
    { count: pendingInviteCount },
    { count: membersCount },
    { count: projectsCount },
    { count: openHelpCount },
  ] = await Promise.all([
```

Sostituire con:
```tsx
  const [
    { count: pendingInviteCount },
    { count: membersCount },
    { count: projectsCount },
    { count: openHelpCount },
    { count: unreadMessageCount },
  ] = await Promise.all([
```

E alla fine del `Promise.all` array, prima della chiusura `]);`, aggiungere:

```tsx
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
```

- [ ] **Step 2: Aggiornare il badge nell'icona messaggi**

Trovare il blocco del badge inviti:
```tsx
                {pendingInviteCount && pendingInviteCount > 0 ? (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-0.5 sm:px-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                    }}
                  >
                    {pendingInviteCount}
                  </span>
                ) : null}
```

Sostituire con (somma inviti + messaggi non letti):
```tsx
                {((pendingInviteCount ?? 0) + (unreadMessageCount ?? 0)) > 0 ? (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-0.5 sm:px-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                    }}
                  >
                    {(pendingInviteCount ?? 0) + (unreadMessageCount ?? 0)}
                  </span>
                ) : null}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/layout.tsx
git commit -m "feat: show unread message count in header badge"
```

---

### Task 11: Mobile Conversation List

Su mobile la sidebar è nascosta (`hidden sm:block`). Serve mostrare la lista conversazioni inline nella pagina `/messaggi`.

**Files:**
- Modify: `src/app/(app)/messaggi/page.tsx`

- [ ] **Step 1: Aggiungere lista conversazioni mobile nella pagina principale**

All'inizio del componente `MessaggiPage`, dopo il check auth, aggiungere il fetch delle conversazioni:

```tsx
  // Conversazioni per mobile view
  const { data: rawConvos } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, last_message_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const mobileConversations = await Promise.all(
    (rawConvos ?? []).map(async (c: { id: string; user_a: string; user_b: string; last_message_at: string }) => {
      const otherId = c.user_a === user.id ? c.user_b : c.user_a;
      const [{ data: profile }, { data: lastMsg }, { count: unreadCount }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("username, full_name")
            .eq("id", otherId)
            .maybeSingle(),
          supabase
            .from("messages")
            .select("body")
            .eq("conversation_id", c.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id)
            .eq("recipient_id", user.id)
            .is("read_at", null),
        ]);
      return {
        id: c.id,
        other_username: profile?.username ?? "utente",
        other_full_name: profile?.full_name ?? null,
        last_message_body: lastMsg?.body ?? null,
        last_message_at: c.last_message_at,
        unread_count: unreadCount ?? 0,
      };
    }),
  );
```

Poi nel JSX, dentro il blocco `sm:hidden`, dopo il pulsante "Nuovo messaggio":

```tsx
      {/* Mobile: lista conversazioni */}
      <div className="sm:hidden">
        <Link
          href="/messaggi/nuovo"
          className="btn-gradient !py-2.5 !px-4 !text-sm w-full text-center mb-4"
        >
          + Nuovo messaggio
        </Link>
        {mobileConversations.length > 0 ? (
          <ConversationList
            initialConversations={mobileConversations}
            currentUserId={user.id}
          />
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-ink/60 text-sm">
              Nessuna conversazione ancora. Scrivi a qualcuno!
            </p>
          </div>
        )}
      </div>
```

Aggiungere import in cima:
```tsx
import { ConversationList } from "@/components/ConversationList";
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(app\)/messaggi/page.tsx
git commit -m "feat: add mobile conversation list to messages page"
```

---

### Task 12: Test Manuale e Verifica

- [ ] **Step 1: Avviare il dev server**

Run: `cd /Users/federico/Desktop/startup\ community && npm run dev`

- [ ] **Step 2: Verificare nel browser**

1. Vai a `/messaggi` — verifica che il layout a due colonne funzioni (sidebar + area principale)
2. Clicca "Nuovo messaggio" — verifica la ricerca utenti
3. Seleziona un utente — verifica che si apra la chat
4. Invia un messaggio — verifica che appaia nella lista
5. Apri un secondo browser/incognito con un altro account — verifica che il messaggio arrivi in realtime
6. Vai sul profilo di un utente — verifica il pulsante "Messaggio"
7. Verifica il badge nell'header con messaggi non letti
8. Testa su viewport mobile (responsiveness)

- [ ] **Step 3: Commit finale e verifica build**

Run: `npm run build`

Correggi eventuali errori TypeScript o di build.
