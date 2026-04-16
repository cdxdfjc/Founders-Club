"use client";

import { useMemo, useState } from "react";
import { sendInvite } from "@/lib/actions/invites";
import { SubmitButton } from "@/components/SubmitButton";

type Candidate = {
  id: string;
  username: string;
  full_name: string | null;
};

export function InviteTeamBox({
  projectId,
  candidates,
}: {
  projectId: string;
  candidates: Candidate[];
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [message, setMessage] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return candidates
      .filter((c) => {
        return (
          c.username.toLowerCase().includes(q) ||
          (c.full_name ?? "").toLowerCase().includes(q)
        );
      })
      .slice(0, 6);
  }, [query, candidates]);

  const reset = () => {
    setQuery("");
    setSelected(null);
    setMessage("");
  };

  return (
    <form
      action={async (fd) => {
        await sendInvite(fd);
        reset();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="invitee_id" value={selected?.id ?? ""} />

      {selected ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-ink/10 bg-white/70">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">
              {selected.full_name ?? selected.username}
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="text-xs text-ink/50 hover:text-plum transition shrink-0"
          >
            Cambia
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            className="field"
            placeholder="Cerca per nome o username…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          {matches.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 top-full mt-1 card p-1 max-h-72 overflow-y-auto shadow-lg">
              {matches.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(m);
                      setQuery("");
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-ink/5 transition"
                  >
                    <p className="font-semibold text-sm">
                      {m.full_name ?? m.username}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim() && matches.length === 0 && (
            <p className="mt-2 text-xs text-ink/50">
              Nessun utente trovato (o già membro/invitato).
            </p>
          )}
        </div>
      )}

      <textarea
        name="message"
        rows={3}
        className="field resize-y min-h-[80px]"
        placeholder="Messaggio (opzionale): ti va di entrare come dev?"
        maxLength={500}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-ink/40">{message.length} / 500</p>
        <SubmitButton
          className="btn-gradient !py-2.5 !px-5 !text-sm disabled:opacity-50"
          pendingLabel="Invio…"
          disabled={!selected}
        >
          ✉️ Manda invito
        </SubmitButton>
      </div>
    </form>
  );
}
