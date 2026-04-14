"use client";

import { useState } from "react";
import { deleteMyAccount } from "@/lib/actions/profile";

export function DeleteAccountButton({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  const canDelete = confirm === username;

  if (!open) {
    return (
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-semibold text-plum hover:underline"
        >
          Voglio eliminare il mio account →
        </button>
      </div>
    );
  }

  return (
    <form action={deleteMyAccount} className="mt-5 space-y-3">
      <div
        className="rounded-2xl p-4 space-y-3"
        style={{
          background: "rgba(239,156,218,0.08)",
          border: "1px solid rgba(239,156,218,0.4)",
        }}
      >
        <p className="text-sm text-ink/80 leading-relaxed">
          Questa azione è <strong>irreversibile</strong>. Elimineremo il tuo
          profilo, i tuoi progetti, i tuoi post e qualsiasi altro contenuto
          legato al tuo account. Non potremo recuperarli.
        </p>
        <p className="text-sm text-ink/70">
          Per confermare, scrivi qui sotto il tuo username{" "}
          <span className="font-mono font-semibold">{username}</span>:
        </p>
        <input
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="field"
          placeholder={username}
          autoComplete="off"
        />
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={!canDelete}
            className="btn-ghost !py-2 !px-4 !text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={
              canDelete
                ? {
                    background: "#EF9CDA",
                    color: "white",
                    borderColor: "#EF9CDA",
                  }
                : undefined
            }
            onClick={(e) => {
              if (!window.confirm("Sei davvero sicuro? Non si torna indietro.")) {
                e.preventDefault();
              }
            }}
          >
            Elimina definitivamente
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirm("");
            }}
            className="text-sm font-semibold text-ink/50 hover:text-ink px-3 py-2"
          >
            Annulla
          </button>
        </div>
      </div>
    </form>
  );
}
