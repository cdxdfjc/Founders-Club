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
          <div className="card card-static p-3 sticky top-24">
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
