import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent, joinEvent, leaveEvent } from "@/lib/actions/events";
import { SubmitButton } from "@/components/SubmitButton";

const EVENTS_GRADIENT =
  "linear-gradient(135deg, #00A5E0 0%, #32CBFF 50%, #89A1EF 100%)";

type Participant = {
  user_id: string;
  profile: { username: string; full_name: string | null } | null;
};

export default async function EventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ev } = await supabase
    .from("events")
    .select(
      `
      id, title, description, city, venue, starts_at, max_participants, created_at,
      organizer:profiles!events_organizer_id_fkey ( id, username, full_name )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (!ev) notFound();

  const organizer = ev.organizer as unknown as {
    id: string;
    username: string;
    full_name: string | null;
  } | null;

  const isOrganizer = organizer?.id === user.id;

  const { data: participantsRaw } = await supabase
    .from("event_participants")
    .select(
      `
      user_id,
      profile:profiles!event_participants_user_id_fkey ( username, full_name )
      `,
    )
    .eq("event_id", id)
    .order("joined_at", { ascending: true });

  const participants = (participantsRaw ?? []) as unknown as Participant[];
  const count = participants.length;
  const isJoined = participants.some((p) => p.user_id === user.id);
  const full =
    ev.max_participants !== null && count >= ev.max_participants;
  const isPast = new Date(ev.starts_at).getTime() < Date.now();

  const when = new Date(ev.starts_at);
  const dateStr = when.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = when.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article className="max-w-3xl mx-auto rise space-y-8">
      <div className="card p-5 sm:p-10 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse at 10% 0%, rgba(0,165,224,0.25), transparent 60%), radial-gradient(ellipse at 90% 100%, rgba(137,161,239,0.25), transparent 60%)",
          }}
        />
        <div className="relative">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white mb-4"
            style={{ background: EVENTS_GRADIENT }}
          >
            ☕ Meetup
          </span>
          {isPast && (
            <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-ink/10 text-ink/50">
              Passato
            </span>
          )}
          <h1 className="font-display-tight font-semibold text-2xl sm:text-4xl md:text-5xl leading-none tracking-tighter">
            {ev.title}
          </h1>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-ink/70">
              <span className="text-lg">📅</span>
              <span className="capitalize">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-ink/70">
              <span className="text-lg">🕐</span>
              <span>{timeStr}</span>
            </div>
            <div className="flex items-center gap-2 text-ink/70">
              <span className="text-lg">📍</span>
              <span>
                {ev.city} — {ev.venue}
              </span>
            </div>
            <div className="flex items-center gap-2 text-ink/70">
              <span className="text-lg">🫂</span>
              <span>
                {count} partecipant{count === 1 ? "e" : "i"}
                {ev.max_participants ? ` / ${ev.max_participants} posti` : ""}
              </span>
            </div>
          </div>

          {organizer && (
            <p className="mt-4 text-sm text-ink/60">
              Organizzato da{" "}
              <Link
                href={`/profilo/${organizer.username}`}
                className="font-semibold text-ink/80 hover:underline"
              >
                {organizer.full_name ?? organizer.username}
              </Link>
            </p>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-8 whitespace-pre-wrap text-ink/80 leading-relaxed">
        {ev.description}
      </div>

      {!isPast && (
        <div className="card p-4 sm:p-8">
          {isJoined ? (
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-semibold text-ink/70">
                ✅ Partecipi a questo meetup
              </span>
              {!isOrganizer && (
                <form action={leaveEvent}>
                  <input type="hidden" name="event_id" value={id} />
                  <SubmitButton
                    className="btn-ghost !py-2.5 !px-5 !text-sm"
                    pendingLabel="Annullo…"
                  >
                    Annulla partecipazione
                  </SubmitButton>
                </form>
              )}
            </div>
          ) : full ? (
            <p className="text-sm font-semibold text-ink/60">
              😔 Posti esauriti — non è possibile partecipare.
            </p>
          ) : (
            <form action={joinEvent}>
              <input type="hidden" name="event_id" value={id} />
              <SubmitButton
                className="btn-gradient !py-3 !px-6"
                style={{ background: EVENTS_GRADIENT }}
                pendingLabel="Mi unisco…"
              >
                ☕ Partecipo!
              </SubmitButton>
            </form>
          )}
        </div>
      )}

      {participants.length > 0 && (
        <section>
          <h2 className="font-display font-semibold text-2xl mb-4 flex items-center gap-2">
            <span>🫂</span> Chi partecipa ({count})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {participants.map((p) => {
              const name =
                p.profile?.full_name ?? p.profile?.username ?? "anonimo";
              const initial = name.charAt(0).toUpperCase();
              const uname = p.profile?.username ?? p.user_id;
              return (
                <Link
                  key={p.user_id}
                  href={`/profilo/${uname}`}
                  className="card p-4 flex items-center gap-3 hover:shadow-md transition"
                >
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
                    }}
                  >
                    {initial}
                  </span>
                  <span className="font-semibold truncate">{name}</span>
                  {organizer?.id === p.user_id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-ink/30">
                      ORG
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {isOrganizer && (
        <section className="pt-4 border-t border-ink/10">
          <form action={deleteEvent}>
            <input type="hidden" name="event_id" value={id} />
            <SubmitButton
              className="btn-ghost !text-red-500 !py-2.5 !px-5 !text-sm"
              pendingLabel="Elimino…"
            >
              🗑️ Elimina meetup
            </SubmitButton>
          </form>
        </section>
      )}
    </article>
  );
}
