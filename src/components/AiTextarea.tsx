"use client";

import { useState, useTransition } from "react";
import { improveText } from "@/lib/actions/ai";

type Props = {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  context: string;
  rows?: number;
  className?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
};

export function AiTextarea({
  name,
  value: controlledValue,
  onChange,
  context,
  rows = 5,
  className = "field resize-y min-h-[120px]",
  placeholder,
  required,
  minLength,
  maxLength,
}: Props) {
  const [local, setLocal] = useState(controlledValue ?? "");
  const [aiPending, startAi] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  const value = controlledValue ?? local;
  const setValue = (v: string) => {
    if (onChange) onChange(v);
    else setLocal(v);
  };

  const canImprove = value.trim().length >= 10 && !aiPending;

  const runImprove = () => {
    setAiError(null);
    startAi(async () => {
      const res = await improveText(value, context);
      if (!res.ok) {
        setAiError(res.error);
        return;
      }
      setValue(res.improved);
    });
  };

  return (
    <div>
      <textarea
        name={name}
        rows={rows}
        className={className}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        {aiError && (
          <p className="text-xs text-plum font-semibold flex-1">{aiError}</p>
        )}
        {!aiError && <span />}
        <button
          type="button"
          onClick={runImprove}
          disabled={!canImprove}
          className="text-xs font-semibold px-3 py-1.5 rounded-full transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canImprove
              ? "linear-gradient(135deg, rgba(137,161,239,0.15), rgba(239,156,218,0.15))"
              : undefined,
            color: canImprove ? "#7C6EBF" : undefined,
          }}
        >
          {aiPending ? "✨ Miglioro…" : "✨ Migliora con l'AI"}
        </button>
      </div>
    </div>
  );
}
