"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Profile = {
  username: string;
  full_name: string | null;
};

export function UserSearch({ currentUserId }: { currentUserId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("username, full_name")
        .neq("id", currentUserId)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      setResults((data as Profile[]) ?? []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, currentUserId]);

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Cerca per nome o username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="field"
        autoFocus
      />
      {loading && <p className="text-sm text-ink/40">Cerco...</p>}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((p) => {
            const initial = (p.full_name ?? p.username)
              .charAt(0)
              .toUpperCase();
            return (
              <Link
                key={p.username}
                href={`/messaggi/${p.username}`}
                className="card !rounded-2xl p-3 sm:p-4 flex items-center gap-3 hover:border-wisteria/40"
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
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {p.full_name ?? p.username}
                  </p>
                  <p className="text-xs text-ink/50">@{p.username}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {query.trim().length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-ink/40 text-center py-4">
          Nessun utente trovato
        </p>
      )}
    </div>
  );
}
