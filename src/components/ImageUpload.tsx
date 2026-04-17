"use client";

import { useCallback, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  bucket?: string;
  folder?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  maxSizeMB?: number;
};

const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function ImageUpload({
  bucket = "project-images",
  folder = "covers",
  value,
  onChange,
  maxSizeMB = 2,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      if (!ACCEPTED.includes(file.type)) {
        setError("Formato non supportato. Usa PNG, JPG, WebP o GIF.");
        return;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Il file supera ${maxSizeMB} MB.`);
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${folder}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          setError("Errore durante l'upload. Riprova.");
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);

        onChange(publicUrl);
      } catch {
        setError("Errore di rete. Riprova.");
      } finally {
        setUploading(false);
      }
    },
    [bucket, folder, maxSizeMB, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) upload(file);
    },
    [upload],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) upload(file);
    },
    [upload],
  );

  const remove = useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  if (value) {
    return (
      <div className="relative group rounded-2xl overflow-hidden border border-ink/10">
        <img
          src={value}
          alt="Immagine progetto"
          className="w-full aspect-[2/1] object-cover"
        />
        <button
          type="button"
          onClick={remove}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center py-10 px-6 ${
          dragging
            ? "border-sky-400 bg-sky-50/50"
            : "border-ink/15 hover:border-ink/30 bg-ink/[0.02]"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={handleFileChange}
        />

        {uploading ? (
          <>
            <div className="w-10 h-10 rounded-full border-2 border-ink/20 border-t-ink/60 animate-spin mb-3" />
            <p className="text-sm text-ink/50">Caricamento…</p>
          </>
        ) : (
          <>
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(50,203,255,0.15), rgba(239,156,218,0.15))",
              }}
            >
              +
            </div>
            <p className="text-sm font-semibold text-ink/70">
              Aggiungi immagine o logo
            </p>
            <p className="text-xs text-ink/40 mt-1">
              Trascina qui o clicca per scegliere — max {maxSizeMB} MB
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-plum font-semibold">{error}</p>
      )}
    </div>
  );
}
