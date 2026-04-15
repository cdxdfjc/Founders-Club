import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  HELP_CATEGORIES,
  HELP_GRADIENT,
  categoryMeta,
  urgencyMeta,
} from "@/lib/help";

type Search = { cat?: string; status?: string };

type Row = {
  id: string;
  title: string;
  body: string;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
  last_activity_at: string;
  reply_count: number;
  author: { username: string; full_name: string | null } | null;
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}g`;
  return `${Math.floor(d / 30)}mo`;
}

export default async function AiutoPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { cat, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("help_requests")
    .select(
      `
      id, title, body, category, urgency, status, created_at, last_activity_at, reply_count,
      author:profiles!help_requests_author_id_fkey ( username, full_name )
      `,
    )
    .order("status", { ascending: true })
    .order("last_activity_at", { ascending: false })
    .limit(80);

  if (cat) query = query.eq("category", cat);
  if (status === "aperta" || status === "risolta")
    query = query.eq("status", status);

  const { data } = await query;
  const list = (data ?? []) as unknown as Row[];

  return (
    <div className="rise space-y-8">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white mb-3"
            style={{ background: HELP_GRADIENT }}
          >
            🙋 Aiuto
          </span>
          <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
            Chiedi una <span className="gradient-text">mano</span>
          </h1>
          <p className="mt-3 text-ink/60 max-w-xl">
            Sei bloccato? Hai un dubbio tecnico, legale, di prodotto? Qui trovi
            founder che ci sono passati prima di te.
          </p>
        </div>
        <Link
          href="/aiuto/nuovo"
          className="btn-gradient !py-3 !px-5 self-start"
          style={{ background: HELP_GRADIENT }}
        >
          🙋 Chiedi aiuto
        </Link>
      </header>

      {/* FILTRI */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          href="/aiuto"
          active={!cat && !status}
          label="Tutte"
        />
        <FilterChip
          href="/aiuto?status=aperta"
          active={status === "aperta"}
          label="🙋 Aperte"
        />
        <FilterChip
          href="/aiuto?status=risolta"
          active={status === "risolta"}
          label="✅ Risolte"
        />
        <span className="w-px h-6 bg-ink/10 mx-1" />
        {HELP_CATEGORIES.map((c) => (
          <FilterChip
            key={c.value}
            href={`/aiuto?cat=${c.value}`}
            active={cat === c.value}
            label={`${c.emoji} ${c.label}`}
          />
        ))}
      </div>

      {/* LISTA */}
      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {list.map((r) => (
            <HelpCard key={r.id} r={r} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function HelpCard({ r }: { r: Row }) {
  const cat = categoryMeta(r.category);
  const urg = urgencyMeta(r.urgency);
  const name = r.author?.full_name ?? r.author?.username ?? "anonimo";
  const solved = r.status === "risolta";

  return (
    <Link
      href={`/aiuto/${r.id}`}
      className="card p-0 flex flex-col group overflow-hidden relative"
      style={{
        opacity: solved ? 0.72 : 1,
      }}
    >
      {/* Striscia superiore gradient caldo */}
      <div
        className="h-1.5 w-full"
        style={{ background: HELP_GRADIENT }}
      />

      <div className="p-6 flex flex-col flex-1">
        {/* Top row: categoria + urgenza/stato */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className="chip"
            style={{
              background: "rgba(255,200,87,0.14)",
              borderColor: "rgba(255,142,114,0.35)",
            }}
          >
            <span>{cat.emoji}</span>
            <span className="font-semibold">{cat.label}</span>
          </span>
          {solved ? (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
              style={{ background: "#7BC47F" }}
            >
              ✅ Risolta
            </span>
          ) : (
            <span className="text-xs font-semibold text-ink/60 flex items-center gap-1">
              <span>{urg.emoji}</span>
              <span>{urg.label}</span>
            </span>
          )}
        </div>

        {/* Titolo + body preview */}
        <div className="flex items-start gap-2">
          <span className="text-xl shrink-0 mt-0.5">🙋</span>
          <h3 className="font-display font-semibold text-xl leading-tight tracking-tight group-hover:text-plum transition">
            {r.title}
          </h3>
        </div>
        <p className="mt-2 text-sm text-ink/60 leading-snug line-clamp-2 pl-7">
          {r.body}
        </p>

        <div className="mt-auto pt-5 flex items-center justify-between text-xs border-t border-ink/5 mt-4">
          <span className="font-semibold text-ink/70 truncate pt-3">
            {name}
          </span>
          <div className="flex items-center gap-3 text-ink/50 pt-3">
            <span>💬 {r.reply_count}</span>
            <span>{timeAgo(r.last_activity_at)} fa</span>
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
              background: HELP_GRADIENT,
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
      <div className="text-5xl mb-4">🙋</div>
      <h3 className="font-display font-semibold text-2xl">
        Nessuna richiesta ancora
      </h3>
      <p className="mt-2 text-ink/60 max-w-md mx-auto">
        Sii il primo a chiedere aiuto. Non c&apos;è domanda troppo semplice o
        troppo complessa qui.
      </p>
      <div className="mt-6">
        <Link
          href="/aiuto/nuovo"
          className="btn-gradient !py-3 !px-6"
          style={{ background: HELP_GRADIENT }}
        >
          🙋 Chiedi una mano per primo
        </Link>
      </div>
    </div>
  );
}
