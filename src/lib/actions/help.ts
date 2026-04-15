"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HELP_CATEGORIES, HELP_URGENCIES } from "@/lib/help";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function category(v: FormDataEntryValue | null): string {
  const s = str(v);
  return HELP_CATEGORIES.some((c) => c.value === s) ? s : "altro";
}

function urgency(v: FormDataEntryValue | null): string {
  const s = str(v);
  return HELP_URGENCIES.some((u) => u.value === s) ? s : "media";
}

export async function createHelpRequest(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const title = str(formData.get("title"));
  const body = str(formData.get("body"));

  if (title.length < 10 || title.length > 140) return;
  if (body.length < 20 || body.length > 4000) return;

  const { data, error } = await supabase
    .from("help_requests")
    .insert({
      author_id: user.id,
      title,
      body,
      category: category(formData.get("category")),
      urgency: urgency(formData.get("urgency")),
    })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/aiuto");
  redirect(`/aiuto/${data.id}`);
}

export async function deleteHelpRequest(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = str(formData.get("request_id"));
  if (!id) return;

  const { error } = await supabase
    .from("help_requests")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) return;

  revalidatePath("/aiuto");
  redirect("/aiuto");
}

export async function toggleHelpSolved(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = str(formData.get("request_id"));
  const next = str(formData.get("next_status"));
  if (!id) return;
  if (next !== "aperta" && next !== "risolta") return;

  await supabase
    .from("help_requests")
    .update({ status: next })
    .eq("id", id)
    .eq("author_id", user.id);

  revalidatePath(`/aiuto/${id}`);
  revalidatePath("/aiuto");
}

export async function addHelpReply(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const requestId = str(formData.get("request_id"));
  const body = str(formData.get("body"));

  if (!requestId) return;
  if (body.length < 1 || body.length > 2000) return;

  const { error } = await supabase.from("help_replies").insert({
    request_id: requestId,
    author_id: user.id,
    body,
  });

  if (error) return;

  revalidatePath(`/aiuto/${requestId}`);
  revalidatePath("/aiuto");
}
