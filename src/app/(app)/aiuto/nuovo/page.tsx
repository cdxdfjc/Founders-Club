import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NuovaRichiestaForm } from "./NuovaRichiestaForm";
import { HELP_GRADIENT } from "@/lib/help";

export default async function NuovaRichiestaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto rise">
      <Link
        href="/aiuto"
        className="text-sm text-ink/60 hover:text-ink transition inline-flex items-center gap-1"
      >
        ← Torna alle richieste
      </Link>

      <header className="mt-4 mb-8">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white mb-3"
          style={{ background: HELP_GRADIENT }}
        >
          🙋 Nuova richiesta
        </span>
        <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
          Chiedi una <span className="gradient-text">mano</span>
        </h1>
        <p className="mt-3 text-ink/60">
          Più sei preciso nel contesto, migliori saranno le risposte. Puoi
          compilare a mano, o farti aiutare dall&apos;AI.
        </p>
      </header>

      <NuovaRichiestaForm />
    </div>
  );
}
