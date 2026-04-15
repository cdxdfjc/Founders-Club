import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createBarThread } from "@/lib/actions/bar";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NuovoThreadPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto rise">
      <Link
        href="/bar"
        className="text-sm text-ink/60 hover:text-ink transition inline-flex items-center gap-1"
      >
        ← Torna al bar
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
          Apri un <span className="gradient-text">thread</span>
        </h1>
        <p className="mt-3 text-ink/60">
          Un titolo chiaro e il primo messaggio. La community risponderà sotto.
        </p>
      </header>

      <form action={createBarThread} className="card p-7 sm:p-9 space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-ink/80 mb-1.5 block">
            Titolo
          </span>
          <input
            name="title"
            className="field"
            placeholder="Es. Quanto pagate per una landing page fatta bene?"
            required
            minLength={3}
            maxLength={140}
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink/80 mb-1.5 block">
            Messaggio
          </span>
          <textarea
            name="body"
            rows={8}
            className="field resize-y min-h-[180px]"
            placeholder="Racconta, chiedi, sfogati…"
            required
            maxLength={4000}
          />
        </label>

        <div className="flex items-center justify-between pt-2">
          <Link href="/bar" className="btn-ghost !py-2.5 !px-5 !text-sm">
            Annulla
          </Link>
          <SubmitButton className="btn-gradient" pendingLabel="Pubblico…">
            🍺 Pubblica
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
