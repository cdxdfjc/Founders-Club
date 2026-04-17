"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { openaiJSON } from "@/lib/ai/openai";
import { STAGES } from "@/lib/projects";
import { HELP_CATEGORIES, HELP_URGENCIES } from "@/lib/help";

export async function improveText(
  text: string,
  context: string,
): Promise<{ ok: true; improved: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = (text ?? "").trim();
  if (trimmed.length < 10) {
    return {
      ok: false,
      error: "Scrivi almeno 10 caratteri prima di chiedere all'AI.",
    };
  }
  if (trimmed.length > 4000) {
    return { ok: false, error: "Testo troppo lungo. Massimo 4000 caratteri." };
  }

  const system = `Sei un editor che aiuta founder italiani a migliorare i testi per la community Founders Club.

L'utente ti dà un testo e il contesto di dove verrà usato. Tu lo riscrivi migliorandolo: più chiaro, più scorrevole, più concreto.

Regole:
- Rispondi SEMPRE in italiano
- Tono caldo, diretto, da founder. Mai gergo aziendale o marketing-bullshit
- Non inventare fatti, numeri o dettagli non presenti nel testo originale
- Mantieni la stessa lunghezza (± 20%). Non allungare inutilmente
- Preserva il significato e la personalità dell'autore
- Restituisci SOLO il testo migliorato, nient'altro`;

  const userPrompt = `Contesto: ${context}\n\nTesto da migliorare:\n"""\n${trimmed}\n"""`;

  const schema = {
    type: "object" as const,
    additionalProperties: false,
    properties: {
      improved: { type: "string" },
    },
    required: ["improved"],
  };

  try {
    const result = await openaiJSON<{ improved: string }>({
      system,
      user: userPrompt,
      schema,
      schemaName: "improved_text",
    });
    return { ok: true, improved: result.improved };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    console.error("[improveText]", msg);
    return {
      ok: false,
      error: "L'assistente AI non ha risposto. Riprova tra un attimo.",
    };
  }
}

export type UserProjectDraft = {
  name: string;
  description: string;
  revenue_note: string;
  status: "in_corso" | "completato" | "chiuso";
};

export async function assistUserProject(
  rawText: string,
): Promise<
  | { ok: true; draft: UserProjectDraft }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const text = (rawText ?? "").trim();
  if (text.length < 15) {
    return {
      ok: false,
      error: "Scrivi almeno 15 caratteri sul progetto per farmi capire di cosa si tratta.",
    };
  }
  if (text.length > 2000) {
    return { ok: false, error: "Testo troppo lungo. Massimo 2000 caratteri." };
  }

  const system = `Sei un assistente che aiuta founder italiani a descrivere progetti sul loro profilo personale.

L'utente ti dà del testo grezzo (note, pensieri buttati) su un progetto che ha fatto, sta facendo o ha chiuso. Tu lo trasformi in 4 campi strutturati per una card di profilo.

Rispondi SEMPRE in italiano. Tono caldo, concreto, onesto. Mai gergo aziendale, mai marketing-bullshit, mai hype. Non inventare numeri, nomi o fatti che non sono nel testo originale.

Regole sui campi:
- "name": nome del progetto, max 60 caratteri. Se il testo lo contiene, usa quello. Se non c'è un nome esplicito, proponine uno breve basato su cosa fa.
- "description": 2-4 frasi che spiegano cosa fa il progetto, a chi serve, e (se l'utente lo menziona) in che fase è o cosa ha imparato. Max 280 caratteri. Riformula in modo chiaro ma resta fedele al contenuto. Niente numeri inventati.
- "revenue_note": riassunto dei risultati/numeri menzionati nel testo (es. "2k MRR", "100 utenti", "exit €50k", "1M views"). Se non ci sono numeri nel testo, rispondi con stringa vuota. MAI inventarne.
- "status": scegli UNO tra "in_corso" (ci sto ancora lavorando), "completato" (è live e funziona), "chiuso" (ho smesso/venduto/pivotato). Inferisci dal tono del testo. Se ambiguo, usa "in_corso".`;

  const userPrompt = `Ecco quello che mi ha scritto:\n\n"""\n${text}\n"""`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      revenue_note: { type: "string" },
      status: {
        type: "string",
        enum: ["in_corso", "completato", "chiuso"],
      },
    },
    required: ["name", "description", "revenue_note", "status"],
  };

  try {
    const draft = await openaiJSON<UserProjectDraft>({
      system,
      user: userPrompt,
      schema,
      schemaName: "user_project_draft",
    });
    return { ok: true, draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    console.error("[assistUserProject]", msg);
    return {
      ok: false,
      error: "L'assistente AI non ha risposto. Riprova tra un attimo.",
    };
  }
}

export type HelpDraft = {
  title: string;
  body: string;
  category:
    | "tecnico"
    | "legale"
    | "prodotto"
    | "marketing"
    | "finanziamento"
    | "altro";
  urgency: "bassa" | "media" | "alta";
};

