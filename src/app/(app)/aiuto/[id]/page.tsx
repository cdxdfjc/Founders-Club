import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addHelpReply,
  deleteHelpRequest,
  toggleHelpSolved,
} from "@/lib/actions/help";
import { DeleteButton } from "@/components/DeleteButton";
import {
  HELP_GRADIENT,
  categoryMeta,
  urgencyMeta,
} from "@/lib/help";

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}g`;
  return `${Math.floor(d / 30)}mo`;
}

type Author = { username: string; full_name: string | null } | null;

type Request = {
  id: string;
  title: string;
  body: string;
  category: string;
  urgency: string;
  status: string;
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

export default async function HelpRequestPage({
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

  const { data: requestData } = await supabase
    .from("help_requests")
    .select(
      `
      id, title, body, category, urgency, status, created_at, reply_count, author_id,
      author:profiles!help_requests_author_id_fkey ( username, full_name )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!requestData) notFound();
  const request = requestData as unknown as Request;

  const { data: repliesData } = await supabase
    .from("help_replies")
    .select(
      `
      id, body, created_at,
      author:profiles!help_replies_author_id_fkey ( username, full_name )
      `,
    )
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const replies = (repliesData ?? []) as unknown as Reply[];

  const authorName =
    request.author?.full_name ?? request.author?.username ?? "anonimo";
  const authorInitial = authorName.charAt(0).toUpperCase();
  const isAuthor = request.author_id === user.id;
  const cat = categoryMeta(request.category);
  const urg = urgencyMeta(request.urgency);
  const solved = request.status === "risolta";
  const nextStatus = solved ? "aperta" : "risolta";

  return (
    <div className="max-w-3xl mx-auto rise space-y-6">
      <Link
        href="/aiuto"
        className="text-sm text-ink/60 hover:text-ink transition inline-flex items-center gap-1"
      >
        ← Torna alle richieste
      </Link>

      <article className="card p-0 overflow-hidden">
        {/* Striscia superiore */}
        <div
          className="h-2 w-full"
          style={{ background: HELP_GRADIENT }}
        />

        <div className="p-7 sm:p-8">
          {/* Top row: categoria + urgenza/stato */}
          <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
            <span
              className="chip"
              style={{
                background: "rgba(255,200,87,0.14)",
                borderColor: "rgba(255,142,114,0.35)",
              }}
            >
              <span>{cat.emoji}</span>
              <span className="font-semibold">{cat.label}</span>
            </span>
            {solved ? (
              <span
                className="text-xs font-bold px-3 py-1 rounded-full text-white"
                style={{ background: "#7BC47F" }}
              >
                ✅ Risolta
              </span>
            ) : (
              <span className="text-xs font-semibold text-ink/60 flex items-center gap-1">
                <span>{urg.emoji}</span>
                <span>{urg.label}</span>
              </span>
            )}
          </div>

          {/* Autore + azioni */}
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
                  {timeAgo(request.created_at)} fa
                </div>
              </div>
            </div>

            {isAuthor && (
              <div className="flex items-center gap-2 shrink-0">
                <form action={toggleHelpSolved}>
                  <input type="hidden" name="request_id" value={request.id} />
                  <input type="hidden" name="next_status" value={nextStatus} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition"
                    style={
                      solved
                        ? {
                            borderColor: "rgba(0,0,0,0.15)",
                            color: "var(--ink)",
                            background: "white",
                          }
                        : {
                            borderColor: "transparent",
                            color: "white",
                            background: "#7BC47F",
                          }
                    }
                  >
                    {solved ? "↩ Riapri" : "✅ Segna risolta"}
                  </button>
                </form>
                <DeleteButton
                  action={deleteHelpRequest}
                  hiddenName="request_id"
                  hiddenValue={request.id}
                  confirmText="Eliminare questa richiesta? Verranno cancellate anche tutte le risposte."
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border border-plum/40 text-plum bg-plum/10 hover:bg-plum/20 transition"
                >
                  🗑️ Elimina
                </DeleteButton>
              </div>
            )}
          </div>

          <h1 className="font-display-tight font-semibold text-3xl sm:text-4xl leading-tight tracking-tight">
            <span className="mr-2">🙋</span>
            {request.title}
          </h1>
          <p className="mt-4 whitespace-pre-wrap text-ink/80 leading-relaxed">
            {request.body}
          </p>
        </div>
      </article>

      <div>
        <h2 className="font-display font-semibold text-xl mb-4">
          💬 {replies.length}{" "}
          {replies.length === 1 ? "risposta" : "risposte"}
        </h2>
        <div className="space-y-3">
          {replies.map((r) => {
            const name =
              r.author?.full_name ?? r.author?.username ?? "anonimo";
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
          {replies.length === 0 && (
            <p className="text-sm text-ink/50 italic">
              Nessuna risposta ancora. Scrivi la prima qui sotto.
            </p>
          )}
        </div>
      </div>

      {!solved && (
        <form action={addHelpReply} className="card p-5 sm:p-6">
          <input type="hidden" name="request_id" value={request.id} />
          <label className="block">
            <span className="text-sm font-semibold text-ink/80 mb-1.5 block">
              La tua risposta
            </span>
            <textarea
              name="body"
              rows={4}
              className="field resize-y min-h-[100px]"
              placeholder="Dì la tua, condividi un link, una dritta, un&apos;esperienza…"
              required
              maxLength={2000}
            />
          </label>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="btn-gradient !py-2.5 !px-5 !text-sm"
              style={{ background: HELP_GRADIENT }}
            >
              Rispondi
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
