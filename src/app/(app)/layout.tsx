import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { BackToFeed } from "@/components/BackToFeed";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";

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

  const [
    { count: pendingInviteCount },
    { count: membersCount },
    { count: projectsCount },
    { count: openHelpCount },
  ] = await Promise.all([
    supabase
      .from("project_invites")
      .select("id", { count: "exact", head: true })
      .eq("invitee_id", user.id)
      .eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase
      .from("help_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "aperta"),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-4">
          <div className="glass rounded-full pl-3 pr-2 py-2 flex items-center justify-between gap-3">
            <Logo size="sm" href="/feed" />

            <nav className="flex items-center gap-0.5 sm:gap-1 text-sm">
              <Link
                href="/community"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full hover:bg-white/70 transition"
                title="Community"
              >
                <span>🫂</span>
                <span className="font-bold tabular-nums">
                  {membersCount ?? 0}
                </span>
                <span className="text-ink/50 hidden lg:inline">founder</span>
              </Link>
              <span className="text-ink/20 hidden sm:inline">·</span>
              <Link
                href="/progetti"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full hover:bg-white/70 transition"
                title="Progetti"
              >
                <span>💡</span>
                <span className="font-bold tabular-nums">
                  {projectsCount ?? 0}
                </span>
                <span className="text-ink/50 hidden lg:inline">progetti</span>
              </Link>
              <span className="text-ink/20 hidden sm:inline">·</span>
              <Link
                href="/aiuto"
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full hover:bg-white/70 transition"
                title="Richieste d'aiuto aperte"
              >
                <span>🙋</span>
                <span className="font-bold tabular-nums">
                  {openHelpCount ?? 0}
                </span>
                <span className="text-ink/50 hidden lg:inline">aiuti</span>
              </Link>
            </nav>

            <div className="flex items-center gap-1.5">
              <Link
                href="/messaggi"
                className="relative hidden sm:inline-flex w-9 h-9 rounded-full items-center justify-center hover:bg-white/70 transition"
                title="Inbox"
              >
                ✉️
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
              <HeaderUserMenu
                firstName={firstName}
                username={profile?.username ?? user.id}
                avatarUrl={profile?.avatar_url ?? null}
              />
            </div>
          </div>

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
