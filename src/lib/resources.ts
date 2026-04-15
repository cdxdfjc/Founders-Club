// Gradiente identificativo della sezione Risorse
// Più blu/viola tenue rispetto ai progetti (che vanno al pink).
// L'idea è "libreria calma" invece di "pitch shiny".
export const RESOURCES_GRADIENT =
  "linear-gradient(135deg, #32CBFF, #6B8EEA, #89A1EF)";

export const RESOURCES_GRADIENT_SOFT =
  "linear-gradient(135deg, rgba(50,203,255,0.10), rgba(107,142,234,0.10), rgba(137,161,239,0.10))";

export function hostnameFromUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
