import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NuovoProgettoForm } from "./NuovoProgettoForm";

export default async function NuovoProgettoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: categories } = await supabase
    .from("project_categories")
    .select("slug, name, emoji")
    .order("name");

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, username, full_name")
    .neq("id", user.id)
    .order("username");

  return (
    <div className="max-w-2xl mx-auto rise">
      <Link
        href="/progetti"
        className="text-sm text-ink/60 hover:text-ink transition inline-flex items-center gap-1"
      >
        ← Torna ai progetti
      </Link>

      <header className="mt-4 mb-8">
        <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
          Pubblica la tua{" "}
          <span className="gradient-text">idea</span>
        </h1>
        <p className="mt-3 text-ink/60">
          Racconta cosa stai costruendo. Più sei concreto, più la community
          potrà aiutarti.
        </p>
      </header>

      <NuovoProgettoForm categories={categories ?? []} candidates={allProfiles ?? []} />
    </div>
  );
}
