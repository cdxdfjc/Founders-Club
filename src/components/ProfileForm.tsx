"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/profile";

type Props = {
  username: string;
  initial: {
    full_name: string;
    city: string;
    age: string;
    occupation: string;
    bio: string;
  };
};

export function ProfileForm({ username, initial }: Props) {
  const [values, setValues] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty =
    values.full_name !== baseline.full_name ||
    values.city !== baseline.city ||
    values.age !== baseline.age ||
    values.occupation !== baseline.occupation ||
    values.bio !== baseline.bio;

  const set = (k: keyof typeof values) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || pending) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProfile(fd);
      setBaseline(values);
      setSavedAt(Date.now());
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">

      <Row label="Nome completo">
        <input
          name="full_name"
          className="field"
          value={values.full_name}
          onChange={set("full_name")}
          placeholder="Es. Marco Rossi"
          maxLength={80}
        />
      </Row>

      <Row label="Città">
        <input
          name="city"
          className="field"
          value={values.city}
          onChange={set("city")}
          placeholder="Milano, Bologna, Lecce…"
          maxLength={60}
        />
      </Row>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Row label="Età" hint="Opzionale">
          <input
            name="age"
            type="number"
            min={14}
            max={120}
            className="field"
            value={values.age}
            onChange={set("age")}
            placeholder="28"
          />
        </Row>
        <div className="sm:col-span-2">
          <Row
            label="Studio / Lavoro"
            hint="Una riga su cosa studi o di cosa ti occupi."
          >
            <input
              name="occupation"
              className="field"
              value={values.occupation}
              onChange={set("occupation")}
              placeholder="Es. Product designer @ Acme · Studio ingegneria @ Polimi"
              maxLength={120}
            />
          </Row>
        </div>
      </div>

      <Row label="Bio" hint="Cosa fai, cosa stai costruendo, cosa cerchi.">
        <textarea
          name="bio"
          rows={5}
          className="field resize-y min-h-[120px]"
          value={values.bio}
          onChange={set("bio")}
          placeholder="Founder di una micro-SaaS, vengo dal mondo design, sto cercando un co-founder tecnico…"
          maxLength={500}
        />
      </Row>

      <SaveRow dirty={dirty} pending={pending} savedAt={savedAt} />
    </form>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-sm font-semibold text-ink/80">{label}</span>
      </div>
      {children}
      {hint && <p className="text-xs text-ink/50 mt-1.5">{hint}</p>}
    </label>
  );
}

export function SaveRow({
  dirty,
  pending,
  savedAt,
  label = "Salva modifiche",
}: {
  dirty: boolean;
  pending: boolean;
  savedAt: number | null;
  label?: string;
}) {
  const showSaved = savedAt !== null && !dirty && !pending;
  return (
    <div className="pt-2 flex items-center gap-3">
      <button
        type="submit"
        disabled={!dirty || pending}
        className="btn-gradient !py-2.5 !px-6 !text-sm disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "Salvataggio…" : label}
      </button>
      {showSaved && (
        <span
          key={savedAt}
          className="text-sm font-semibold text-ink/70 animate-pulse"
        >
          ✓ Salvato
        </span>
      )}
      {!dirty && !showSaved && !pending && (
        <span className="text-xs text-ink/40">Nessuna modifica</span>
      )}
    </div>
  );
}
