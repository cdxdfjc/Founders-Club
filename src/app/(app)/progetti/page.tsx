import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { STAGES, stageMeta } from "@/lib/projects";

type Search = {
  q?: string;
  cat?: string;
  stage?: string;
};

export default async function ProgettiPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q, cat, stage } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("project_categories")
    .select("id, slug, name, emoji")
    .order("name");

  let query = supabase
    .from("projects")
    .select(
      `
      id, title, tagline, description, tags, stage, created_at,
      owner:profiles!projects_owner_id_fkey ( username, full_name ),
      category:project_categories ( id, slug, name, emoji ),
      project_likes ( user_id ),
      project_comments ( id ),
      project_members ( user_id )
      `,
    )
    .order("created_at", { ascending: false })
    .limit(60);

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%`,
    );
  }
  if (cat) {
    const found = categories?.find((c) => c.slug === cat);
    if (found) query = query.eq("category_id", found.id);
  }
  if (stage) {
    query = query.eq("stage", stage);
  }

  const { data: projects } = await query;

  const activeCatName = cat
    ? categories?.find((c) => c.slug === cat)?.name
    : undefined;
  const activeStageLabel = stage
    ? STAGES.find((s) => s.value === stage)?.label
    : undefined;
  const activeFilterCount = (cat ? 1 : 0) + (stage ? 1 : 0);
  const activeFilterSummary = [activeCatName, activeStageLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rise space-y-8">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
            Idee & <span className="gradient-text">progetti</span>
          </h1>
          <p className="mt-3 text-ink/60 max-w-xl">
            Quello che la community sta costruendo. Lascia un like, chiedi di
            entrare, scrivi un commento.
          </p>
        </div>
        <Link
          href="/progetti/nuovo"
          className="btn-gradient !py-3 !px-5 self-start"
        >
          ✨ Pubblica idea
        </Link>
      </header>

      {/* SEARCH + FILTRI */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-3">
          <form
            method="GET"
            action="/progetti"
            className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
          >
            {cat && <input type="hidden" name="cat" value={cat} />}
            {stage && <input type="hidden" name="stage" value={stage} />}
            <span className="text-xl shrink-0">🔍</span>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Cerca progetti…"
              className="field !py-3 min-w-0"
            />
            <button
              type="submit"
              className="btn-gradient !py-3 !px-4 !text-sm whitespace-nowrap shrink-0"
            >
              Cerca
            </button>
          </form>

          <details className="relative group shrink-0">
            <summary className="list-none cursor-pointer select-none flex items-center gap-2 px-4 py-3 rounded-full border border-ink/10 bg-white/70 hover:bg-white transition text-sm font-semibold">
              <span>⚙️</span>
              <span className="hidden sm:inline">Filtri</span>
              {activeFilterCount > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--sky-aqua), var(--wisteria), var(--plum))",
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
              <span className="text-ink/40 text-xs group-open:rotate-180 transition-transform">
                ▾
              </span>
            </summary>

            <div className="absolute right-0 top-full mt-2 w-[min(90vw,520px)] card p-5 z-20 shadow-xl">
              {activeFilterCount > 0 && (
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-ink/5">
                  <span className="text-xs text-ink/60 truncate">
                    {activeFilterSummary}
                  </span>
                  <Link
                    href={
                      q ? `/progetti?q=${encodeURIComponent(q)}` : "/progetti"
                    }
                    className="text-xs font-semibold text-plum hover:underline whitespace-nowrap ml-3"
                  >
                    Reset filtri
                  </Link>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
                    Categoria
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      href={buildHref({ q, cat: undefined, stage })}
                      active={!cat}
                      label="Tutte"
                    />
                    {categories?.map((c) => (
                      <FilterChip
                        key={c.slug}
                        href={buildHref({ q, cat: c.slug, stage })}
                        active={cat === c.slug}
                        label={`${c.emoji ?? "•"} ${c.name}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
                    Stage
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      href={buildHref({ q, cat, stage: undefined })}
                      active={!stage}
                      label="Tutti"
                    />
                    {STAGES.map((s) => (
                      <FilterChip
                        key={s.value}
                        href={buildHref({ q, cat, stage: s.value })}
                        active={stage === s.value}
                        label={`${s.emoji} ${s.label}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* GRID */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p as unknown as ProjectCardData} />
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
  if (params.stage) s.set("stage", params.stage);
  const qs = s.toString();
  return qs ? `/progetti?${qs}` : "/progetti";
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
              background:
                "linear-gradient(135deg, var(--sky-aqua), var(--wisteria), var(--plum))",
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

type ProjectCardData = {
  id: string;
  title: string;
  tagline: string | null;
  description: string;
  tags: string[];
  stage: string | null;
  owner: { username: string; full_name: string | null } | null;
  category: { slug: string; name: string; emoji: string | null } | null;
  project_likes: { user_id: string }[];
  project_comments: { id: string }[];
  project_members: { user_id: string }[];
};

function ProjectCard({ p }: { p: ProjectCardData }) {
  const stage = stageMeta(p.stage);
  const ownerName = p.owner?.full_name ?? p.owner?.username ?? "anonimo";
  const initial = ownerName.charAt(0).toUpperCase();

  return (
    <Link href={`/progetti/${p.id}`} className="card p-6 flex flex-col group">
      {/* Top row: category + stage */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {p.category ? (
          <span className="chip">
            <span>{p.category.emoji ?? "•"}</span>
            <span className="font-semibold">{p.category.name}</span>
          </span>
        ) : (
          <span />
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

      {/* Title + tagline */}
      <h3 className="font-display font-semibold text-2xl leading-tight tracking-tight">
        {p.title}
      </h3>
      {p.tagline && (
        <p className="mt-1.5 text-ink/70 text-sm leading-snug line-clamp-2">
          {p.tagline}
        </p>
      )}

      {/* Tags */}
      {p.tags && p.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-xs px-2 py-0.5 rounded-full text-ink/60"
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

      <div className="mt-auto pt-5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{
              background: "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
            }}
          >
            {initial}
          </span>
          <span className="font-semibold text-ink/70 truncate">{ownerName}</span>
        </div>
        <div className="flex items-center gap-3 text-ink/50 shrink-0">
          <span title="Like">❤️ {p.project_likes?.length ?? 0}</span>
          <span title="Commenti">💬 {p.project_comments?.length ?? 0}</span>
          <span title="Membri">👥 {(p.project_members?.length ?? 0) + 1}</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-4">🌱</div>
      <h3 className="font-display font-semibold text-2xl">
        Nessun progetto trovato
      </h3>
      <p className="mt-2 text-ink/60 max-w-md mx-auto">
        Prova a togliere qualche filtro, oppure sii il primo a pubblicare la
        tua idea.
      </p>
      <div className="mt-6">
        <Link href="/progetti/nuovo" className="btn-gradient !py-3 !px-6">
          ✨ Pubblica la prima
        </Link>
      </div>
    </div>
  );
}
