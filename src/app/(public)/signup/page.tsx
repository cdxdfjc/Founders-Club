import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { loginWithGoogle } from "@/lib/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  async function signup(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("full_name") ?? "");
    const username = String(formData.get("username") ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    const supabase = await createClient();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username },
      },
    });

    if (authError) {
      redirect(`/signup?error=${encodeURIComponent(authError.message)}`);
    }
    redirect("/signup?sent=1");
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="mx-auto max-w-[1200px] w-full px-5 sm:px-8 pt-6">
          <Logo />
        </header>
        <main className="flex-1 flex items-center justify-center px-5 sm:px-8 py-16">
          <div className="w-full max-w-md card p-10 text-center rise">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl bg-petal/40 border border-petal">
                📬
              </div>
            </div>
            <h1 className="font-display-tight font-semibold text-4xl leading-none tracking-tighter">
              Controlla la tua{" "}
              <span className="gradient-text">email</span>
            </h1>
            <p className="mt-4 text-ink/70 leading-relaxed">
              Ti abbiamo inviato un link di conferma. Cliccaci sopra per
              attivare il tuo account.
            </p>
            <div className="mt-8">
              <Link href="/login" className="btn-ghost">
                ← Torna al login
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
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
                    "radial-gradient(circle, #32CBFF, #89A1EF 60%, transparent)",
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
            Benvenuto 🦄
          </h1>
          <p className="mt-3 text-center text-ink/60">
            Crea il tuo account e unisciti alla community.
          </p>

          <form action={loginWithGoogle} className="mt-8">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-full bg-white border border-ink/10 px-5 py-3 text-sm font-semibold text-ink/80 hover:bg-white/80 hover:border-ink/20 transition shadow-sm"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
              </svg>
              Continua con Google
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-ink/10"></div>
            <span className="text-xs text-ink/50 font-medium">oppure con email</span>
            <div className="flex-1 h-px bg-ink/10"></div>
          </div>

          <form action={signup} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink/80 ml-1">
                Nome completo
              </span>
              <input
                type="text"
                name="full_name"
                required
                placeholder="Mario Rossi"
                className="field"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-ink/80 ml-1">
                Username
              </span>
              <input
                type="text"
                name="username"
                required
                pattern="[a-zA-Z0-9_]+"
                minLength={3}
                placeholder="mariorossi"
                className="field"
              />
            </label>
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
                minLength={8}
                placeholder="almeno 8 caratteri"
                className="field"
              />
            </label>

            {error && (
              <div className="text-sm text-white bg-plum/90 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button type="submit" className="btn-gradient mt-2">
              Crea il mio account →
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ink/10 text-center text-sm text-ink/60">
            Hai già un account?{" "}
            <Link
              href="/login"
              className="font-semibold gradient-text hover:underline"
            >
              Accedi
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
