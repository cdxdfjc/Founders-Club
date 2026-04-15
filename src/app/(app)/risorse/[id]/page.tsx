import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteResource } from "@/lib/actions/resources";
import { DeleteButton } from "@/components/DeleteButton";
import { RESOURCES_GRADIENT, hostnameFromUrl } from "@/lib/resources";

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
  return `${Math.floor(d / 30)}mo`;
}

export default async function RisorsaDetailPage({
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

  const { data: resource } = await supabase
    .from("resources")
    .select(
      `
      id, title, description, url, image_url, site_name, created_at, author_id,
      author:profiles!resources_author_id_fkey ( username, full_name ),
      category:resource_categories ( slug, name, emoji )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!resource) notFound();

  const r = resource as unknown as {
    id: string;
    title: string;
    description: string;
    url: string | null;
    image_url: string | null;
    site_name: string | null;
    created_at: string;
    author_id: string;
    author: { username: string; full_name: string | null } | null;
    category: { slug: string; name: string; emoji: string | null } | null;
  };

  const isOwner = user.id === r.author_id;
  const authorName = r.author?.full_name ?? r.author?.username ?? "anonimo";
  const initial = authorName.charAt(0).toUpperCase();
  const host = hostnameFromUrl(r.url);

  return (
    <div className="rise max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/risorse"
          className="text-sm text-ink/60 hover:text-ink transition"
        >
          ← Torna alle risorse
        </Link>
        {isOwner && (
          <DeleteButton
            action={deleteResource}
            hiddenName="resource_id"
            hiddenValue={r.id}
            confirmText="Sei sicuro di voler eliminare questa risorsa?"
            className="text-sm text-ink/50 hover:text-plum transition"
          >
            🗑 Elimina
          </DeleteButton>
        )}
      </div>

      <article className="card overflow-hidden">
        {r.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={r.image_url}
            alt=""
            className="w-full aspect-[16/9] object-cover"
          />
        ) : r.url ? (
          <div
            className="w-full aspect-[16/9] flex items-center justify-center text-white text-6xl"
            style={{ background: RESOURCES_GRADIENT }}
          >
            {r.category?.emoji ?? "🔗"}
          </div>
        ) : null}

        <div className="p-7 sm:p-9 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {r.category && (
              <span className="chip">
                <span>{r.category.emoji ?? "•"}</span>
                <span className="font-semibold">{r.category.name}</span>
              </span>
            )}
            {host && (
              <span className="text-xs text-ink/50">{host}</span>
            )}
          </div>

          <h1 className="font-display font-semibold text-3xl sm:text-4xl leading-tight tracking-tight">
            {r.title}
          </h1>

          <p className="text-ink/80 leading-relaxed whitespace-pre-wrap">
            {r.description}
          </p>

          {r.url && (
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 !py-3 !px-6 rounded-full text-white font-semibold text-sm shadow-sm hover:shadow-md transition"
              style={{ background: RESOURCES_GRADIENT }}
            >
              🔗 Apri il link
            </a>
          )}

          <div className="pt-5 border-t border-ink/5 flex items-center gap-3 text-sm">
            <Link
              href={
                r.author?.username ? `/profilo/${r.author.username}` : "#"
              }
              className="flex items-center gap-2 min-w-0 hover:opacity-80 transition"
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: RESOURCES_GRADIENT }}
              >
                {initial}
              </span>
              <span className="font-semibold text-ink/80 truncate">
                {authorName}
              </span>
            </Link>
            <span className="text-ink/40">·</span>
            <span className="text-ink/50">{timeAgo(r.created_at)} fa</span>
          </div>
        </div>
      </article>
    </div>
  );
}
