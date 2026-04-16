"use client";

import { useEffect, useState } from "react";

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

type OgData = {
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
};

function isAppStoreUrl(url: string): boolean {
  return /apps\.apple\.com|play\.google\.com/.test(url);
}

function formatYears(start: number | null, end: number | null): string {
  if (!start && !end) return "";
  if (start && !end) return `${start} → oggi`;
  if (!start && end) return `${end}`;
  if (start === end) return `${start}`;
  return `${start} – ${end}`;
}

export function ProjectPreviewCard({ project }: { project: Project }) {
  const [og, setOg] = useState<OgData | null>(null);
  const [loading, setLoading] = useState(!!project.url);

  useEffect(() => {
    if (!project.url) return;
    let cancelled = false;

    fetch(`/api/og?url=${encodeURIComponent(project.url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data) setOg(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [project.url]);

  const years = formatYears(project.year_start, project.year_end);
  const isApp = project.url ? isAppStoreUrl(project.url) : false;

  return (
    <a
      href={project.url ?? undefined}
      target={project.url ? "_blank" : undefined}
      rel={project.url ? "noopener noreferrer" : undefined}
      className={`card overflow-hidden transition hover:shadow-lg hover:-translate-y-0.5 block ${
        project.url ? "cursor-pointer" : "cursor-default"
      }`}
    >
      {/* Anteprima immagine OG */}
      {loading && (
        <div className="w-full aspect-[1.91/1] bg-ink/5 animate-pulse" />
      )}

      {!loading && og?.image && !isApp && (
        <div className="w-full aspect-[1.91/1] bg-ink/5 overflow-hidden">
          <img
            src={og.image}
            alt={og.title ?? project.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Icona app (per link App Store / Play Store) */}
      {!loading && og?.image && isApp && (
        <div className="w-full flex justify-center pt-6 pb-2">
          <img
            src={og.image}
            alt={og.title ?? project.name}
            className="w-20 h-20 rounded-[22%] shadow-lg"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-2 mb-1.5 text-xs text-ink/50">
          {og?.siteName && <span className="font-semibold">{og.siteName}</span>}
          {og?.siteName && years && <span>·</span>}
          {years && <span>{years}</span>}
        </div>

        <h3 className="font-display font-semibold text-lg leading-tight">
          {project.name}
        </h3>

        {(project.description || og?.description) && (
          <p className="mt-2 text-sm text-ink/60 leading-relaxed line-clamp-2">
            {project.description ?? og?.description}
          </p>
        )}

        {project.revenue_note && (
          <p className="mt-2 text-sm font-semibold text-ink/70">
            💰 {project.revenue_note}
          </p>
        )}

        {project.url && (
          <span className="mt-3 inline-block text-xs font-semibold gradient-text">
            {project.url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} ↗
          </span>
        )}
      </div>
    </a>
  );
}

/** Card compatta per i progetti chiusi */
export function ProjectClosedCard({ project }: { project: Project }) {
  const years = formatYears(project.year_start, project.year_end);

  return (
    <div className="flex items-center gap-3 py-2.5 px-4 rounded-xl bg-ink/[0.03] border border-ink/[0.06]">
      <span className="text-ink/30 text-sm">🔴</span>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-ink/60">{project.name}</span>
        {years && (
          <span className="ml-2 text-xs text-ink/40">{years}</span>
        )}
      </div>
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-ink/40 hover:text-ink/70 transition shrink-0"
        >
          ↗
        </a>
      )}
    </div>
  );
}
