export const STAGES = [
  { value: "idea", label: "Idea", emoji: "💭" },
  { value: "prototipo", label: "Prototipo", emoji: "🛠️" },
  { value: "mvp", label: "MVP live", emoji: "🚀" },
  { value: "primi_clienti", label: "Primi clienti", emoji: "💰" },
  { value: "profittevole", label: "Profittevole", emoji: "📈" },
] as const;

export type Stage = (typeof STAGES)[number]["value"];

export function stageMeta(value: string | null | undefined) {
  return STAGES.find((s) => s.value === value);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}
