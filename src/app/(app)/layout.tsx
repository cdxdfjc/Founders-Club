import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/lib/actions/auth";
import { Logo } from "@/components/Logo";
import { BackToFeed } from "@/components/BackToFeed";

const NAV = [
  { href: "/progetti", label: "Progetti", emoji: "💡" },
  { href: "/community", label: "Community", emoji: "🫂" },
  { href: "/aiuto", label: "Aiuto", emoji: "🙋" },
  { href: "/mentor", label: "Mentor", emoji: "✨" },
  { href: "/risorse", label: "Risorse", emoji: "📚" },
  { href: "/eventi", label: "Meetup", emoji: "☕" },
  { href: "/bar", label: "Bar", emoji: "🍺" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    profile?.full_name?.split(" ")[0] ?? profile?.username ?? "tu";

  const { count: pendingInviteCount } = await supabase
    .from("project_invites")
    .select("id", { count: "exact", head: true })
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-4">
          <div className="glass rounded-full pl-3 pr-2 py-2 flex items-center justify-between gap-3">
            <Logo size="sm" href="/feed" />

            <nav className="hidden lg:flex items-center gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3.5 py-2 rounded-full text-sm font-semibold hover:bg-white/70 transition flex items-center gap-1.5"
                >
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5">
              <Link
                href="/inviti"
                className="relative hidden sm:inline-flex w-9 h-9 rounded-full items-center justify-center hover:bg-white/70 transition"
                title="Inviti"
              >
                📬
                {pendingInviteCount && pendingInviteCount > 0 ? (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                    }}
                  >
                    {pendingInviteCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/messaggi"
                className="hidden sm:inline-flex w-9 h-9 rounded-full items-center justify-center hover:bg-white/70 transition"
                title="Messaggi"
              >
                ✉️
              </Link>
              <Link
                href={`/profilo/${profile?.username ?? user.id}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-white/70 transition"
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
                  }}
                >
                  {firstName.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm font-semibold hidden sm:inline">
                  {firstName}
                </span>
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/70 transition text-ink/60"
                  title="Esci"
                >
                  ⎋
                </button>
              </form>
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="lg:hidden mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="chip whitespace-nowrap hover:bg-white transition"
              >
                <span>{item.emoji}</span>
                <span className="font-semibold">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-10 sm:py-14">
          <BackToFeed />
          {children}
        </div>
      </main>

      <footer className="mx-auto max-w-[1200px] w-full px-5 sm:px-8 py-8">
        <div className="glass rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/60">
          <div>© {new Date().getFullYear()} Founders Club</div>
          <div>Chi non parte non arriva 🦄</div>
        </div>
      </footer>
    </div>
  );
}
