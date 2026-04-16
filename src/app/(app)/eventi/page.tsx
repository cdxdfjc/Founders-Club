import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const EVENTS_GRADIENT =
  "linear-gradient(135deg, #00A5E0 0%, #32CBFF 50%, #89A1EF 100%)";

type Search = { city?: string };

type Row = {
  id: string;
  title: string;
  description: string;
  city: string;
  venue: string;
  starts_at: string;
  max_participants: number | null;
  organizer: { username: string; full_name: string | null } | null;
};

function formatWhen(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = d.toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

export default async function EventiPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { city } = await searchParams;
  const supabase = await createClient();

  const nowIso = new Date().toISOString();

  let query = supabase
    .from("events")
    .select(
      `
      id, title, description, city, venue, starts_at, max_participants,
      organizer:profiles!events_organizer_id_fkey ( username, full_name )
      `,
    )
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(80);

  if (city) query = query.eq("city", city);

  const { data } = await query;
  const list = (data ?? []) as unknown as Row[];

  // Conta partecipanti per evento
  const eventIds = list.map((e) => e.id);
  const countsByEvent = new Map<string, number>();
  if (eventIds.length > 0) {
    const { data: parts } = await supabase
      .from("event_participants")
      .select("event_id")
      .in("event_id", eventIds);
    for (const p of (parts as { event_id: string }[] | null) ?? []) {
      countsByEvent.set(p.event_id, (countsByEvent.get(p.event_id) ?? 0) + 1);
    }
  }

  // Città uniche per filtri
  const cities = Array.from(new Set(list.map((e) => e.city))).sort();

  return (
    <div className="rise space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white mb-3"
            style={{ background: EVENTS_GRADIENT }}
          >
            ☕ Meetup
          </span>
          <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
            Incontriamoci di <span className="gradient-text">persona</span>
          </h1>
          <p className="mt-3 text-ink/60 max-w-xl">
            Caffè, birre, cene, coworking. Scopri chi organizza qualcosa nella
            tua città — o crea tu il prossimo meetup.
          </p>
        </div>
        <Link
          href="/eventi/nuovo"
          className="btn-gradient !py-3 !px-5 self-start"
          style={{ background: EVENTS_GRADIENT }}
        >
          ➕ Organizza un meetup
        </Link>
      </header>

      {cities.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip href="/eventi" active={!city} label="Tutte le città" />
          {cities.map((c) => (
            <FilterChip
              key={c}
              href={`/eventi?city=${encodeURIComponent(c)}`}
              active={city === c}
              label={`📍 ${c}`}
            />
          ))}
        </div>
      )}

      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {list.map((e) => (
            <EventCard
              key={e.id}
              ev={e}
              count={countsByEvent.get(e.id) ?? 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function EventCard({ ev, count }: { ev: Row; count: number }) {
  const { date, time } = formatWhen(ev.starts_at);
  const name = ev.organizer?.full_name ?? ev.organizer?.username ?? "anonimo";
  const full =
    ev.max_participants !== null && count >= ev.max_participants;

  return (
    <Link
      href={`/eventi/${ev.id}`}
      className="card p-0 flex flex-col group overflow-hidden"
    >
      <div className="h-1.5 w-full" style={{ background: EVENTS_GRADIENT }} />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 w-16 rounded-2xl flex flex-col items-center justify-center py-2 text-white shadow-sm"
            style={{ background: EVENTS_GRADIENT }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
              {date.split(" ")[0]}
            </span>
            <span className="font-display-tight font-bold text-2xl leading-none mt-0.5">
              {date.split(" ")[1]}
            </span>
            <span className="text-[10px] font-semibold uppercase mt-0.5 opacity-90">
              {date.split(" ")[2]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-xl leading-tight tracking-tight group-hover:text-plum transition">
              {ev.title}
            </h3>
            <p className="mt-1 text-sm text-ink/60 truncate">
              📍 {ev.city} · {ev.venue}
            </p>
            <p className="mt-1 text-sm text-ink/60">🕐 {time}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-ink/60 leading-snug line-clamp-2">
          {ev.description}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between text-xs border-t border-ink/5">
          <span className="font-semibold text-ink/70 truncate pt-3">
            {name}
          </span>
          <div className="flex items-center gap-2 pt-3">
            <span className="text-ink/50">
              🫂 {count}
              {ev.max_participants ? `/${ev.max_participants}` : ""}
            </span>
            {full && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: "#EF6C6C" }}
              >
                PIENO
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="chip transition"
      style={
        active
          ? {
              background: EVENTS_GRADIENT,
              color: "white",
              borderColor: "transparent",
              fontWeight: 600,
            }
          : undefined
      }
    >
      {label}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-4">☕</div>
      <h3 className="font-display font-semibold text-2xl">
        Ancora nessun meetup
      </h3>
      <p className="mt-2 text-ink/60 max-w-md mx-auto">
        Nessuno ha ancora proposto un incontro. Prendi l&apos;iniziativa — anche
        due founder al bar sono un meetup.
      </p>
      <div className="mt-6">
        <Link
          href="/eventi/nuovo"
          className="btn-gradient !py-3 !px-6"
          style={{ background: EVENTS_GRADIENT }}
        >
          ➕ Organizza il primo
        </Link>
      </div>
    </div>
  );
}
