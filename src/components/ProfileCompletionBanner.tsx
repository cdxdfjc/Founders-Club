"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  completed: number;
  total: number;
  missingLabels: string[];
};

const DISMISS_KEY = "fc_profile_banner_dismissed_at";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // 3 giorni

export function ProfileCompletionBanner({
  completed,
  total,
  missingLabels,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem(DISMISS_KEY);
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!Number.isNaN(ts) && Date.now() - ts < SNOOZE_MS) {
        setDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_KEY);
      }
    }
  }, []);

  if (!mounted || dismissed) return null;

  const pct = Math.round((completed / total) * 100);

  return (
    <div
      className="rise card p-5 mb-8 flex items-center gap-4 flex-wrap"
      style={{
        background:
          "linear-gradient(135deg, rgba(239,156,218,0.12), rgba(137,161,239,0.12))",
        borderColor: "rgba(137,161,239,0.3)",
      }}
    >
      <div className="text-3xl shrink-0">✨</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display font-semibold text-base">
            Completa il tuo profilo
          </p>
          <span className="text-xs font-bold tabular-nums text-ink/50">
            {completed}/{total}
          </span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-ink/10 overflow-hidden max-w-xs">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(90deg, #32CBFF, #89A1EF, #EF9CDA)",
            }}
          />
        </div>
        {missingLabels.length > 0 && (
          <p className="mt-2 text-xs text-ink/55 truncate">
            Manca: {missingLabels.join(" · ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/impostazioni"
          className="btn-gradient !py-2 !px-4 !text-sm"
        >
          Completa →
        </Link>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, Date.now().toString());
            setDismissed(true);
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/70 transition text-ink/50"
          title="Ricordamelo tra qualche giorno"
          aria-label="Nascondi"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
