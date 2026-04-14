import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";

const FEATURES = [
  {
    emoji: "💡",
    color: "#89A1EF",
    title: "Progetti",
    body: "Pubblica la tua idea o entra in un team. Chi ci crede lascia un like, chi vuole costruire chiede di entrare.",
  },
  {
    emoji: "🙋",
    color: "#32CBFF",
    title: "Aiuto",
    body: "Sei bloccato? Chiedi una mano alla community: React, marketing, legal, design. Qualcuno ci è già passato.",
  },
  {
    emoji: "✨",
    color: "#EF9CDA",
    title: "Mentor",
    body: "Founder che ci sono già passati. Invite-only per garantire qualità reale.",
  },
  {
    emoji: "📚",
    color: "#FECEF1",
    title: "Risorse",
    body: "Tool, link ed esperienze condivise dalla community, con ricerca rapida.",
  },
  {
    emoji: "☕",
    color: "#00A5E0",
    title: "Meetup",
    body: "Un caffè a Milano, una birra a Bologna. Incontri di persona con altri founder.",
  },
  {
    emoji: "🍺",
    color: "#FFB347",
    title: "Bar",
    body: "Chiacchiere al bancone: discussioni aperte, opinioni, sfoghi. Quello che condivideresti con un founder davanti a una birra.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* NAV */}
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 pt-5">
          <div className="glass rounded-full px-4 sm:px-5 py-2.5 flex items-center justify-between gap-4">
            <Logo />
            <nav className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold rounded-full hover:bg-white/60 transition"
              >
                Accedi
              </Link>
              <Link href="/signup" className="btn-gradient !py-2.5 !px-5 !text-[14px]">
                Registrati ✨
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-[1200px] px-5 sm:px-8 pt-16 sm:pt-24 pb-20">
        <div className="grid grid-cols-12 gap-8 items-center">
          <div className="col-span-12 lg:col-span-7 rise">
            <h1 className="font-display-tight font-semibold text-[56px] sm:text-[88px] lg:text-[112px] leading-[0.9] tracking-tighter">
              <span className="block whitespace-nowrap">La community</span>
              <span className="block whitespace-nowrap gradient-text">
                dei founder.
              </span>
            </h1>
            <p className="mt-8 text-[19px] sm:text-[21px] leading-relaxed text-ink/70 max-w-xl">
              Un posto dove puoi chiedere aiuto, pubblicare la tua idea, trovare
              mentor e incontrare altre persone che vogliono costruire qualcosa
              di buono. Niente guru, niente pose — solo founder veri.
            </p>
            <div className="mt-10">
              <Link href="/login" className="btn-gradient">
                Entra nella community →
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-ink/60">
              <div className="flex -space-x-2">
                {["bg-sky-aqua", "bg-wisteria", "bg-plum", "bg-petal"].map((c, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full ${c} border-2 border-white`}
                  ></div>
                ))}
              </div>
              <span className="flex items-center gap-2">
                Popolata da
                <Image
                  src="/dock-logo.png"
                  alt="Dock Startup Lab"
                  width={120}
                  height={36}
                  className="h-7 w-auto"
                />
              </span>
            </div>
          </div>

          <div
            className="col-span-12 lg:col-span-5 relative rise"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative aspect-square max-w-[480px] mx-auto">
              {/* Halo background */}
              <div
                className="absolute inset-0 rounded-full shimmer"
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(50,203,255,0.35), rgba(137,161,239,0.3) 40%, rgba(239,156,218,0.35) 75%, transparent 85%)",
                  filter: "blur(30px)",
                }}
              ></div>

              {/* Rotating orbit ring */}
              <div
                className="absolute inset-6 rounded-full border border-dashed border-ink/10"
                style={{ animation: "spin-slow 45s linear infinite" }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-sky-aqua shadow-lg"></div>
                <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-3 rounded-full bg-plum shadow-lg"></div>
                <div className="absolute -bottom-2 left-1/3 w-3 h-3 rounded-full bg-wisteria shadow-lg"></div>
              </div>

              {/* Unicorn */}
              <div className="absolute inset-0 flex items-center justify-center float">
                <Image
                  src="/unicorn-v2.png"
                  alt="Founders Club mascot"
                  width={420}
                  height={420}
                  priority
                  className="drop-shadow-[0_25px_60px_rgba(137,161,239,0.45)]"
                />
              </div>

              {/* Floating chips */}
              <div className="absolute top-8 right-0 card !rounded-2xl !p-3 flex items-center gap-2 animate-pulse">
                <span className="text-lg">✨</span>
                <span className="text-sm font-semibold">+142 founder</span>
              </div>
              <div
                className="absolute bottom-16 left-0 card !rounded-2xl !p-3 flex items-center gap-2"
                style={{ animation: "float 7s ease-in-out infinite" }}
              >
                <span className="text-lg">☕</span>
                <span className="text-sm font-semibold">Caffè a Milano</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-[1200px] px-5 sm:px-8 py-20">
        <div className="text-center mb-14">
          <div className="chip mb-4">✨ Cinque modi per partecipare</div>
          <h2 className="font-display-tight font-semibold text-[40px] sm:text-[64px] leading-[0.95] tracking-tighter">
            Un'unica community,{" "}
            <span className="gradient-text">tante possibilità.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card p-7 rise"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 border"
                style={{
                  background: `${f.color}30`,
                  borderColor: `${f.color}55`,
                }}
              >
                {f.emoji}
              </div>
              <h3 className="font-display font-semibold text-2xl leading-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-ink/70 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MANIFESTO */}
      <section className="mx-auto max-w-[1200px] px-5 sm:px-8 py-20">
        <div
          className="relative overflow-hidden rounded-[48px] p-10 sm:p-16 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(50,203,255,0.9), rgba(137,161,239,0.9) 50%, rgba(239,156,218,0.9))",
          }}
        >
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-40 blur-3xl"
            style={{ background: "var(--petal)" }}
          ></div>
          <div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--sky-aqua)" }}
          ></div>

          <div className="relative">
            <div className="text-4xl mb-6">🦄</div>
            <h2 className="font-display-tight font-semibold text-white text-[36px] sm:text-[56px] leading-[1] tracking-tighter max-w-3xl mx-auto">
              Non serve un altro social.
              <br />
              Serve un posto dove i founder si aiutano davvero.
            </h2>
            <div className="mt-10">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-ink font-semibold hover:scale-105 transition-transform shadow-xl"
              >
                Entra gratis →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto max-w-[1200px] px-5 sm:px-8 py-10">
        <div className="glass rounded-3xl px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-sm text-ink/60">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <div>
            © {new Date().getFullYear()} Founders Club · Italia
          </div>
        </div>
      </footer>
    </div>
  );
}
