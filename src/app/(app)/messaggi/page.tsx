import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite, declineInvite } from "@/lib/actions/invites";
import {
  acceptUserProjectInvite,
  declineUserProjectInvite,
} from "@/lib/actions/user-project-invites";
import { SubmitButton } from "@/components/SubmitButton";
import { ConversationList } from "@/components/ConversationList";

type InviteRow = {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  project: { id: string; title: string; tagline: string | null } | null;
  inviter: { username: string; full_name: string | null } | null;
};

type PortfolioInviteRow = {
  id: string;
  message: string | null;
  status: string;
  created_at: string;
  user_project: {
    id: string;
    name: string;
    description: string | null;
  } | null;
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

  const { data: portfolioInvites } = await supabase
    .from("user_project_invites")
    .select(
      `
      id, message, status, created_at,
      user_project:user_projects ( id, name, description ),
      inviter:profiles!user_project_invites_inviter_id_fkey ( username, full_name )
      `,
    )
    .eq("invitee_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const portfolioList =
    (portfolioInvites as unknown as PortfolioInviteRow[] | null) ?? [];

  const hasInvites = list.length > 0 || portfolioList.length > 0;

  // Conversazioni per mobile view
  const { data: rawConvos } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, last_message_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false });

  const mobileConversations = await Promise.all(
    (
      rawConvos ?? []
    ).map(
      async (c: {
        id: string;
        user_a: string;
        user_b: string;
        last_message_at: string;
      }) => {
        const otherId = c.user_a === user.id ? c.user_b : c.user_a;
        const [{ data: profile }, { data: lastMsg }, { count: unreadCount }] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("username, full_name")
              .eq("id", otherId)
              .maybeSingle(),
            supabase
              .from("messages")
              .select("body")
              .eq("conversation_id", c.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("conversation_id", c.id)
              .eq("recipient_id", user.id)
              .is("read_at", null),
          ]);
        return {
          id: c.id,
          other_username: profile?.username ?? "utente",
          other_full_name: profile?.full_name ?? null,
          last_message_body: lastMsg?.body ?? null,
          last_message_at: c.last_message_at,
          unread_count: unreadCount ?? 0,
        };
      },
    ),
  );

  return (
    <div className="space-y-6">
      {/* Mobile: pulsante nuovo messaggio + lista conversazioni */}
      <div className="sm:hidden space-y-3">
        <Link
          href="/messaggi/nuovo"
          className="btn-gradient !py-2.5 !px-4 !text-sm w-full text-center"
        >
          + Nuovo messaggio
        </Link>
        {mobileConversations.length > 0 ? (
          <ConversationList
            initialConversations={mobileConversations}
            currentUserId={user.id}
          />
        ) : (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-ink/60 text-sm">
              Nessuna conversazione ancora. Scrivi a qualcuno!
            </p>
          </div>
        )}
      </div>

      {/* Desktop: stato vuoto quando nessuna chat è selezionata */}
      <div className="hidden sm:block">
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3">💬</div>
          <h3 className="font-display font-semibold text-xl">
            Seleziona una conversazione
          </h3>
          <p className="mt-2 text-sm text-ink/60 max-w-sm mx-auto">
            Scegli una conversazione dalla lista o iniziane una nuova.
          </p>
        </div>
      </div>

      {/* Inviti */}
      {hasInvites && (
        <>
          {list.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                  <span>📬</span> Inviti ai progetti
                </h2>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{
                    background: "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                  }}
                >
                  {list.length}
                </span>
              </div>
              <div className="space-y-3">
                {list.map((inv) => {
                  const inviterName =
                    inv.inviter?.full_name ??
                    inv.inviter?.username ??
                    "qualcuno";
                  return (
                    <div key={inv.id} className="card p-4 sm:p-5">
                      <p className="text-sm text-ink/60">
                        <strong className="text-ink/80">{inviterName}</strong> ti
                        ha invitato in{" "}
                        {inv.project ? (
                          <Link
                            href={`/progetti/${inv.project.id}`}
                            className="font-semibold hover:underline"
                          >
                            {inv.project.title}
                          </Link>
                        ) : (
                          <span className="text-ink/40">
                            (progetto eliminato)
                          </span>
                        )}
                      </p>
                      {inv.message && (
                        <blockquote className="mt-2 text-sm text-ink/70 italic border-l-2 border-ink/15 pl-3">
                          &ldquo;{inv.message}&rdquo;
                        </blockquote>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <form action={acceptInvite}>
                          <input
                            type="hidden"
                            name="invite_id"
                            value={inv.id}
                          />
                          <SubmitButton
                            className="btn-gradient !py-2 !px-4 !text-xs"
                            pendingLabel="..."
                          >
                            Accetta
                          </SubmitButton>
                        </form>
                        <form action={declineInvite}>
                          <input
                            type="hidden"
                            name="invite_id"
                            value={inv.id}
                          />
                          <SubmitButton
                            className="btn-ghost !py-2 !px-4 !text-xs"
                            pendingLabel="..."
                          >
                            Rifiuta
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {portfolioList.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                  <span>🚀</span> Inviti al portfolio
                </h2>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{
                    background: "linear-gradient(135deg, #32CBFF, #89A1EF)",
                  }}
                >
                  {portfolioList.length}
                </span>
              </div>
              <div className="space-y-3">
                {portfolioList.map((inv) => {
                  const inviterName =
                    inv.inviter?.full_name ??
                    inv.inviter?.username ??
                    "qualcuno";
                  return (
                    <div key={inv.id} className="card p-4 sm:p-5">
                      <p className="text-sm text-ink/60">
                        <strong className="text-ink/80">{inviterName}</strong> ti
                        ha invitato a collaborare su{" "}
                        <span className="font-semibold">
                          {inv.user_project?.name ?? "(progetto eliminato)"}
                        </span>
                      </p>
                      {inv.message && (
                        <blockquote className="mt-2 text-sm text-ink/70 italic border-l-2 border-ink/15 pl-3">
                          &ldquo;{inv.message}&rdquo;
                        </blockquote>
                      )}
                      <div className="mt-3 flex items-center gap-2">
                        <form action={acceptUserProjectInvite}>
                          <input
                            type="hidden"
                            name="invite_id"
                            value={inv.id}
                          />
                          <SubmitButton
                            className="btn-gradient !py-2 !px-4 !text-xs"
                            pendingLabel="..."
                          >
                            Accetta
                          </SubmitButton>
                        </form>
                        <form action={declineUserProjectInvite}>
                          <input
                            type="hidden"
                            name="invite_id"
                            value={inv.id}
                          />
                          <SubmitButton
                            className="btn-ghost !py-2 !px-4 !text-xs"
                            pendingLabel="..."
                          >
                            Rifiuta
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
