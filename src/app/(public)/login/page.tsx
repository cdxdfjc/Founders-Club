import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      redirect(`/login?error=${encodeURIComponent(authError.message)}`);
    }
    redirect("/feed");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="mx-auto max-w-[1200px] w-full px-5 sm:px-8 pt-6">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="text-sm text-ink/60 hover:text-ink transition"
          >
            ← Torna alla home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-16">
        <div className="w-full max-w-md card p-8 sm:p-10 rise">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-xl opacity-60"
                style={{
                  background:
                    "radial-gradient(circle, #89A1EF, #EF9CDA 60%, transparent)",
                }}
              ></div>
              <Image
                src="/unicorn-v2.png"
                alt=""
                width={80}
                height={80}
                className="relative float"
              />
            </div>
          </div>

          <h1 className="font-display-tight font-semibold text-4xl sm:text-5xl leading-none text-center tracking-tighter">
            Bentornato ✨
          </h1>
          <p className="mt-3 text-center text-ink/60">
            Riprendi da dove avevi lasciato.
          </p>

          <form action={login} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink/80 ml-1">
                Email
              </span>
              <input
                type="email"
                name="email"
                required
                placeholder="nome@dominio.it"
                className="field"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink/80 ml-1">
                Password
              </span>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="field"
              />
            </label>

            {error && (
              <div className="text-sm text-white bg-plum/90 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-gradient mt-2">
              Entra →
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ink/10 text-center text-sm text-ink/60">
            Non hai un account?{" "}
            <Link
              href="/signup"
              className="font-semibold gradient-text hover:underline"
            >
              Registrati
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
