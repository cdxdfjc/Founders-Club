"use client";

import { useMemo, useState } from "react";

type Candidate = {
  id: string;
  username: string;
  full_name: string | null;
};

export function TeamPicker({
  candidates,
  selected,
  onChange,
}: {
  candidates: Candidate[];
  selected: Candidate[];
  onChange: (members: Candidate[]) => void;
}) {
  const [query, setQuery] = useState("");

  const selectedIds = new Set(selected.map((s) => s.id));

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter(
        (c) =>
          !selectedIds.has(c.id) &&
          (c.username.toLowerCase().includes(q) ||
            (c.full_name ?? "").toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, candidates, selectedIds]);

  const add = (c: Candidate) => {
    onChange([...selected, c]);
    setQuery("");
  };

  const remove = (id: string) => {
    onChange(selected.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm font-semibold text-ink/80">
          Team
        </span>
        <span className="text-xs text-ink/40">(opzionale)</span>
      </div>

      {/* Membri selezionati */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-ink/5 border border-ink/10"
            >
              {m.full_name ?? m.username}
              <button
                type="button"
                onClick={() => remove(m.id)}
                className="text-ink/40 hover:text-ink transition ml-0.5"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Ricerca */}
      <div className="relative">
        <input
          type="text"
          className="field"
          placeholder="Cerca persone da invitare..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {matches.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 top-full mt-1 card p-1 max-h-52 overflow-y-auto shadow-lg">
            {matches.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => add(m)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-ink/5 transition"
                >
                  <p className="font-semibold text-sm">
                    {m.full_name ?? m.username}
                  </p>
                  <p className="text-xs text-ink/50">@{m.username}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && matches.length === 0 && (
          <p className="mt-1 text-xs text-ink/50">Nessun utente trovato.</p>
        )}
      </div>

      {/* Hidden inputs per il form */}
      {selected.map((m) => (
        <input key={m.id} type="hidden" name="invitee_ids" value={m.id} />
      ))}
    </div>
  );
}
