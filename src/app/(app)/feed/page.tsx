import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";

const CARDS = [
  {
    href: "/progetti",
    emoji: "💡",
    color: "#89A1EF",
    title: "Progetti",
    body: "Pubblica la tua idea o entra in un team.",
  },
  {
    href: "/aiuto",
    emoji: "🙋",
    color: "#32CBFF",
    title: "Aiuto",
    body: "Sei bloccato? Chiedi una mano alla community.",
  },
  {
    href: "/mentor",
    emoji: "✨",
    color: "#EF9CDA",
    title: "Mentor",
    body: "Parla con founder esperti.",
  },
  {
    href: "/risorse",
    emoji: "📚",
    color: "#FECEF1",
    title: "Risorse",
    body: "Tool, link, esperienze condivise.",
  },
  {
    href: "/eventi",
    emoji: "☕",
    color: "#00A5E0",
    title: "Meetup",
    body: "Incontri di persona in città.",
  },
  {
    href: "/bar",
    emoji: "🍺",
    color: "#FFB347",
    title: "Bar",
    body: "Chiacchiere al bancone con altri founder.",
  },
  {
    href: "/community",
    emoji: "🫂",
    color: "#B4A7F5",
    title: "Community",
    body: "Scopri chi c'è dentro e su cosa sta lavorando.",
  },
];

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, username, avatar_url, bio, city, age, occupation")
    .eq("id", user!.id)
    .maybeSingle();

  const firstName =
    profile?.full_name?.split(" ")[0] ?? profile?.username ?? "founder";

  const checks: { key: keyof NonNullable<typeof profile>; label: string }[] = [
    { key: "full_name", label: "nome" },
    { key: "avatar_url", label: "foto" },
    { key: "bio", label: "bio" },
    { key: "city", label: "città" },
    { key: "age", label: "età" },
    { key: "occupation", label: "professione" },
  ];
  const missingLabels = checks
    .filter((c) => {
      const v = profile?.[c.key];
      return v === null || v === undefined || v === "";
    })
    .map((c) => c.label);
  const total = checks.length;
  const completed = total - missingLabels.length;
  const showBanner = completed < total;

  return (
    <div>
      {showBanner && (
        <ProfileCompletionBanner
          completed={completed}
          total={total}
          missingLabels={missingLabels}
        />
      )}
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="rise">
          <div className="chip mb-4">
            <span className="w-2 h-2 rounded-full bg-fresh-sky animate-pulse"></span>
            Bentornato nella community
          </div>
          <h1 className="font-display-tight font-semibold text-3xl sm:text-5xl md:text-7xl leading-[0.9] tracking-tighter">
            Ciao <span className="gradient-text">{firstName}</span> 👋
          </h1>
          <p className="mt-3 sm:mt-5 text-base sm:text-lg text-ink/70 max-w-xl">
            Fallo brutto, ma fallo. ✨
          </p>
        </div>
        <div className="hidden md:block rise" style={{ animationDelay: "0.15s" }}>
          <Image
            src="/unicorn-v2.png"
            alt=""
            width={140}
            height={140}
            className="float drop-shadow-[0_20px_40px_rgba(137,161,239,0.4)]"
          />
        </div>
      </div>

      <div className="mt-8 sm:mt-14 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {CARDS.map((c, i) => (
          <Link
            key={c.href}
            href={c.href}
            className="card p-4 sm:p-6 group rise flex flex-col"
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-4 border transition-transform group-hover:scale-110 group-hover:rotate-6"
              style={{
                background: `${c.color}30`,
                borderColor: `${c.color}55`,
              }}
            >
              {c.emoji}
            </div>
            <h3 className="font-display font-semibold text-base sm:text-xl">{c.title}</h3>
            <p className="mt-1 text-ink/60 text-xs sm:text-sm min-h-0 sm:min-h-[2.5rem] line-clamp-2">{c.body}</p>
            <div className="mt-auto pt-3 sm:pt-4 text-xs sm:text-sm font-semibold text-ink/40 group-hover:text-ink transition-colors">
              Apri →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
