"use client";

import Link from "next/link";

export default function MessaggiError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-3">😵</div>
      <h3 className="font-display font-semibold text-xl">
        Qualcosa è andato storto
      </h3>
      <p className="mt-2 text-sm text-ink/60 max-w-sm mx-auto">
        {error.message || "Errore nel caricamento dei messaggi."}
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-ink/30 font-mono">{error.digest}</p>
      )}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button onClick={reset} className="btn-gradient !py-2.5 !px-5 !text-sm">
          Riprova
        </button>
        <Link href="/feed" className="btn-ghost !py-2.5 !px-5 !text-sm">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
