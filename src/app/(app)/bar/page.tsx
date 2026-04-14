import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ThreadRow = {
  id: string;
  title: string;
  body: string;
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
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}

export default async function BarPage() {
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from("bar_threads")
    .select(
      `
      id, title, body, created_at, last_activity_at, reply_count,
      author:profiles!bar_threads_author_id_fkey ( username, full_name )
      `,
    )
    .order("last_activity_at", { ascending: false })
    .limit(80);

  const list = (threads ?? []) as unknown as ThreadRow[];

  return (
    <div className="rise space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="chip mb-3">
            <span>🍺</span>
            <span className="font-semibold">Bar</span>
          </div>
          <h1 className="font-display-tight font-semibold text-5xl sm:text-6xl leading-none tracking-tighter">
            Chiacchiere <span className="gradient-text">al bancone</span>
          </h1>
          <p className="mt-3 text-ink/60 max-w-xl">
            Discussioni aperte, opinioni, link, sfoghi. Quello che condivideresti
            con un altro founder davanti a una birra.
          </p>
        </div>
        <Link href="/bar/nuovo" className="btn-gradient !py-3 !px-5 self-start">
          🍺 Apri un thread
        </Link>
      </header>

      {list.length > 0 ? (
        <div className="space-y-3">
          {list.map((t) => {
            const name = t.author?.full_name ?? t.author?.username ?? "anonimo";
            const initial = name.charAt(0).toUpperCase();
            return (
              <Link
                key={t.id}
                href={`/bar/${t.id}`}
                className="card p-5 flex items-start gap-4 group"
              >
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
                  }}
                >
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-semibold text-lg leading-tight tracking-tight group-hover:text-plum transition">
                    {t.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink/60 line-clamp-2">
                    {t.body}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-ink/50">
                    <span className="font-semibold">{name}</span>
                    <span>•</span>
                    <span>{timeAgo(t.created_at)} fa</span>
                    <span>•</span>
                    <span>💬 {t.reply_count}</span>
                    {t.reply_count > 0 && (
                      <>
                        <span>•</span>
                        <span>ultima {timeAgo(t.last_activity_at)} fa</span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🍺</div>
          <h3 className="font-display font-semibold text-2xl">
            Il bar è ancora vuoto
          </h3>
          <p className="mt-2 text-ink/60 max-w-md mx-auto">
            Rompi il ghiaccio: apri il primo thread e lancia una discussione.
          </p>
          <div className="mt-6">
            <Link href="/bar/nuovo" className="btn-gradient !py-3 !px-6">
              🍺 Apri il primo thread
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
