import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  toggleLike,
  requestJoin,
  addComment,
} from "@/lib/actions/projects";
import { stageMeta } from "@/lib/projects";

export default async function ProgettoDettaglioPage({
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

  const { data: project } = await supabase
    .from("projects")
    .select(
      `
      id, title, tagline, description, tags, stage, url, owner_id, created_at,
      owner:profiles!projects_owner_id_fkey ( id, username, full_name ),
      category:project_categories ( slug, name, emoji )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();

  const owner = project.owner as unknown as {
    id: string;
    username: string;
    full_name: string | null;
  } | null;

  const category = project.category as unknown as {
    slug: string;
    name: string;
    emoji: string | null;
  } | null;

  const [{ data: likes }, { data: members }, { data: joinReq }, { data: comments }] =
    await Promise.all([
      supabase.from("project_likes").select("user_id").eq("project_id", id),
      supabase.from("project_members").select("user_id").eq("project_id", id),
      supabase
        .from("project_join_requests")
        .select("status")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("project_comments")
        .select(
          `
          id, body, created_at,
          author:profiles!project_comments_author_id_fkey ( username, full_name )
          `,
        )
        .eq("project_id", id)
        .order("created_at", { ascending: true }),
    ]);

  const likeCount = likes?.length ?? 0;
  const userLiked = !!likes?.find((l) => l.user_id === user.id);
  const memberCount = (members?.length ?? 0) + 1; // +1 owner
  const isOwner = owner?.id === user.id;
  const stage = stageMeta(project.stage);

  const ownerName = owner?.full_name ?? owner?.username ?? "anonimo";
  const ownerInitial = ownerName.charAt(0).toUpperCase();

  return (
    <article className="max-w-4xl mx-auto rise space-y-8">
      <Link
        href="/progetti"
        className="text-sm text-ink/60 hover:text-ink transition inline-flex items-center gap-1"
      >
        ← Torna ai progetti
      </Link>

      {/* HERO */}
      <header className="card p-8 sm:p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 0% 0%, rgba(50,203,255,0.25), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(239,156,218,0.25), transparent 55%)",
          }}
        />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {category && (
              <span className="chip">
                <span>{category.emoji ?? "•"}</span>
                <span className="font-semibold">{category.name}</span>
              </span>
            )}
            {stage && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{
                  background: "linear-gradient(135deg, #89A1EF, #EF9CDA)",
                }}
              >
                {stage.emoji} {stage.label}
              </span>
            )}
          </div>

          <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-[0.95] tracking-tighter">
            {project.title}
          </h1>
          {project.tagline && (
            <p className="mt-4 text-xl sm:text-2xl text-ink/70 leading-snug">
              {project.tagline}
            </p>
          )}

          {/* Owner + actions */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <Link
              href={`/profilo/${owner?.username ?? ""}`}
              className="flex items-center gap-3 group"
            >
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
                }}
              >
                {ownerInitial}
              </span>
              <div>
                <p className="font-semibold text-ink group-hover:underline">
                  {ownerName}
                </p>
                <p className="text-xs text-ink/50">@{owner?.username}</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <form action={toggleLike}>
                <input type="hidden" name="project_id" value={project.id} />
                <button
                  type="submit"
                  className={`px-4 py-2.5 rounded-full font-semibold text-sm border transition ${
                    userLiked
                      ? "bg-plum/20 border-plum/50"
                      : "bg-white/70 border-ink/10 hover:bg-white"
                  }`}
                >
                  {userLiked ? "💖" : "🤍"} {likeCount}
                </button>
              </form>

              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost !py-2.5 !px-4 !text-sm"
                >
                  🌐 Sito ↗
                </a>
              )}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4 text-xs text-ink/50">
            <span>👥 {memberCount} {memberCount === 1 ? "membro" : "membri"}</span>
            <span>·</span>
            <span>💬 {comments?.length ?? 0} commenti</span>
          </div>
        </div>
      </header>

      {/* DESCRIZIONE */}
      <section className="card p-7 sm:p-9">
        <h2 className="font-display font-semibold text-2xl mb-4 flex items-center gap-2">
          <span>📖</span> Descrizione
        </h2>
        <p className="text-ink/80 leading-relaxed whitespace-pre-wrap">
          {project.description}
        </p>

        {project.tags && project.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-1.5">
            {project.tags.map((t: string) => (
              <span
                key={t}
                className="text-xs px-2.5 py-1 rounded-full text-ink/70"
                style={{
                  background: "rgba(137,161,239,0.12)",
                  border: "1px solid rgba(137,161,239,0.25)",
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* JOIN REQUEST */}
      {!isOwner && (
        <section className="card p-7 sm:p-9">
          <h2 className="font-display font-semibold text-2xl mb-2 flex items-center gap-2">
            <span>🤝</span> Vuoi entrare nel team?
          </h2>
          {joinReq ? (
            <p className="text-sm text-ink/60">
              {joinReq.status === "pending" &&
                "⏳ Hai già inviato una richiesta. In attesa di risposta."}
              {joinReq.status === "approved" &&
                "✅ Sei stato accettato nel team!"}
              {joinReq.status === "rejected" &&
                "La richiesta è stata declinata."}
            </p>
          ) : (
            <form action={requestJoin} className="space-y-3">
              <input type="hidden" name="project_id" value={project.id} />
              <p className="text-sm text-ink/60">
                Spiega in due righe perché vorresti contribuire e cosa puoi
                portare.
              </p>
              <textarea
                name="message"
                rows={3}
                className="field resize-y min-h-[80px]"
                placeholder="Sono uno sviluppatore React, mi piace molto l'idea perché…"
                maxLength={500}
              />
              <button type="submit" className="btn-gradient !py-2.5 !px-5 !text-sm">
                Invia richiesta
              </button>
            </form>
          )}
        </section>
      )}

      {/* COMMENTI */}
      <section className="card p-7 sm:p-9">
        <h2 className="font-display font-semibold text-2xl mb-4 flex items-center gap-2">
          <span>💬</span> Commenti
        </h2>

        <form action={addComment} className="space-y-3 mb-6">
          <input type="hidden" name="project_id" value={project.id} />
          <textarea
            name="body"
            rows={3}
            className="field resize-y min-h-[80px]"
            placeholder="Scrivi un commento…"
            required
            maxLength={1000}
          />
          <div>
            <button type="submit" className="btn-ghost !py-2 !px-4 !text-sm">
              Pubblica commento
            </button>
          </div>
        </form>

        {comments && comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((c) => {
              const author = c.author as unknown as {
                username: string;
                full_name: string | null;
              } | null;
              const name = author?.full_name ?? author?.username ?? "anonimo";
              return (
                <div
                  key={c.id}
                  className="flex gap-3 pb-4 border-b border-ink/5 last:border-0 last:pb-0"
                >
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
                    }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profilo/${author?.username ?? ""}`}
                      className="font-semibold text-sm hover:underline"
                    >
                      {name}
                    </Link>
                    <p className="text-ink/80 text-sm mt-0.5 whitespace-pre-wrap">
                      {c.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-ink/50 italic">
            Ancora nessun commento. Sii il primo.
          </p>
        )}
      </section>
    </article>
  );
}
