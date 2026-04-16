import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addBarReply, deleteBarThread } from "@/lib/actions/bar";
import { DeleteButton } from "@/components/DeleteButton";
import { SubmitButton } from "@/components/SubmitButton";

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
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

type Author = { username: string; full_name: string | null } | null;

type Thread = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  reply_count: number;
  author_id: string;
  author: Author;
};

type Reply = {
  id: string;
  body: string;
  created_at: string;
  author: Author;
};

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: threadData } = await supabase
    .from("bar_threads")
    .select(
      `
      id, title, body, created_at, reply_count, author_id,
      author:profiles!bar_threads_author_id_fkey ( username, full_name )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!threadData) notFound();
  const thread = threadData as unknown as Thread;

  const { data: repliesData } = await supabase
    .from("bar_replies")
    .select(
      `
      id, body, created_at,
      author:profiles!bar_replies_author_id_fkey ( username, full_name )
      `,
    )
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  const replies = (repliesData ?? []) as unknown as Reply[];

  const authorName =
    thread.author?.full_name ?? thread.author?.username ?? "anonimo";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const isAuthor = thread.author_id === user.id;

  return (
    <div className="max-w-3xl mx-auto rise space-y-6">
      <Link
        href="/bar"
        className="text-sm text-ink/60 hover:text-ink transition inline-flex items-center gap-1"
      >
        ← Torna al bar
      </Link>

      <article className="card p-5 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{
                background: "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
              }}
            >
              {authorInitial}
            </span>
            <div className="min-w-0">
              <div className="font-semibold text-sm">{authorName}</div>
              <div className="text-xs text-ink/50">
                {timeAgo(thread.created_at)} fa
              </div>
            </div>
          </div>

          {isAuthor && (
            <DeleteButton
              action={deleteBarThread}
              hiddenName="thread_id"
              hiddenValue={thread.id}
              confirmText="Sei sicuro di voler eliminare questo thread? Verranno cancellate anche tutte le risposte."
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-plum/40 text-plum bg-plum/10 hover:bg-plum/20 transition shrink-0"
            >
              🗑️ Elimina
            </DeleteButton>
          )}
        </div>

        <h1 className="font-display-tight font-semibold text-3xl sm:text-4xl leading-tight tracking-tight">
          {thread.title}
        </h1>
        <p className="mt-4 whitespace-pre-wrap text-ink/80 leading-relaxed">
          {thread.body}
        </p>
      </article>

      <div>
        <h2 className="font-display font-semibold text-xl mb-4">
          💬 {replies.length} {replies.length === 1 ? "risposta" : "risposte"}
        </h2>
        <div className="space-y-3">
          {replies.map((r) => {
            const name = r.author?.full_name ?? r.author?.username ?? "anonimo";
            const initial = name.charAt(0).toUpperCase();
            return (
              <div key={r.id} className="card p-5 flex items-start gap-3">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
                  }}
                >
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-ink/50 mb-1">
                    <span className="font-semibold text-ink/80">{name}</span>
                    <span>•</span>
                    <span>{timeAgo(r.created_at)} fa</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-ink/80 leading-relaxed">
                    {r.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form action={addBarReply} className="card p-5 sm:p-6">
        <input type="hidden" name="thread_id" value={thread.id} />
        <label className="block">
          <span className="text-sm font-semibold text-ink/80 mb-1.5 block">
            La tua risposta
          </span>
          <textarea
            name="body"
            rows={4}
            className="field resize-y min-h-[100px]"
            placeholder="Dì la tua…"
            required
            maxLength={2000}
          />
        </label>
        <div className="mt-4 flex justify-end">
          <SubmitButton
            className="btn-gradient !py-2.5 !px-5 !text-sm"
            pendingLabel="Invio…"
          >
            Rispondi
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
