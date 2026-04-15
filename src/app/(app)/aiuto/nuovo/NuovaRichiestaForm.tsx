"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createHelpRequest } from "@/lib/actions/help";
import { assistHelpRequest } from "@/lib/actions/ai";
import { SubmitButton } from "@/components/SubmitButton";
import {
  HELP_CATEGORIES,
  HELP_URGENCIES,
  HELP_GRADIENT,
  type HelpCategory,
  type HelpUrgency,
} from "@/lib/help";

export function NuovaRichiestaForm() {
  const [rawText, setRawText] = useState("");
  const [aiPending, startAI] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<HelpCategory>("altro");
  const [urgency, setUrgency] = useState<HelpUrgency>("media");

  const runAssist = () => {
    setAiError(null);
    startAI(async () => {
      const res = await assistHelpRequest(rawText);
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setTitle(res.draft.title);
      setBody(res.draft.body);
      setCategory(res.draft.category);
      setUrgency(res.draft.urgency);
      setAiUsed(true);
    });
  };

  return (
    <>
      {/* AI ASSIST BLOCK */}
      <div
        className="card p-7 sm:p-8 mb-6 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,200,87,0.12), rgba(255,142,114,0.12), rgba(239,156,218,0.12))",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{ background: HELP_GRADIENT, color: "white" }}
          >
            ✨
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-xl leading-tight">
              Raccontami il problema
            </h2>
            <p className="text-sm text-ink/60 mt-0.5">
              Scrivi di getto cosa ti serve. L&apos;AI struttura tutto sotto,
              tu rivedi e pubblichi.
            </p>
          </div>
        </div>

        <textarea
          rows={5}
          className="field resize-y min-h-[120px]"
          placeholder="Es. sto cercando di integrare Stripe con Next.js ma i webhook non arrivano in locale, ho già provato con ngrok ma mi dà 404, forse è un problema di route app router vs pages…"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          maxLength={3000}
          disabled={aiPending}
        />

        {aiError && (
          <p className="mt-3 text-sm text-plum font-semibold">{aiError}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-ink/40">
            {rawText.length} / 3000 caratteri
          </p>
          <button
            type="button"
            onClick={runAssist}
            disabled={aiPending || rawText.trim().length < 20}
            className="btn-gradient !py-2.5 !px-5 !text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: HELP_GRADIENT }}
          >
            {aiPending ? "✨ Sto lavorando…" : "✨ Aiutami a scrivere"}
          </button>
        </div>

        {aiUsed && !aiPending && (
          <p className="mt-3 text-xs text-ink/50 italic">
            ✓ Campi popolati. Rivedi e correggi sotto prima di pubblicare.
          </p>
        )}
      </div>

      {/* FORM PRINCIPALE */}
      <form action={createHelpRequest} className="card p-7 sm:p-9 space-y-5">
        <Field label="Titolo" hint="Una domanda o richiesta chiara.">
          <input
            name="title"
            className="field"
            placeholder="Es. Come gestite i webhook Stripe in locale con Next 15?"
            required
            minLength={10}
            maxLength={140}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Categoria">
            <select
              name="category"
              className="field"
              value={category}
              onChange={(e) => setCategory(e.target.value as HelpCategory)}
            >
              {HELP_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Quanto è urgente?">
            <select
              name="urgency"
              className="field"
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as HelpUrgency)}
            >
              {HELP_URGENCIES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.emoji} {u.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field
          label="Descrizione"
          hint="Contesto, cosa hai provato, dove sei bloccato, cosa serve."
        >
          <textarea
            name="body"
            rows={8}
            className="field resize-y min-h-[180px]"
            placeholder="Sto provando a…"
            required
            minLength={20}
            maxLength={4000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between pt-2">
          <Link href="/aiuto" className="btn-ghost !py-2.5 !px-5 !text-sm">
            Annulla
          </Link>
          <SubmitButton
            className="btn-gradient"
            style={{ background: HELP_GRADIENT }}
            pendingLabel="Pubblico…"
          >
            🙋 Pubblica
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
