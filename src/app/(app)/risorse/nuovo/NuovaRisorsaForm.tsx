"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { createResource, previewUrl } from "@/lib/actions/resources";
import { assistResource } from "@/lib/actions/ai";
import { RESOURCES_GRADIENT } from "@/lib/resources";
import type { OgPreview } from "@/lib/og";

type CategoryOption = {
  slug: string;
  name: string;
  emoji: string | null;
};

export function NuovaRisorsaForm({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");
  const [og, setOg] = useState<OgPreview | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const [ogPending, startOg] = useTransition();
  const [aiPending, startAi] = useTransition();
  const [ogError, setOgError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(false);

  const runPreview = () => {
    setOgError(null);
    if (!url.trim()) return;
    startOg(async () => {
      const res = await previewUrl(url.trim());
      if (!res.ok) {
        setOg(null);
        setOgError(res.error);
        return;
      }
      setOg(res.preview);
    });
  };

  const runAssist = () => {
    setAiError(null);
    startAi(async () => {
      const res = await assistResource({
        userNote: note,
        og: og
          ? {
              title: og.title,
              description: og.description,
              siteName: og.siteName,
              url: og.url,
            }
          : null,
      });
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setTitle(res.draft.title);
      setDescription(res.draft.description);
      setCategory(res.draft.category);
      setAiUsed(true);
    });
  };

  const canAssist = (note.trim().length >= 5 || og !== null) && !aiPending;

  return (
    <>
      {/* STEP 1: LINK (opzionale) */}
      <div
        className="card p-7 sm:p-8 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, rgba(50,203,255,0.08), rgba(107,142,234,0.08), rgba(137,161,239,0.08))",
        }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 text-white"
            style={{ background: RESOURCES_GRADIENT }}
          >
            🔗
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-semibold text-xl leading-tight">
              Hai un link? (opzionale)
            </h2>
            <p className="text-sm text-ink/60 mt-0.5">
              Incollalo qui e leggo titolo, descrizione e immagine del sito.
              Oppure lascialo vuoto se è solo un consiglio testuale.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            className="field flex-1"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            maxLength={600}
          />
          <button
            type="button"
            onClick={runPreview}
            disabled={ogPending || !url.trim()}
            className="!py-2.5 !px-5 !text-sm rounded-full text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            style={{ background: RESOURCES_GRADIENT }}
          >
            {ogPending ? "Leggo…" : "Leggi link"}
          </button>
        </div>

        {ogError && (
          <p className="mt-3 text-sm text-plum font-semibold">{ogError}</p>
        )}

        {og && (
          <div className="mt-4 rounded-2xl border border-ink/10 bg-white/70 overflow-hidden">
            {og.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={og.image}
                alt=""
                className="w-full aspect-[16/9] object-cover"
              />
            )}
            <div className="p-4">
              {og.siteName && (
                <p className="text-xs text-ink/50">{og.siteName}</p>
              )}
              {og.title && (
                <p className="font-semibold mt-0.5">{og.title}</p>
              )}
              {og.description && (
                <p className="text-sm text-ink/60 mt-1 line-clamp-2">
                  {og.description}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-5 pt-5 border-t border-ink/5">
          <label className="block">
            <span className="text-sm font-semibold text-ink/80 mb-1.5 block">
              Nota personale (opzionale)
            </span>
            <textarea
              rows={3}
              className="field resize-y min-h-[80px]"
              placeholder="Es. lo uso tutti i giorni per disegnare mockup, è gratis fino a 3 progetti…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={2000}
            />
            <p className="text-xs text-ink/50 mt-1.5">
              Quello che vuoi dire agli altri founder. L&apos;AI la preserva.
            </p>
          </label>

          {aiError && (
            <p className="mt-3 text-sm text-plum font-semibold">{aiError}</p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-xs text-ink/40">{note.length} / 2000</p>
            <button
              type="button"
              onClick={runAssist}
              disabled={!canAssist}
              className="!py-2.5 !px-5 !text-sm rounded-full text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: RESOURCES_GRADIENT }}
            >
              {aiPending ? "✨ Sto lavorando…" : "✨ Aiutami a scrivere"}
            </button>
          </div>

          {aiUsed && !aiPending && (
            <p className="mt-3 text-xs text-ink/50 italic">
              ✓ Campi popolati. Rivedi sotto prima di pubblicare.
            </p>
          )}
        </div>
      </div>

      {/* FORM PRINCIPALE */}
      <form action={createResource} className="card p-7 sm:p-9 space-y-5">
        {/* hidden OG fields */}
        <input type="hidden" name="url" value={og?.url ?? url.trim()} />
        <input type="hidden" name="image_url" value={og?.image ?? ""} />
        <input type="hidden" name="site_name" value={og?.siteName ?? ""} />

        <Field label="Titolo" hint="Nome chiaro della risorsa.">
          <input
            name="title"
            className="field"
            placeholder="Es. Figma — design collaborativo"
            required
            minLength={5}
            maxLength={120}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>

        <Field label="Categoria" hint="Scegline una o scrivine una nuova.">
          <input
            name="category"
            className="field"
            list="resource-categories"
            placeholder="Es. Tool, Guide, Dev…"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={40}
          />
          <datalist id="resource-categories">
            {categories.map((c) => (
              <option key={c.slug} value={c.name}>
                {c.emoji ?? ""} {c.name}
              </option>
            ))}
          </datalist>
        </Field>

        <Field
          label="Descrizione"
          hint="Cosa è, a chi serve, perché vale la pena."
        >
          <textarea
            name="description"
            rows={6}
            className="field resize-y min-h-[140px]"
            placeholder="Es. tool di design collaborativo in browser, gratis fino a 3 progetti, ottimo per mockup veloci…"
            required
            minLength={10}
            maxLength={1200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between pt-2">
          <Link href="/risorse" className="btn-ghost !py-2.5 !px-5 !text-sm">
            Annulla
          </Link>
          <button
            type="submit"
            className="!py-3 !px-6 rounded-full text-white font-semibold shadow-sm hover:shadow-md transition"
            style={{ background: RESOURCES_GRADIENT }}
          >
            📚 Pubblica
          </button>
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
