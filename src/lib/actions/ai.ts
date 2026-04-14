"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { openaiJSON } from "@/lib/ai/openai";
import { STAGES } from "@/lib/projects";

export type ProjectDraft = {
  title: string;
  tagline: string;
  description: string;
  category: string;
  stage: string;
  tags: string[];
};

export async function assistProjectDraft(
  rawText: string,
): Promise<{ ok: true; draft: ProjectDraft } | { ok: false; error: string }> {
  // Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const text = (rawText ?? "").trim();
  if (text.length < 20) {
    return {
      ok: false,
      error: "Scrivi almeno 20 caratteri sull'idea per farmi capire di cosa si tratta.",
    };
  }
  if (text.length > 4000) {
    return {
      ok: false,
      error: "Testo troppo lungo. Massimo 4000 caratteri.",
    };
  }

  // Lista categorie attuali per dare contesto al modello
  const { data: categories } = await supabase
    .from("project_categories")
    .select("name")
    .order("name");
  const categoryList = (categories ?? []).map((c) => c.name).join(", ");

  const stageList = STAGES.map((s) => `"${s.value}" (${s.label})`).join(", ");

  const system = `Sei un assistente che aiuta founder italiani a strutturare l'annuncio del loro progetto sulla community Founders Club.

L'utente ti darà del testo grezzo (note, idee disordinate, copia-incolla dal telefono) sul progetto che sta costruendo o vuole costruire.

Il tuo compito è trasformarlo in 6 campi strutturati. Rispondi SEMPRE in italiano, tono caldo, concreto, mai gergale, mai marketing-bullshit.

Regole:
- "title": nome corto e memorabile del progetto. Massimo 60 caratteri. Se nel testo non c'è un nome, inventane uno appropriato.
- "tagline": una frase di sottotitolo che spiega cosa fa, max 120 caratteri. Concreta, niente buzzword.
- "description": descrizione completa, ben formattata, 200-600 parole. Spiega: cosa fa, a chi serve, dove sta il founder ora, cosa cerca dalla community. Riformula in modo chiaro ma resta fedele al contenuto originale, non inventare numeri o fatti.
- "category": scegli UNA categoria da questa lista esistente: ${categoryList}. Se nessuna calza bene, proponine una nuova breve (max 2 parole).
- "stage": scegli UNO tra questi valori: ${stageList}. Se non è chiaro dal testo, usa "idea".
- "tags": 3-6 parole chiave in lowercase, senza #, senza spazi (usa trattini). Pensate per la ricerca.`;

  const userPrompt = `Ecco il testo grezzo del founder:\n\n"""\n${text}\n"""`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      tagline: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
      stage: {
        type: "string",
        enum: STAGES.map((s) => s.value),
      },
      tags: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 8,
      },
    },
    required: ["title", "tagline", "description", "category", "stage", "tags"],
  };

  try {
    const draft = await openaiJSON<ProjectDraft>({
      system,
      user: userPrompt,
      schema,
      schemaName: "project_draft",
    });
    return { ok: true, draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    console.error("[assistProjectDraft]", msg);
    return {
      ok: false,
      error: "L'assistente AI non ha risposto. Riprova tra un attimo.",
    };
  }
}
