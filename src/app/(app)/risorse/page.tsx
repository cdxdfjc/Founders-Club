import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RESOURCES_GRADIENT, hostnameFromUrl } from "@/lib/resources";

type Search = {
  q?: string;
  cat?: string;
};

export default async function RisorsePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q, cat } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("resource_categories")
    .select("id, slug, name, emoji")
    .order("name");

  let query = supabase
    .from("resources")
    .select(
      `
      id, title, description, url, image_url, site_name, created_at,
      author:profiles!resources_author_id_fkey ( username, full_name ),
      category:resource_categories ( id, slug, name, emoji )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(60);

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,description.ilike.%${q}%`,
    );
  }
  if (cat) {
    const found = categories?.find((c) => c.slug === cat);
    if (found) query = query.eq("category_id", found.id);
  }

  const { data: resources } = await query;

  const activeCatName = cat
    ? categories?.find((c) => c.slug === cat)?.name
    : undefined;

  return (
    <div className="rise space-y-8">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display-tight font-semibold text-3xl sm:text-5xl md:text-6xl leading-none tracking-tighter">
            Risorse &{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: RESOURCES_GRADIENT }}
            >
              consigli
            </span>
          </h1>
          <p className="mt-3 text-ink/60 max-w-xl">
            Tool, guide, video, dritte. La libreria collettiva dei founder
            italiani — passa un link, lascia una nota, aiuta gli altri.
          </p>
        </div>
        <Link
          href="/risorse/nuovo"
          className="!py-3 !px-5 self-start rounded-full text-white font-semibold text-sm shadow-sm hover:shadow-md transition"
          style={{ background: RESOURCES_GRADIENT }}
        >
          📚 Condividi risorsa
        </Link>
      </header>

      {/* SEARCH + FILTRI */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <form
            method="GET"
            action="/risorse"
            className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
          >
            {cat && <input type="hidden" name="cat" value={cat} />}
            <span className="text-xl shrink-0">🔍</span>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Cerca risorse…"
              className="field !py-3 min-w-0"
            />
            <button
              type="submit"
              className="!py-3 !px-4 !text-sm whitespace-nowrap shrink-0 rounded-full text-white font-semibold shadow-sm hover:shadow-md transition"
              style={{ background: RESOURCES_GRADIENT }}
            >
              Cerca
            </button>
          </form>

          <details className="relative group shrink-0">
            <summary className="list-none cursor-pointer select-none flex items-center gap-2 px-4 py-3 rounded-full border border-ink/10 bg-white/70 hover:bg-white transition text-sm font-semibold">
              <span>⚙️</span>
              <span className="hidden sm:inline">Categorie</span>
              {cat && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
                  style={{ background: RESOURCES_GRADIENT }}
                >
                  1
                </span>
              )}
              <span className="text-ink/40 text-xs group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>

            <div className="absolute right-0 top-full mt-2 w-[min(90vw,520px)] card p-5 z-20 shadow-xl">
              {cat && (
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink/5">
                  <span className="text-xs text-ink/60 truncate">
                    {activeCatName}
                  </span>
                  <Link
                    href={q ? `/risorse?q=${encodeURIComponent(q)}` : "/risorse"}
                    className="text-xs font-semibold text-plum hover:underline whitespace-nowrap ml-3"
                  >
                    Reset
                  </Link>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
                  Categoria
                </p>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    href={buildHref({ q, cat: undefined })}
                    active={!cat}
                    label="Tutte"
                  />
                  {categories?.map((c) => (
                    <FilterChip
                      key={c.slug}
                      href={buildHref({ q, cat: c.slug })}
                      active={cat === c.slug}
                      label={`${c.emoji ?? "•"} ${c.name}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* GRID */}
      {resources && resources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {resources.map((r) => (
            <ResourceCard key={r.id} r={r as unknown as ResourceCardData} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function buildHref(params: Search): string {
  const s = new URLSearchParams();
  if (params.q) s.set("q", params.q);
  if (params.cat) s.set("cat", params.cat);
  const qs = s.toString();
  return qs ? `/risorse?${qs}` : "/risorse";
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="chip transition"
      style={
        active
          ? {
              background: RESOURCES_GRADIENT,
              color: "white",
              borderColor: "transparent",
              fontWeight: 600,
            }
          : undefined
      }
    >
      {label}
    </Link>
  );
}

type ResourceCardData = {
  id: string;
  title: string;
  description: string;
  url: string | null;
  image_url: string | null;
  site_name: string | null;
  author: { username: string; full_name: string | null } | null;
  category: { slug: string; name: string; emoji: string | null } | null;
};

function ResourceCard({ r }: { r: ResourceCardData }) {
  const authorName = r.author?.full_name ?? r.author?.username ?? "anonimo";
  const initial = authorName.charAt(0).toUpperCase();
  const host = hostnameFromUrl(r.url);
  const isTextOnly = !r.url;

  return (
    <Link
      href={`/risorse/${r.id}`}
      className="card overflow-hidden flex flex-col group"
      style={
        isTextOnly
          ? {
              borderLeftWidth: "4px",
              borderLeftColor: "#6B8EEA",
            }
          : undefined
      }
    >
      {/* Cover */}
      {r.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={r.image_url}
          alt=""
          className="w-full aspect-[16/9] object-cover"
        />
      ) : r.url ? (
        <div
          className="w-full aspect-[16/9] flex items-center justify-center text-white text-4xl font-bold"
          style={{ background: RESOURCES_GRADIENT }}
        >
          {r.category?.emoji ?? "🔗"}
        </div>
      ) : null}

      <div className="p-4 sm:p-6 flex flex-col flex-1">
        {/* Top row: category + host */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {r.category ? (
            <span className="chip">
              <span>{r.category.emoji ?? "•"}</span>
              <span className="font-semibold">{r.category.name}</span>
            </span>
          ) : (
            <span />
          )}
          {host && (
            <span className="text-xs text-ink/50 truncate max-w-[45%]">
              {host}
            </span>
          )}
          {isTextOnly && (
            <span className="text-xs text-ink/50">💬 consiglio</span>
          )}
        </div>

        {/* Title + description */}
        <h3 className="font-display font-semibold text-xl leading-tight tracking-tight">
          {r.title}
        </h3>
        <p className="mt-2 text-ink/70 text-sm leading-snug line-clamp-3">
          {r.description}
        </p>

        <div className="mt-auto pt-5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: RESOURCES_GRADIENT }}
            >
              {initial}
            </span>
            <span className="font-semibold text-ink/70 truncate">
              {authorName}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-4">📚</div>
      <h3 className="font-display font-semibold text-2xl">
        Nessuna risorsa trovata
      </h3>
      <p className="mt-2 text-ink/60 max-w-md mx-auto">
        Prova a togliere qualche filtro, oppure sii il primo a condividere un
        consiglio.
      </p>
      <div className="mt-6">
        <Link
          href="/risorse/nuovo"
          className="!py-3 !px-6 rounded-full text-white font-semibold text-sm shadow-sm hover:shadow-md transition inline-block"
          style={{ background: RESOURCES_GRADIENT }}
        >
          📚 Condividi la prima
        </Link>
      </div>
    </div>
  );
}
