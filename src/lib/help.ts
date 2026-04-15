export type HelpCategory =
  | "tecnico"
  | "legale"
  | "prodotto"
  | "marketing"
  | "finanziamento"
  | "altro";

export type HelpUrgency = "bassa" | "media" | "alta";
export type HelpStatus = "aperta" | "risolta";

export const HELP_CATEGORIES: {
  value: HelpCategory;
  label: string;
  emoji: string;
}[] = [
  { value: "tecnico", label: "Tecnico", emoji: "🛠️" },
  { value: "prodotto", label: "Prodotto", emoji: "🧩" },
  { value: "marketing", label: "Marketing", emoji: "📣" },
  { value: "legale", label: "Legale", emoji: "⚖️" },
  { value: "finanziamento", label: "Finanziamento", emoji: "💰" },
  { value: "altro", label: "Altro", emoji: "🤷" },
];

export const HELP_URGENCIES: {
  value: HelpUrgency;
  label: string;
  emoji: string;
}[] = [
  { value: "bassa", label: "Tranquilla", emoji: "🟢" },
  { value: "media", label: "Questa settimana", emoji: "🟡" },
  { value: "alta", label: "Urgente", emoji: "🔴" },
];

// Gradiente caldo distintivo della sezione Aiuto
export const HELP_GRADIENT =
  "linear-gradient(135deg, #FFC857, #FF8E72, #EF9CDA)";

export const HELP_GRADIENT_SOFT =
  "linear-gradient(135deg, rgba(255,200,87,0.12), rgba(255,142,114,0.12), rgba(239,156,218,0.12))";

export function categoryMeta(value: string | null | undefined) {
  return (
    HELP_CATEGORIES.find((c) => c.value === value) ?? {
      value: "altro" as HelpCategory,
      label: "Altro",
      emoji: "🤷",
    }
  );
}

export function urgencyMeta(value: string | null | undefined) {
  return (
    HELP_URGENCIES.find((u) => u.value === value) ?? {
      value: "media" as HelpUrgency,
      label: "Questa settimana",
      emoji: "🟡",
    }
  );
}
