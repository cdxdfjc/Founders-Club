"use client";

import { useState, useTransition } from "react";
import { updateProject, deleteProject } from "@/lib/actions/profile";

type Status = "in_corso" | "completato" | "chiuso";

type Project = {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  status: string | null;
  year_start: number | null;
  year_end: number | null;
  revenue_note: string | null;
};

const STATUS_META: Record<
  string,
  { emoji: string; label: string; color: string }
> = {
  in_corso: { emoji: "🟢", label: "In corso", color: "#32CBFF" },
  completato: { emoji: "✅", label: "Completato", color: "#89A1EF" },
  chiuso: { emoji: "🔴", label: "Chiuso", color: "#EF9CDA" },
};

function formatYears(start: number | null, end: number | null): string {
  if (!start && !end) return "—";
  if (start && !end) return `${start} → in corso`;
  if (!start && end) return `${end}`;
  if (start === end) return `${start}`;
  return `${start} – ${end}`;
}

export function ProjectCard({
  project,
  isOwner = false,
}: {
  project: Project;
  isOwner?: boolean;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");

  if (mode === "edit") {
    return (
      <EditForm
        project={project}
        onDone={() => setMode("view")}
      />
    );
  }

  return (
    <ViewCard
      project={project}
      isOwner={isOwner}
      onEdit={() => setMode("edit")}
    />
  );
}

function ViewCard({
  project,
  isOwner,
  onEdit,
}: {
  project: Project;
  isOwner: boolean;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deletePending, startDelete] = useTransition();

  const meta =
    STATUS_META[project.status ?? "in_corso"] ?? STATUS_META.in_corso;
  const years = formatYears(project.year_start, project.year_end);

  const handleDelete = () => {
    if (
      !window.confirm(
        `Eliminare "${project.name}"? Non si può tornare indietro.`,
      )
    )
      return;
    const fd = new FormData();
    fd.append("id", project.id);
    startDelete(async () => {
      await deleteProject(fd);
    });
  };

  return (
    <div
      className="card p-5 text-left w-full transition hover:shadow-lg"
      aria-expanded={open}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 text-xs font-semibold text-ink/60">
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
              <span>·</span>
              <span>{years}</span>
            </div>
            <h3 className="font-display font-semibold text-lg leading-tight">
              {project.name}
            </h3>
            {project.revenue_note && (
              <p className="mt-2 text-sm font-semibold text-ink/80">
                💰 {project.revenue_note}
              </p>
            )}
          </div>
          <span
            className="text-ink/40 text-sm shrink-0 mt-1 transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-ink/10 space-y-3">
          {project.description ? (
            <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-ink/40 italic">Nessuna descrizione.</p>
          )}
          {project.url && (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-semibold gradient-text hover:underline break-all"
            >
              {project.url} ↗
            </a>
          )}
          {isOwner && (
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onEdit}
                className="btn-ghost !py-1.5 !px-3 !text-xs"
              >
                ✏️ Modifica
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deletePending}
                className="text-xs font-semibold text-ink/50 hover:text-plum transition px-2 py-1.5 disabled:opacity-50"
              >
                {deletePending ? "Eliminazione…" : "🗑️ Elimina"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EditForm({
  project,
  onDone,
}: {
  project: Project;
  onDone: () => void;
}) {
  const initial = {
    name: project.name,
    description: project.description ?? "",
    url: project.url ?? "",
    status: (project.status as Status) ?? "in_corso",
    yearStart: project.year_start != null ? String(project.year_start) : "",
    yearEnd: project.year_end != null ? String(project.year_end) : "",
    revenueNote: project.revenue_note ?? "",
  };

  const [values, setValues] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirty =
    values.name !== initial.name ||
    values.description !== initial.description ||
    values.url !== initial.url ||
    values.status !== initial.status ||
    values.yearStart !== initial.yearStart ||
    values.yearEnd !== initial.yearEnd ||
    values.revenueNote !== initial.revenueNote;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty || pending || !values.name.trim()) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateProject(fd);
      setSavedAt(Date.now());
      onDone();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="card p-5 space-y-3"
      style={{
        borderColor: "rgba(137,161,239,0.5)",
        boxShadow: "0 0 0 2px rgba(137,161,239,0.12)",
      }}
    >
      <input type="hidden" name="id" value={project.id} />

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink/50">
          ✏️ Modifica progetto
        </span>
        <button
          type="button"
          onClick={onDone}
          className="text-xs font-semibold text-ink/50 hover:text-ink"
        >
          ✕ Chiudi
        </button>
      </div>

      <input
        name="name"
        className="field font-semibold"
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        placeholder="Nome del progetto"
        required
        maxLength={80}
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
          value={values.yearStart}
          onChange={(e) =>
            setValues((v) => ({ ...v, yearStart: e.target.value }))
          }
          placeholder="Anno inizio"
        />
        <input
          name="year_end"
          type="number"
          min={1970}
          max={2100}
          className="field"
          value={values.yearEnd}
          onChange={(e) =>
            setValues((v) => ({ ...v, yearEnd: e.target.value }))
          }
          placeholder="Anno fine"
        />
      </div>

      <input
        name="revenue_note"
        className="field"
        value={values.revenueNote}
        onChange={(e) =>
          setValues((v) => ({ ...v, revenueNote: e.target.value }))
        }
        placeholder="💰 Risultati: es. 2k MRR · 100 utenti · exit €50k"
        maxLength={120}
      />

      <textarea
        name="description"
        className="field resize-y min-h-[80px]"
        value={values.description}
        onChange={(e) =>
          setValues((v) => ({ ...v, description: e.target.value }))
        }
        placeholder="Una riga su cosa fa e a chi serve."
        rows={3}
        maxLength={300}
      />

      <input
        name="url"
        type="url"
        className="field"
        value={values.url}
        onChange={(e) => setValues((v) => ({ ...v, url: e.target.value }))}
        placeholder="https://…"
      />

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!dirty || pending}
          className="btn-gradient !py-2 !px-4 !text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {pending ? "Salvataggio…" : "Salva modifiche"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-sm font-semibold text-ink/50 hover:text-ink px-2 py-2"
        >
          Annulla
        </button>
        {savedAt !== null && !dirty && !pending && (
          <span className="text-sm font-semibold text-ink/70">✓ Salvato</span>
        )}
        {!dirty && savedAt === null && !pending && (
          <span className="text-xs text-ink/40 ml-auto">Nessuna modifica</span>
        )}
      </div>
    </form>
  );
}
