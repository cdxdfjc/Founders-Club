import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateEmail, updatePassword } from "@/lib/actions/profile";
import { NewUserProjectForm } from "@/components/NewUserProjectForm";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";
import { ProfileForm } from "@/components/ProfileForm";
import { ContactsForm } from "@/components/ContactsForm";
import { ProjectCard } from "@/components/ProjectCard";

export default async function ImpostazioniPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, bio, city, age, occupation, contact_email, contact_telegram, contact_linkedin, contact_twitter, contact_instagram, contact_website, is_mentor",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  const { data: projects } = await supabase
    .from("user_projects")
    .select(
      "id, name, description, url, status, year_start, year_end, revenue_note",
    )
    .eq("user_id", user.id)
    .order("year_start", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const initial = (profile.full_name ?? profile.username)
    .charAt(0)
    .toUpperCase();

  return (
    <div className="max-w-3xl mx-auto rise space-y-8">
      {/* HEADER */}
      <header className="flex items-center gap-5">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-4xl font-display font-semibold shrink-0 shadow-lg"
          style={{
            background:
              "linear-gradient(135deg, #32CBFF, #89A1EF 50%, #EF9CDA)",
          }}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="font-display-tight font-semibold text-4xl sm:text-5xl leading-none tracking-tighter">
            Impostazioni
          </h1>
          <p className="mt-2 text-ink/60 text-sm">
            Gestisci come ti vede la community ·{" "}
            <a
              href={`/profilo/${profile.username}`}
              className="font-semibold gradient-text hover:underline"
            >
              vedi il tuo profilo →
            </a>
          </p>
        </div>
      </header>

      {/* PROFILO */}
      <Section emoji="👤" title="Profilo pubblico">
        <ProfileForm
          username={profile.username}
          initial={{
            full_name: profile.full_name ?? "",
            city: profile.city ?? "",
            age: profile.age != null ? String(profile.age) : "",
            occupation: profile.occupation ?? "",
            bio: profile.bio ?? "",
          }}
        />
      </Section>

      {/* CONTATTI */}
      <Section
        emoji="📬"
        title="Contatti esterni"
        subtitle="Mostrati sul tuo profilo pubblico. Tutti opzionali."
      >
        <ContactsForm
          initial={{
            contact_email: profile.contact_email ?? "",
            contact_telegram: profile.contact_telegram ?? "",
            contact_linkedin: profile.contact_linkedin ?? "",
            contact_twitter: profile.contact_twitter ?? "",
            contact_instagram: profile.contact_instagram ?? "",
            contact_website: profile.contact_website ?? "",
          }}
        />
      </Section>

      {/* STARTUP & PROGETTI */}
      <Section
        emoji="💡"
        title="Startup & progetti"
        subtitle="Cosa stai costruendo (o hai costruito). Appariranno sul tuo profilo."
      >
        <div className="space-y-4">
          {projects && projects.length > 0 ? (
            projects.map((p) => (
              <ProjectCard key={p.id} project={p} isOwner />
            ))
          ) : (
            <p className="text-sm text-ink/50 italic">
              Nessun progetto ancora. Aggiungine uno qui sotto.
            </p>
          )}

          {/* Aggiungi nuovo — con AI helper */}
          <NewUserProjectForm />
        </div>
      </Section>

      {/* ACCOUNT */}
      <Section
        emoji="🔐"
        title="Account & sicurezza"
        subtitle="Email di accesso e password."
      >
        <form action={updateEmail} className="space-y-3">
          <Row label="Email di accesso">
            <input
              name="email"
              type="email"
              className="field"
              defaultValue={user.email ?? ""}
              required
            />
          </Row>
          <p className="text-xs text-ink/50">
            Cambiando email riceverai una mail di conferma al nuovo indirizzo.
          </p>
          <div>
            <button type="submit" className="btn-ghost !py-2 !px-4 !text-sm">
              Aggiorna email
            </button>
          </div>
        </form>

        <div className="h-px bg-ink/10 my-6" />

        <form action={updatePassword} className="space-y-3">
          <Row label="Nuova password" hint="Minimo 8 caratteri.">
            <input
              name="password"
              type="password"
              className="field"
              placeholder="••••••••"
              minLength={8}
              required
            />
          </Row>
          <div>
            <button type="submit" className="btn-ghost !py-2 !px-4 !text-sm">
              Cambia password
            </button>
          </div>
        </form>
      </Section>

      {/* DANGER ZONE */}
      <Section emoji="⚠️" title="Zona pericolosa">
        <p className="text-sm text-ink/60">
          Eliminare l&apos;account cancella in modo definitivo profilo,
          progetti, post e tutti i contenuti collegati. L&apos;operazione non
          può essere annullata. In caso di dubbi puoi scriverci a{" "}
          <a
            href="mailto:ciao@foundersclub.it"
            className="font-semibold gradient-text hover:underline"
          >
            ciao@foundersclub.it
          </a>
          .
        </p>
        <DeleteAccountButton email={user.email ?? ""} />
      </Section>
    </div>
  );
}

function Section({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-7 sm:p-9">
      <div className="flex items-start gap-3 mb-6">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(50,203,255,0.18), rgba(239,156,218,0.18))",
            border: "1px solid rgba(137,161,239,0.3)",
          }}
        >
          {emoji}
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-semibold text-2xl leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-ink/60 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-base">{icon}</span>}
        <span className="text-sm font-semibold text-ink/80">{label}</span>
      </div>
      {children}
      {hint && <p className="text-xs text-ink/50 mt-1.5">{hint}</p>}
    </label>
  );
}

