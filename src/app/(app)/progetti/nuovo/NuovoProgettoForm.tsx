"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createProject } from "@/lib/actions/projects";
import { assistProjectDraft } from "@/lib/actions/ai";
import { STAGES } from "@/lib/projects";
import { SubmitButton } from "@/components/SubmitButton";

type Category = { slug: string; name: string; emoji: string | null };

export function NuovoProgettoForm({ categories }: { categories: Category[] }) {
  const [rawIdea, setRawIdea] = useState("");
  const [aiPending, startAi] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);

  // Campi controllati così l'AI può popolarli
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState("");
  const [stage, setStage] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [url, setUrl] = useState("");

  function runAssist() {
    setAiError(null);
    startAi(async () => {
      const res = await assistProjectDraft(rawIdea);
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      const d = res.draft;
      setTitle(d.title);
      setTagline(d.tagline);
      setDescription(d.description);
      setCategory(d.category);
      setStage(d.stage);
      setTags(d.tags.join(", "));
      setAiUsed(true);
    });
  }

  return (
    <>
      {/* AI ASSIST BLOCK */}
      <div
        className="card p-7 sm:p-8 mb-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(50,203,255,0.10), rgba(239,156,218,0.10))",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{
              background:
                "linear-gradient(135deg, var(--sky-aqua), var(--wisteria), var(--plum))",
              color: "white",
            }}
          >
            ✨
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-xl leading-tight">
              Aiutami a compilare
            </h2>
            <p className="text-sm text-ink/60 mt-0.5">
              Incolla due righe sull'idea — anche dalle tue note. L'AI struttura
              tutto sotto, tu rivedi e pubblichi.
            </p>
          </div>
        </div>

        <textarea
          rows={5}
          className="field resize-y min-h-[120px]"
          placeholder="Es. sto pensando a una app per scambiare ripetizioni tra studenti universitari, l'idea è che ogni studente può sia chiedere che offrire, niente intermediari, target italia, cerco un tecnico react native…"
          value={rawIdea}
          onChange={(e) => setRawIdea(e.target.value)}
          maxLength={4000}
          disabled={aiPending}
        />

        {aiError && (
          <p className="mt-3 text-sm text-plum font-semibold">{aiError}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-ink/40">
            {rawIdea.length} / 4000 caratteri
          </p>
          <button
            type="button"
            onClick={runAssist}
            disabled={aiPending || rawIdea.trim().length < 20}
            className="btn-gradient !py-2.5 !px-5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiPending ? "✨ Sto lavorando…" : "✨ Compila per me"}
          </button>
        </div>

        {aiUsed && !aiPending && (
          <p className="mt-3 text-xs text-ink/50 italic">
            ✓ Campi popolati. Rivedi e correggi sotto prima di pubblicare.
          </p>
        )}
      </div>

      {/* FORM PRINCIPALE */}
      <form action={createProject} className="card p-7 sm:p-9 space-y-5">
        <Field label="Titolo" hint="Un nome corto e memorabile.">
          <input
            name="title"
            className="field"
            placeholder="Es. Skola — la app per ripetizioni private"
            required
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field
          label="Tagline"
          hint="Una riga che spiega cosa fa. Pensa a un sottotitolo."
        >
          <input
            name="tagline"
            className="field"
            placeholder="Trova il tuo prof perfetto in 2 minuti"
            maxLength={140}
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Categoria" hint="Scegli o scrivine una nuova.">
            <input
              name="category"
              list="categories"
              className="field"
              placeholder="SaaS, Marketplace, AI…"
              maxLength={40}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="categories">
              {categories.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.emoji ? `${c.emoji} ${c.name}` : c.name}
                </option>
              ))}
            </datalist>
          </Field>

          <Field label="Stage">
            <select
              name="stage"
              className="field"
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              <option value="">— Seleziona —</option>
              {STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.emoji} {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Descrizione"
          hint="Cosa fa, a chi serve, dove sei arrivato, cosa ti serve."
        >
          <textarea
            name="description"
            rows={8}
            className="field resize-y min-h-[180px]"
            placeholder="Stiamo costruendo una piattaforma per…"
            required
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <Field label="Tag" hint="Parole chiave separate da virgola. Max 8.">
          <input
            name="tags"
            className="field"
            placeholder="react, b2c, mobile, italia"
            maxLength={200}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </Field>

        <Field label="Sito o link (opzionale)">
          <input
            name="url"
            type="url"
            className="field"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between pt-2">
          <Link href="/progetti" className="btn-ghost !py-2.5 !px-5 !text-sm">
            Annulla
          </Link>
          <SubmitButton
            className="btn-gradient"
            pendingLabel="Pubblico…"
          >
            ✨ Pubblica
          </SubmitButton>
        </div>
      </form>
    </>
  );
}

function Field({
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
      <span className="text-sm font-semibold text-ink/80 mb-1.5 block">
        {label}
      </span>
      {children}
      {hint && <p className="text-xs text-ink/50 mt-1.5">{hint}</p>}
    </label>
  );
}
