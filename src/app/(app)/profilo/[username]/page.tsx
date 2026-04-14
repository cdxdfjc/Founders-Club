import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, city, avatar_url, revenue_note, contact_email, contact_telegram, contact_linkedin, contact_twitter, contact_website, is_mentor",
    )
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  const { data: projects } = await supabase
    .from("user_projects")
    .select("id, name, description, url")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const initial = (profile.full_name ?? profile.username)
    .charAt(0)
    .toUpperCase();

  return (
    <article className="max-w-4xl mx-auto rise">
      {/* Banner card */}
      <div className="card p-8 sm:p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse at 10% 0%, rgba(50,203,255,0.25), transparent 60%), radial-gradient(ellipse at 90% 100%, rgba(239,156,218,0.25), transparent 60%)",
          }}
        />

        <div className="relative flex flex-col sm:flex-row items-start gap-6">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center text-white text-5xl font-display font-semibold shrink-0 shadow-lg"
            style={{
              background:
                "linear-gradient(135deg, #32CBFF, #89A1EF 50%, #EF9CDA)",
            }}
          >
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display-tight font-semibold text-4xl sm:text-5xl leading-none tracking-tighter">
                {profile.full_name ?? profile.username}
              </h1>
              {profile.is_mentor && (
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                  }}
                >
                  ✨ Mentor
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-3 text-ink/60">
              <span className="text-sm">@{profile.username}</span>
              {profile.city && (
                <>
                  <span>·</span>
                  <span className="text-sm">📍 {profile.city}</span>
                </>
              )}
            </div>

            {profile.revenue_note && (
              <div className="mt-5 inline-flex items-center gap-2 chip">
                <span>💰</span>
                <span>{profile.revenue_note}</span>
              </div>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="relative mt-8 text-lg leading-relaxed text-ink/80 whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Progetti */}
      {projects && projects.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display font-semibold text-2xl mb-4 flex items-center gap-2">
            <span>💡</span> Startup & progetti
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {projects.map((p) => (
              <div key={p.id} className="card p-5">
                <h3 className="font-display font-semibold text-lg">{p.name}</h3>
                {p.description && (
                  <p className="mt-1 text-sm text-ink/70 leading-relaxed">
                    {p.description}
                  </p>
                )}
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-semibold gradient-text hover:underline"
                  >
                    {p.url} ↗
                  </a>
                )}
              </div>
            ))}
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
