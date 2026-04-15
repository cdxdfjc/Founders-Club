import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Search = { q?: string };

type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  bio: string | null;
  city: string | null;
  avatar_url: string | null;
  is_mentor: boolean;
};

type ProjectRow = {
  id: string;
  title: string;
  owner_id: string;
};

type MemberRow = {
  user_id: string;
  project: { id: string; title: string; owner_id: string } | null;
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const qTrim = (q ?? "").trim();

  // Strategia: carica profili + progetti propri + membership, aggrega lato server.
  // Su scala MVP (<1000 utenti) è sostenibile. Se cresce, passiamo a RPC.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, bio, city, avatar_url, is_mentor")
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, owner_id");

  const { data: members } = await supabase
    .from("project_members")
    .select("user_id, project:projects ( id, title, owner_id )");

  // Mappa user_id → progetti (posseduti + membership)
  const projectsByUser = new Map<string, { id: string; title: string }[]>();
  for (const p of (projects as ProjectRow[] | null) ?? []) {
    const arr = projectsByUser.get(p.owner_id) ?? [];
    arr.push({ id: p.id, title: p.title });
    projectsByUser.set(p.owner_id, arr);
  }
  for (const m of (members as unknown as MemberRow[] | null) ?? []) {
    if (!m.project) continue;
    const arr = projectsByUser.get(m.user_id) ?? [];
    if (!arr.some((p) => p.id === m.project!.id)) {
      arr.push({ id: m.project.id, title: m.project.title });
    }
    projectsByUser.set(m.user_id, arr);
  }

  const all = (profiles as ProfileRow[] | null) ?? [];

  const filtered = qTrim
    ? all.filter((p) => {
        const needle = qTrim.toLowerCase();
        if (
          (p.full_name ?? "").toLowerCase().includes(needle) ||
          p.username.toLowerCase().includes(needle) ||
          (p.bio ?? "").toLowerCase().includes(needle) ||
          (p.city ?? "").toLowerCase().includes(needle)
        ) {
          return true;
        }
        const projs = projectsByUser.get(p.id) ?? [];
        return projs.some((x) => x.title.toLowerCase().includes(needle));
      })
    : all;

  return (
    <div className="rise space-y-8">
      <header>
        <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
          La <span className="gradient-text">community</span>
        </h1>
        <p className="mt-3 text-ink/60 max-w-xl">
          {all.length} founder italiani. Cerca per nome, progetto o città e
          scopri chi c&apos;è dentro.
        </p>
      </header>

      {/* SEARCH */}
      <div className="card p-4 sm:p-5">
        <form
          method="GET"
          action="/community"
          className="flex items-center gap-2 sm:gap-3"
        >
          <span className="text-xl shrink-0">🔍</span>
          <input
            type="text"
            name="q"
            defaultValue={qTrim}
            placeholder="Cerca per nome, username, progetto, città…"
            className="field !py-3 min-w-0 flex-1"
          />
          <button
            type="submit"
            className="btn-gradient !py-3 !px-4 !text-sm whitespace-nowrap shrink-0"
          >
            Cerca
          </button>
        </form>
      </div>

      {/* GRID */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <MemberCard
              key={p.id}
              profile={p}
              projects={projectsByUser.get(p.id) ?? []}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function MemberCard({
  profile,
  projects,
}: {
  profile: ProfileRow;
  projects: { id: string; title: string }[];
}) {
  const name = profile.full_name ?? profile.username;
  const initial = name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/profilo/${profile.username}`}
      className="card p-6 flex flex-col group hover:shadow-md transition"
    >
      <div className="flex items-start gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="w-14 h-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
            style={{
              background: "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
            }}
          >
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-semibold text-lg leading-tight truncate">
              {name}
            </h3>
            {profile.is_mentor && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: "linear-gradient(135deg, #FFC857, #EF9CDA)" }}>
                MENTOR
              </span>
            )}
          </div>
          <p className="text-sm text-ink/50">@{profile.username}</p>
          {profile.city && (
            <p className="text-xs text-ink/40 mt-0.5">📍 {profile.city}</p>
          )}
        </div>
      </div>

      {profile.bio && (
        <p className="mt-4 text-sm text-ink/70 line-clamp-2">{profile.bio}</p>
      )}

      {projects.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {projects.slice(0, 3).map((pr) => (
            <span
              key={pr.id}
              className="text-xs px-2 py-0.5 rounded-full text-ink/60 truncate max-w-[160px]"
              style={{
                background: "rgba(137,161,239,0.12)",
                border: "1px solid rgba(137,161,239,0.25)",
              }}
            >
              💡 {pr.title}
            </span>
          ))}
          {projects.length > 3 && (
            <span className="text-xs text-ink/40 px-1">
              +{projects.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-4">🤷</div>
      <h3 className="font-display font-semibold text-2xl">Nessuno trovato</h3>
      <p className="mt-2 text-ink/60 max-w-md mx-auto">
        Prova a cercare con un&apos;altra parola.
      </p>
    </div>
  );
}
