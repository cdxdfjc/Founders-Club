import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite, declineInvite } from "@/lib/actions/invites";
import { SubmitButton } from "@/components/SubmitButton";

type InviteRow = {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  project: { id: string; title: string; tagline: string | null } | null;
  inviter: { username: string; full_name: string | null } | null;
};

export default async function MessaggiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: invites } = await supabase
    .from("project_invites")
    .select(
      `
      id, message, status, created_at,
      project:projects ( id, title, tagline ),
      inviter:profiles!project_invites_inviter_id_fkey ( username, full_name )
      `,
    )
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const list = (invites as unknown as InviteRow[] | null) ?? [];

  return (
    <div className="rise max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
          La tua <span className="gradient-text">inbox</span>
        </h1>
        <p className="mt-3 text-ink/60">
          Inviti ai progetti e (presto) messaggi privati. Tutto in un posto.
        </p>
      </header>

      {/* SEZIONE INVITI */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display font-semibold text-2xl flex items-center gap-2">
            <span>📬</span> Inviti ai progetti
          </h2>
          {list.length > 0 && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, #EF9CDA, #89A1EF)",
              }}
            >
              {list.length}
            </span>
          )}
        </div>

        {list.length === 0 ? (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-ink/60">
              Nessun invito pendente. Quando qualcuno ti chiamerà a bordo del
              suo progetto lo vedrai qui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((inv) => {
              const inviterName =
                inv.inviter?.full_name ?? inv.inviter?.username ?? "qualcuno";
              return (
                <div key={inv.id} className="card p-6">
                  <div className="min-w-0">
                    <p className="text-sm text-ink/60">
                      <strong className="text-ink/80">{inviterName}</strong>{" "}
                      ti ha invitato a entrare in
                    </p>
                    {inv.project ? (
                      <Link
                        href={`/progetti/${inv.project.id}`}
                        className="mt-1 block font-display font-semibold text-2xl leading-tight hover:underline"
                      >
                        💡 {inv.project.title}
                      </Link>
                    ) : (
                      <p className="mt-1 font-display font-semibold text-2xl text-ink/40">
                        (progetto eliminato)
                      </p>
                    )}
                    {inv.project?.tagline && (
                      <p className="mt-1 text-sm text-ink/60">
                        {inv.project.tagline}
                      </p>
                    )}
                    {inv.message && (
                      <blockquote className="mt-3 text-sm text-ink/70 italic border-l-2 border-ink/15 pl-3">
                        &ldquo;{inv.message}&rdquo;
                      </blockquote>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <form action={acceptInvite}>
                      <input type="hidden" name="invite_id" value={inv.id} />
                      <SubmitButton
                        className="btn-gradient !py-2.5 !px-5 !text-sm"
                        pendingLabel="Entro…"
                      >
                        ✓ Accetta
                      </SubmitButton>
                    </form>
                    <form action={declineInvite}>
                      <input type="hidden" name="invite_id" value={inv.id} />
                      <SubmitButton
                        className="btn-ghost !py-2.5 !px-5 !text-sm"
                        pendingLabel="…"
                      >
                        Rifiuta
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SEZIONE MESSAGGI (placeholder) */}
      <section>
        <h2 className="font-display font-semibold text-2xl mb-4 flex items-center gap-2">
          <span>✉️</span> Messaggi privati
        </h2>
        <div className="card p-8 text-center opacity-70">
          <div className="text-4xl mb-2">🚧</div>
          <p className="font-semibold">Presto disponibili</p>
          <p className="text-sm text-ink/60 mt-1 max-w-md mx-auto">
            Chat 1-a-1 con mentor e altri founder. Stiamo lavorando per
            aprirla al più presto.
          </p>
        </div>
      </section>
    </div>
  );
}
