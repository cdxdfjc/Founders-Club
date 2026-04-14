"use client";

import { useState, useTransition } from "react";
import { updateContacts } from "@/lib/actions/profile";
import { SaveRow } from "@/components/ProfileForm";

type Values = {
  contact_email: string;
  contact_telegram: string;
  contact_linkedin: string;
  contact_twitter: string;
  contact_instagram: string;
  contact_website: string;
};

export function ContactsForm({ initial }: { initial: Values }) {
  const [values, setValues] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty = (Object.keys(values) as (keyof Values)[]).some(
    (k) => values[k] !== baseline[k],
  );

  const set =
    (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || pending) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateContacts(fd);
      setBaseline(values);
      setSavedAt(Date.now());
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Email pubblica"
        icon="✉️"
        name="contact_email"
        type="email"
        value={values.contact_email}
        onChange={set("contact_email")}
        placeholder="marco@esempio.it"
      />
      <Field
        label="Telegram"
        icon="💬"
        name="contact_telegram"
        value={values.contact_telegram}
        onChange={set("contact_telegram")}
        placeholder="@username (senza https)"
      />
      <Field
        label="LinkedIn"
        icon="💼"
        name="contact_linkedin"
        type="url"
        value={values.contact_linkedin}
        onChange={set("contact_linkedin")}
        placeholder="https://linkedin.com/in/…"
      />
      <Field
        label="X / Twitter"
        icon="𝕏"
        name="contact_twitter"
        value={values.contact_twitter}
        onChange={set("contact_twitter")}
        placeholder="@username"
      />
      <Field
        label="Instagram"
        icon="📸"
        name="contact_instagram"
        value={values.contact_instagram}
        onChange={set("contact_instagram")}
        placeholder="@username"
      />
      <Field
        label="Sito web"
        icon="🌐"
        name="contact_website"
        type="url"
        value={values.contact_website}
        onChange={set("contact_website")}
        placeholder="https://…"
      />

      <SaveRow dirty={dirty} pending={pending} savedAt={savedAt} />
    </form>
  );
}

function Field({
  label,
  icon,
  ...inputProps
}: {
  label: string;
  icon: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-sm font-semibold text-ink/80">{label}</span>
      </div>
      <input className="field" {...inputProps} />
    </label>
  );
}