export async function assistHelpRequest(
  rawText: string,
): Promise<{ ok: true; draft: HelpDraft } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const text = (rawText ?? "").trim();
  if (text.length < 20) {
    return {
      ok: false,
      error:
        "Scrivi almeno 20 caratteri per farmi capire di cosa hai bisogno.",
    };
  }
  if (text.length > 3000) {
    return { ok: false, error: "Testo troppo lungo. Massimo 3000 caratteri." };
  }

  const catList = HELP_CATEGORIES.map(
    (c) => `"${c.value}" (${c.label})`,
  ).join(", ");
  const urgList = HELP_URGENCIES.map(
    (u) => `"${u.value}" (${u.label})`,
  ).join(", ");

  const system = `Sei un assistente che aiuta founder italiani a formulare una richiesta di aiuto chiara alla community Founders Club.

L'utente ti dà del testo grezzo (il problema che ha, buttato giù di getto). Tu lo trasformi in 4 campi strutturati che diventano la sua "card di richiesta aiuto".

Rispondi SEMPRE in italiano. Tono concreto, umile, diretto. Mai gergo tecnico inutile, mai marketing-bullshit. Non inventare dettagli che non ci sono nel testo.

Regole sui campi:
- "title": una domanda/richiesta chiara, max 100 caratteri. Deve far capire subito di cosa si tratta. Se puoi, formulala come domanda.
- "body": 3-8 frasi che spiegano il contesto, il problema specifico, cosa è stato già provato (se menzionato), e cosa serve di preciso. Max 1200 caratteri. Riformula in modo leggibile ma resta fedele al testo.
- "category": scegli UNA da: ${catList}. Se nessuna calza perfettamente, usa "altro".
- "urgency": scegli UNA da: ${urgList}. "bassa" = curiosità o tema non bloccante, "media" = serve nel giro di giorni, "alta" = bloccato adesso. Se non chiaro, usa "media".`;

  const userPrompt = `Ecco il testo grezzo dell'utente:\n\n"""\n${text}\n"""`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      body: { type: "string" },
      category: {
        type: "string",
        enum: HELP_CATEGORIES.map((c) => c.value),
      },
      urgency: {
        type: "string",
        enum: HELP_URGENCIES.map((u) => u.value),
      },
    },
    required: ["title", "body", "category", "urgency"],
  };

  try {
    const draft = await openaiJSON<HelpDraft>({
      system,
      user: userPrompt,
      schema,
      schemaName: "help_request_draft",
    });
    return { ok: true, draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    console.error("[assistHelpRequest]", msg);
    return {
      ok: false,
      error: "L'assistente AI non ha risposto. Riprova tra un attimo.",
    };
  }
}

export type ResourceDraft = {
  title: string;
  description: string;
  category: string;
};

export async function assistResource(input: {
  userNote: string;
  og?: {
    title: string | null;
    description: string | null;
    siteName: string | null;
    url: string;
  } | null;
}): Promise<
  { ok: true; draft: ResourceDraft } | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const note = (input.userNote ?? "").trim();
  const og = input.og ?? null;

  if (!note && !og) {
    return {
      ok: false,
      error:
        "Serve un link o qualche riga di nota per farmi capire di cosa parliamo.",
    };
  }
  if (note.length > 2000) {
    return { ok: false, error: "Nota troppo lunga. Massimo 2000 caratteri." };
  }

  // Lista categorie esistenti per dare contesto al modello
  const { data: cats } = await supabase
    .from("resource_categories")
    .select("name")
    .order("name");
  const catList = (cats ?? []).map((c) => c.name).join(", ");

  const system = `Sei un assistente che aiuta founder italiani a trasformare un link (o una nota) in una "risorsa consigliata" chiara per altri membri della community Founders Club.

L'output è una piccola card di suggerimento. Deve essere utile, onesta, concreta. Mai marketing-bullshit, mai hype, mai inventare fatti non presenti nel testo o nell'anteprima.

Rispondi SEMPRE in italiano. Tono pratico, caldo, come un amico che ti passa un link dicendo "guarda questo".

Regole sui campi:
- "title": nome chiaro della risorsa (max 100 caratteri). Se c'è un titolo OG usalo come base, ma rendilo leggibile in italiano se serve. Non usare tutto maiuscolo, non usare emoji.
- "description": 2-4 frasi (max 500 caratteri). Spiega cosa è e PERCHÉ è utile a un founder. Se l'utente ha scritto una nota personale ("lo uso per X", "mi ha aiutato a Y"), PRESERVALA nel testo. Non ripetere il titolo.
- "category": scegli UNA categoria dalla lista esistente: ${catList}. Se davvero nessuna calza, proponine una nuova breve (1 parola, max 12 caratteri, prima lettera maiuscola).`;

  const parts: string[] = [];
  if (og) {
    parts.push(`URL: ${og.url}`);
    if (og.siteName) parts.push(`Sito: ${og.siteName}`);
    if (og.title) parts.push(`Titolo della pagina: ${og.title}`);
    if (og.description)
      parts.push(`Descrizione della pagina: ${og.description}`);
  }
  if (note) {
    parts.push(`Nota dell'utente: ${note}`);
  }

  const userPrompt = `Ecco quello che abbiamo:\n\n${parts.join("\n")}`;

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      category: { type: "string" },
    },
    required: ["title", "description", "category"],
  };

  try {
    const draft = await openaiJSON<ResourceDraft>({
      system,
      user: userPrompt,
      schema,
      schemaName: "resource_draft",
    });
    return { ok: true, draft };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore sconosciuto";
    console.error("[assistResource]", msg);
    return {
      ok: false,
      error: "L'assistente AI non ha risposto. Riprova tra un attimo.",
    };
  }
}

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
