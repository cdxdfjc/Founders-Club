"use client";

import { useState } from "react";

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

export function ProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[project.status ?? "in_corso"] ?? STATUS_META.in_corso;
  const years = formatYears(project.year_start, project.year_end);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      className="card p-5 text-left w-full transition hover:shadow-lg"
      aria-expanded={open}
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
              onClick={(e) => e.stopPropagation()}
              className="inline-block text-sm font-semibold gradient-text hover:underline break-all"
            >
              {project.url} ↗
            </a>
          )}
        </div>
      )}
    </button>
  );
}
