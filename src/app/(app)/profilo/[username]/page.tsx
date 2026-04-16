import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ProjectPreviewCard,
  ProjectClosedCard,
} from "@/components/ProjectPreviewCard";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, city, age, occupation, avatar_url, contact_email, contact_telegram, contact_linkedin, contact_twitter, contact_instagram, contact_website, is_mentor, is_dock_alumni",
    )
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const isOwnProfile = user?.id === profile.id;

  const { data: projectsRaw } = await supabase
    .from("user_projects")
    .select(
      "id, name, description, url, status, year_start, year_end, revenue_note",
    )
    .eq("user_id", profile.id)
    .order("year_start", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const projects = projectsRaw ?? [];
  const inCorso = projects.filter((p) => (p.status ?? "in_corso") === "in_corso");
  const completati = projects.filter((p) => p.status === "completato");
  const chiusi = projects.filter((p) => p.status === "chiuso");

  const initial = (profile.full_name ?? profile.username)
    .charAt(0)
    .toUpperCase();

  return (
    <article className="max-w-4xl mx-auto rise">
      {/* Banner card */}
      <div className="card p-5 sm:p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse at 10% 0%, rgba(50,203,255,0.25), transparent 60%), radial-gradient(ellipse at 90% 100%, rgba(239,156,218,0.25), transparent 60%)",
          }}
        />

        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <div
            className="w-18 h-18 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white text-3xl sm:text-5xl font-display font-semibold shrink-0 shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #32CBFF, #89A1EF 50%, #EF9CDA)",
            }}
          >
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display-tight font-semibold text-2xl sm:text-4xl md:text-5xl leading-none tracking-tighter">
                    {profile.full_name ?? profile.username}
                  </h1>
                  {profile.is_mentor && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{
                        background: "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                      }}
                    >
                      ✨ Mentor
                    </span>
                  )}
                  {profile.is_dock_alumni && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{
                        background: "linear-gradient(135deg, #3B6BAA, #D4586A)",
                      }}
                    >
                      🚀 Dock Alumni
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3 text-ink/60 flex-wrap">
                  {profile.city && (
                    <>
                      <span>·</span>
                      <span className="text-sm">📍 {profile.city}</span>
                    </>
                  )}
                  {profile.age && (
                    <>
                      <span>·</span>
                      <span className="text-sm">🎂 {profile.age} anni</span>
                    </>
                  )}
                </div>
                {profile.occupation && (
                  <p className="mt-2 text-sm text-ink/70">
                    💼 {profile.occupation}
                  </p>
                )}
              </div>

              {isOwnProfile ? (
                <Link
                  href="/impostazioni"
                  className="btn-gradient !py-2.5 !px-5 !text-sm shrink-0"
                >
                  ✏️ Modifica profilo
                </Link>
              ) : user ? (
                <Link
                  href={`/messaggi/${profile.username}`}
                  className="btn-ghost !py-2.5 !px-5 !text-sm shrink-0"
                >
                  ✉️ Messaggio
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {profile.bio && (
          <p className="relative mt-8 text-lg leading-relaxed text-ink/80 whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Portfolio — In corso & Completati */}
      {(inCorso.length > 0 || completati.length > 0) && (
        <section className="mt-8">
          <h2 className="font-display font-semibold text-2xl mb-5 flex items-center gap-2">
            <span>🚀</span> Portfolio
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[...inCorso, ...completati].map((p) => (
              <ProjectPreviewCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* Progetti chiusi — sezione discreta */}
      {chiusi.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display font-semibold text-lg mb-3 text-ink/50 flex items-center gap-2">
            <span>📦</span> Archivio
          </h2>
          <div className="space-y-2">
            {chiusi.map((p) => (
              <ProjectClosedCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {projects.length === 0 && isOwnProfile && (
        <section className="mt-8">
          <div className="card p-8 text-center border-dashed">
            <div className="text-4xl mb-3">💡</div>
            <h3 className="font-display font-semibold text-xl">
              Aggiungi il tuo primo progetto
            </h3>
            <p className="mt-2 text-sm text-ink/60 max-w-sm mx-auto">
              Mostra cosa stai costruendo o hai costruito. Anche se è ancora
              brutto — fallo vedere.
            </p>
            <Link
              href="/impostazioni"
              className="btn-gradient !py-2.5 !px-5 !text-sm mt-5 inline-block"
            >
              ➕ Aggiungi un progetto
            </Link>
          </div>
        </section>
      )}

      {/* Contatti */}
      <ContactsBlock profile={profile} />
    </article>
  );
}

function ContactsBlock({
  profile,
}: {
  profile: {
    contact_email: string | null;
    contact_telegram: string | null;
    contact_linkedin: string | null;
    contact_twitter: string | null;
    contact_instagram: string | null;
    contact_website: string | null;
  };
}) {
  const items: {
    label: string;
    value: string;
    href: string;
    icon: string;
  }[] = [];
  if (profile.contact_email)
    items.push({
      label: "Email",
      value: profile.contact_email,
      href: `mailto:${profile.contact_email}`,
      icon: "✉️",
    });
  if (profile.contact_telegram)
    items.push({
      label: "Telegram",
      value: profile.contact_telegram,
      href: `https://t.me/${profile.contact_telegram.replace(/^@/, "")}`,
      icon: "💬",
    });
  if (profile.contact_linkedin)
    items.push({
      label: "LinkedIn",
      value: profile.contact_linkedin,
      href: profile.contact_linkedin,
      icon: "💼",
    });
  if (profile.contact_twitter)
    items.push({
      label: "X",
      value: profile.contact_twitter,
      href: `https://x.com/${profile.contact_twitter.replace(/^@/, "")}`,
      icon: "𝕏",
    });
  if (profile.contact_instagram)
    items.push({
      label: "Instagram",
      value: profile.contact_instagram,
      href: `https://instagram.com/${profile.contact_instagram.replace(/^@/, "")}`,
      icon: "📸",
    });
  if (profile.contact_website)
    items.push({
      label: "Sito",
      value: profile.contact_website,
      href: profile.contact_website,
      icon: "🌐",
    });

  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display font-semibold text-2xl mb-4 flex items-center gap-2">
        <span>📬</span> Contatti
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <a
            key={it.label}
            href={it.href}
            target="_blank"
            rel="noopener noreferrer"
            className="chip hover:bg-white transition"
          >
            <span>{it.icon}</span>
            <span className="text-ink/50">{it.label}</span>
            <span className="font-semibold">{it.value}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
