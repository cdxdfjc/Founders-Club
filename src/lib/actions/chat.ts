"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Restituisce o crea la conversazione tra l'utente corrente e un altro utente */
export async function getOrCreateConversation(otherUserId: string) {
  const { supabase, user } = await requireUser();
  if (otherUserId === user.id) return null;

  const [userA, userB] =
    user.id < otherUserId ? [user.id, otherUserId] : [otherUserId, user.id];

  // Prova a trovare la conversazione esistente
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", userA)
    .eq("user_b", userB)
    .maybeSingle();

  if (existing) return existing.id;

  // Crea nuova conversazione
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_a: userA, user_b: userB })
    .select("id")
    .single();

  if (error) {
    // Race condition: un'altra request ha creato la conversazione
    const { data: retry } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle();
    return retry?.id ?? null;
  }

  return created.id;
}

/** Invia un messaggio in una conversazione */
export async function sendMessage(formData: FormData) {
  const { supabase, user } = await requireUser();

  const conversationId = formData.get("conversation_id") as string;
  const recipientId = formData.get("recipient_id") as string;
  const body = (formData.get("body") as string)?.trim();

  if (!conversationId || !recipientId || !body) return;
  if (body.length > 2000) return;

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    recipient_id: recipientId,
    body,
  });

  // Aggiorna last_message_at sulla conversazione
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  revalidatePath("/messaggi");
}

/** Segna tutti i messaggi di una conversazione come letti */
export async function markAsRead(conversationId: string) {
  const { supabase, user } = await requireUser();

  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("recipient_id", user.id)
    .is("read_at", null);
}
