"use client";

import { useState, useTransition } from "react";
import { assistUserProject } from "@/lib/actions/ai";
import { addProject } from "@/lib/actions/profile";

type Status = "in_corso" | "completato" | "chiuso";

const EMPTY = {
  name: "",
  description: "",
  revenueNote: "",
  yearStart: "",
  yearEnd: "",
  url: "",
  status: "in_corso" as Status,
};

export function NewUserProjectForm() {
  const [open, setOpen] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [rawText, setRawText] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPending, startAI] = useTransition();
  const [savePending, startSave] = useTransition();

  const [values, setValues] = useState(EMPTY);

  const reset = () => {
    setValues(EMPTY);
    setRawText("");
    setAiError(null);
    setShowAI(false);
  };

  const close = () => {
    reset();
    setOpen(false);
  };

  const handleGenerate = () => {
    setAiError(null);
    startAI(async () => {
      const res = await assistUserProject(rawText);
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setValues((v) => ({
        ...v,
        name: res.draft.name,
        description: res.draft.description,
        revenueNote: res.draft.revenue_note,
        status: res.draft.status,
      }));
    });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (savePending || !values.name.trim()) return;
    const fd = new FormData(e.currentTarget);
    startSave(async () => {
      await addProject(fd);
      close();
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card !rounded-2xl p-5 w-full text-left hover:shadow-lg transition"
        style={{
          borderStyle: "dashed",
          borderColor: "rgba(137,161,239,0.4)",
        }}
      >
        <span className="flex items-center gap-2">
          <span className="text-xl">➕</span>
          <span className="font-display font-semibold text-sm text-ink/70">
            Aggiungi un nuovo progetto
          </span>
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="card !rounded-2xl p-5 space-y-3"
      style={{ borderStyle: "dashed", borderColor: "rgba(137,161,239,0.4)" }}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <span>➕</span>
          <span className="font-display font-semibold text-sm text-ink/70">
            Nuovo progetto
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAI((v) => !v)}
            className="text-xs font-semibold gradient-text hover:underline"
          >
            {showAI ? "Nascondi AI ↑" : "✨ Fatti aiutare dall'AI"}
          </button>
          <button
            type="button"
            onClick={close}
            className="text-xs font-semibold text-ink/50 hover:text-ink"
          >
            ✕ Chiudi
          </button>
        </div>
      </div>

      {showAI && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(50,203,255,0.08), rgba(239,156,218,0.08))",
            border: "1px solid rgba(137,161,239,0.3)",
          }}
        >
          <p className="text-xs text-ink/70 leading-relaxed">
            Scrivi a ruota libera cos&apos;è il tuo progetto, in che fase sta,
            cosa hai imparato, quanto ha guadagnato. L&apos;AI ti trasforma il
            tutto in una card pronta.
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            className="field resize-y min-h-[90px]"
            placeholder="Es. Ho fatto un micro-saas che aiuta i freelance italiani a mandare fatture. L'ho lanciato a gennaio 2024, oggi fa circa 2k MRR."
            maxLength={2000}
          />
          <div className="flex items-center justify-between gap-2">
            {aiError ? (
              <span className="text-xs text-plum font-semibold">{aiError}</span>
            ) : (
              <span className="text-xs text-ink/50">
                {rawText.length}/2000 caratteri
              </span>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={aiPending || rawText.trim().length < 15}
              className="btn-gradient !py-2 !px-4 !text-xs disabled:opacity-50"
            >
              {aiPending ? "Sto pensando…" : "✨ Genera"}
            </button>
          </div>
        </div>
      )}

      <input
        name="name"
        className="field"
        placeholder="Nome del progetto"
        required
        maxLength={80}
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          name="status"
          value={values.status}
          onChange={(e) =>
            setValues((v) => ({ ...v, status: e.target.value as Status }))
          }
          className="field"
        >
          <option value="in_corso">🟢 In corso</option>
          <option value="completato">✅ Completato</option>
          <option value="chiuso">🔴 Chiuso</option>
        </select>
        <input
          name="year_start"
          type="number"
          min={1970}
          max={2100}
          className="field"
          placeholder="Anno inizio"
          value={values.yearStart}
          onChange={(e) =>
            setValues((v) => ({ ...v, yearStart: e.target.value }))
          }
        />
        <input
          name="year_end"
          type="number"
          min={1970}
          max={2100}
          className="field"
          placeholder="Anno fine"
          value={values.yearEnd}
          onChange={(e) =>
            setValues((v) => ({ ...v, yearEnd: e.target.value }))
          }
        />
      </div>

      <input
        name="revenue_note"
        className="field"
        placeholder="💰 Risultati (opzionale)"
        maxLength={120}
        value={values.revenueNote}
        onChange={(e) =>
          setValues((v) => ({ ...v, revenueNote: e.target.value }))
        }
      />

      <textarea
        name="description"
        className="field resize-y min-h-[70px]"
        placeholder="Descrizione breve (opzionale)"
        rows={3}
        maxLength={300}
        value={values.description}
        onChange={(e) =>
          setValues((v) => ({ ...v, description: e.target.value }))
        }
      />

      <input
        name="url"
        type="url"
        className="field"
        placeholder="URL (opzionale)"
        value={values.url}
        onChange={(e) => setValues((v) => ({ ...v, url: e.target.value }))}
      />

      <div className="pt-1 flex items-center gap-3">
        <button
          type="submit"
          disabled={savePending || !values.name.trim()}
          className="btn-gradient !py-2.5 !px-5 !text-sm disabled:opacity-40"
        >
          {savePending ? "Salvataggio…" : "Aggiungi progetto"}
        </button>
        <button
          type="button"
          onClick={close}
          className="text-sm font-semibold text-ink/50 hover:text-ink"
        >
          Annulla
        </button>
      </div>
    </form>
  );
}
