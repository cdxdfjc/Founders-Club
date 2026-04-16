import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { BackToFeed } from "@/components/BackToFeed";
import { HeaderUserMenu } from "@/components/HeaderUserMenu";
import { MobileBottomNav } from "@/components/MobileBottomNav";

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
    { count: unreadMessageCount },
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
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .is("read_at", null),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30">
        <div className="mx-auto max-w-[1200px] px-3 sm:px-6 pt-3 sm:pt-4">
          <div className="glass rounded-full pl-2.5 sm:pl-3 pr-1.5 sm:pr-2 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-3">
            <Logo size="sm" href="/feed" />

            <nav className="flex items-center gap-0 sm:gap-1 text-xs sm:text-sm">
              <Link
                href="/community"
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-white/70 transition"
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
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-white/70 transition"
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
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-white/70 transition"
                title="Richieste d'aiuto aperte"
              >
                <span>🙋</span>
                <span className="font-bold tabular-nums">
                  {openHelpCount ?? 0}
                </span>
                <span className="text-ink/50 hidden lg:inline">aiuti</span>
              </Link>
            </nav>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <Link
                href="/messaggi"
                className="relative inline-flex w-8 h-8 sm:w-9 sm:h-9 rounded-full items-center justify-center hover:bg-white/70 transition text-sm sm:text-base"
                title="Inbox"
              >
                ✉️
                {((pendingInviteCount ?? 0) + (unreadMessageCount ?? 0)) > 0 ? (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-0.5 sm:px-1 rounded-full text-[9px] sm:text-[10px] font-bold text-white flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                    }}
                  >
                    {(pendingInviteCount ?? 0) + (unreadMessageCount ?? 0)}
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
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 py-6 sm:py-14">
          <BackToFeed />
          {children}
        </div>
      </main>

      <footer className="mx-auto max-w-[1200px] w-full px-4 sm:px-8 py-6 sm:py-8">
        <div className="glass rounded-2xl px-4 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-ink/60">
          <div className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} Founders Club</span>
            <span className="text-ink/20">·</span>
            <span className="flex items-center gap-1">
              Nata in
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dock-logo.png" alt="Dock Startup Lab" className="h-4 sm:h-5 w-auto inline-block opacity-70" />
            </span>
          </div>
          <div className="hidden sm:block">Chi non parte non arriva 🦄</div>
        </div>
      </footer>

      <MobileBottomNav />
    </div>
  );
}
