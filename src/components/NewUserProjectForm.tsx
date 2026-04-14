"use client";

import { useState, useTransition } from "react";
import { assistUserProject } from "@/lib/actions/ai";
import { addProject } from "@/lib/actions/profile";

export function NewUserProjectForm() {
  const [showAI, setShowAI] = useState(false);
  const [rawText, setRawText] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [revenueNote, setRevenueNote] = useState("");
  const [status, setStatus] = useState<"in_corso" | "completato" | "chiuso">(
    "in_corso",
  );

  const handleGenerate = () => {
    setAiError(null);
    startTransition(async () => {
      const res = await assistUserProject(rawText);
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setName(res.draft.name);
      setDescription(res.draft.description);
      setRevenueNote(res.draft.revenue_note);
      setStatus(res.draft.status);
    });
  };

  return (
    <form
      action={addProject}
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
        <button
          type="button"
          onClick={() => setShowAI((v) => !v)}
          className="text-xs font-semibold gradient-text hover:underline"
        >
          {showAI ? "Nascondi AI ↑" : "✨ Fatti aiutare dall'AI"}
        </button>
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
            Scrivi a ruota libera cos'è il tuo progetto, in che fase sta, cosa
            hai imparato, quanto ha guadagnato. L'AI ti trasforma il tutto in
            una card pronta.
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            className="field resize-y min-h-[90px]"
            placeholder="Es. Ho fatto un micro-saas che aiuta i freelance italiani a mandare fatture. L'ho lanciato a gennaio 2024, oggi fa circa 2k MRR. Sto valutando se continuarlo o chiuderlo."
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
              disabled={pending || rawText.trim().length < 15}
              className="btn-gradient !py-2 !px-4 !text-xs disabled:opacity-50"
            >
              {pending ? "Sto pensando…" : "✨ Genera"}
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
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          name="status"
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as "in_corso" | "completato" | "chiuso")
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
        />
        <input
          name="year_end"
          type="number"
          min={1970}
          max={2100}
          className="field"
          placeholder="Anno fine"
        />
      </div>

      <input
        name="revenue_note"
        className="field"
        placeholder="💰 Risultati (opzionale)"
        maxLength={120}
        value={revenueNote}
        onChange={(e) => setRevenueNote(e.target.value)}
      />

      <textarea
        name="description"
        className="field resize-y min-h-[70px]"
        placeholder="Descrizione breve (opzionale)"
        rows={3}
        maxLength={300}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        name="url"
        type="url"
        className="field"
        placeholder="URL (opzionale)"
      />

      <div className="pt-1">
        <button type="submit" className="btn-gradient !py-2.5 !px-5 !text-sm">
          Aggiungi progetto
        </button>
      </div>
    </form>
  );
}
