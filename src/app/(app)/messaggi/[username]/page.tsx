import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateConversation } from "@/lib/actions/chat";
import { ChatView } from "@/components/ChatMessages";

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
    <div
      className="card card-static flex flex-col"
      style={{ height: "70vh" }}
    >
      {/* Header conversazione */}
      <div className="flex items-center gap-3 p-4 border-b border-ink/8">
        <Link
          href="/messaggi"
          className="sm:hidden text-ink/50 hover:text-ink"
        >
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

      <ChatView
        conversationId={conversationId}
        currentUserId={user.id}
        recipientId={otherProfile.id}
        initialMessages={messages ?? []}
      />
    </div>
  );
}
