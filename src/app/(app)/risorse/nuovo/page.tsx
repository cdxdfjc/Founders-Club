import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NuovaRisorsaForm } from "./NuovaRisorsaForm";

export default async function NuovaRisorsaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: categories } = await supabase
    .from("resource_categories")
    .select("slug, name, emoji")
    .order("name");

  return (
    <div className="rise max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/risorse"
          className="text-sm text-ink/60 hover:text-ink transition"
        >
          ← Torna alle risorse
        </Link>
        <h1 className="mt-3 font-display-tight font-semibold text-4xl sm:text-5xl leading-none tracking-tighter">
          Condividi una <span className="gradient-text">risorsa</span>
        </h1>
        <p className="mt-3 text-ink/60">
          Passa un link, una guida, un tool. Se vuoi scrivi solo due righe — al
          resto ci pensa l&apos;AI, tu rivedi prima di pubblicare.
        </p>
      </div>

      <NuovaRisorsaForm categories={categories ?? []} />
    </div>
  );
}
