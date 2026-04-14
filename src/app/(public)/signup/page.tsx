import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

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

          <form action={signup} className="mt-8 flex flex-col gap-4">
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
