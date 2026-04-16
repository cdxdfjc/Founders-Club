"use client";

import { useState, useTransition } from "react";
import { toggleDockAlumni } from "@/lib/actions/profile";

type Props = { initialValue: boolean };

export function DockAlumniToggle({ initialValue }: Props) {
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        disabled={pending}
        onChange={() => {
          const next = !checked;
          setChecked(next);
          startTransition(async () => {
            await toggleDockAlumni(next);
          });
        }}
      />
      <span
        className="relative w-11 h-6 rounded-full transition-colors shrink-0"
        style={{
          background: checked
            ? "linear-gradient(135deg, #3B6BAA, #D4586A)"
            : "rgba(29,27,58,0.12)",
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
          style={{
            transform: checked ? "translateX(20px)" : "translateX(0)",
          }}
        />
      </span>
      <div>
        <span className="text-sm font-semibold text-ink/80">
          🚀 Dock Alumni
        </span>
        <p className="text-xs text-ink/50">
          Hai partecipato a Dock Startup Lab? Attiva il badge sul tuo profilo.
        </p>
      </div>
    </label>
  );
}
