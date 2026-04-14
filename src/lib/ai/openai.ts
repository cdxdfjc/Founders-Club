// Client OpenAI lato server. Mai importare in componenti client.

const API_URL = "https://api.openai.com/v1/chat/completions";

type JsonSchema = Record<string, unknown>;

export async function openaiJSON<T>({
  system,
  user,
  schema,
  schemaName,
  model = "gpt-4o-mini",
}: {
  system: string;
  user: string;
  schema: JsonSchema;
  schemaName: string;
  model?: string;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY non configurata");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: schemaName,
          strict: true,
          schema,
        },
      },
      temperature: 0.5,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Risposta OpenAI vuota");

  return JSON.parse(content) as T;
}
