import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Search = { q?: string };

type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_mentor: boolean;
  age: number | null;
  city: string | null;
  occupation: string | null;
};

type UserProjectRow = {
  id: string;
  user_id: string;
  name: string;
  status: string | null;
};

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const qTrim = (q ?? "").trim();

  // Carica profili + user_projects (progetti dal profilo, non quelli pubblicati)
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, is_mentor, age, city, occupation",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const { data: userProjects } = await supabase
    .from("user_projects")
    .select("id, user_id, name, status")
    .order("year_start", { ascending: false, nullsFirst: false });

  // Mappa user_id → user_projects
  const projectsByUser = new Map<string, { id: string; name: string }[]>();
  for (const p of (userProjects as UserProjectRow[] | null) ?? []) {
    const arr = projectsByUser.get(p.user_id) ?? [];
    arr.push({ id: p.id, name: p.name });
    projectsByUser.set(p.user_id, arr);
  }

  const all = (profiles as ProfileRow[] | null) ?? [];

  const filtered = qTrim
    ? all.filter((p) => {
        const needle = qTrim.toLowerCase();
        if (
          (p.full_name ?? "").toLowerCase().includes(needle) ||
          p.username.toLowerCase().includes(needle) ||
          (p.city ?? "").toLowerCase().includes(needle) ||
          (p.occupation ?? "").toLowerCase().includes(needle)
        ) {
          return true;
        }
        const projs = projectsByUser.get(p.id) ?? [];
        return projs.some((x) => x.name.toLowerCase().includes(needle));
      })
    : all;

  return (
    <div className="rise space-y-8">
      <header>
        <h1 className="font-display-tight font-semibold text-3xl sm:text-5xl md:text-6xl leading-none tracking-tighter">
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
            placeholder="Cerca per nome, città, professione o progetto…"
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
  projects: { id: string; name: string }[];
}) {
  const name = profile.full_name ?? profile.username;
  const initial = name.charAt(0).toUpperCase();

  return (
    <Link
      href={`/profilo/${profile.username}`}
      className="card p-4 sm:p-6 flex flex-col group hover:shadow-md transition"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <span
            className="w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white text-base sm:text-lg font-bold shrink-0"
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
              {profile.age ? (
                <span className="text-ink/40 font-normal">
                  , {profile.age}
                </span>
              ) : null}
            </h3>
            {profile.is_mentor && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{
                  background: "linear-gradient(135deg, #FFC857, #EF9CDA)",
                }}
              >
                MENTOR
              </span>
            )}
          </div>
          {profile.city && (
            <p className="text-sm text-ink/60 truncate">📍 {profile.city}</p>
          )}
          {profile.occupation && (
            <p className="text-sm text-ink/50 truncate">
              💼 {profile.occupation}
            </p>
          )}
        </div>
      </div>

      {projects.length > 0 ? (
        <div className="mt-5 pt-5 border-t border-ink/5">
          <p className="text-[11px] font-semibold text-ink/40 uppercase tracking-wider mb-2">
            Progetti
          </p>
          <ul className="space-y-1">
            {projects.slice(0, 4).map((pr) => (
              <li
                key={pr.id}
                className="text-sm text-ink/70 truncate flex items-center gap-1.5"
              >
                <span className="text-xs">💡</span>
                <span className="truncate">{pr.name}</span>
              </li>
            ))}
            {projects.length > 4 && (
              <li className="text-xs text-ink/40">
                +{projects.length - 4} altri
              </li>
            )}
          </ul>
        </div>
      ) : (
        <p className="mt-5 pt-5 border-t border-ink/5 text-xs text-ink/40 italic">
          Nessun progetto nel profilo ancora.
        </p>
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
