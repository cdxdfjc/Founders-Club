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

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function createBarThread(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const title = str(formData.get("title"));
  const body = str(formData.get("body"));

  if (title.length < 3 || title.length > 140) return;
  if (body.length < 1 || body.length > 4000) return;

  const { data, error } = await supabase
    .from("bar_threads")
    .insert({ author_id: user.id, title, body })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/bar");
  redirect(`/bar/${data.id}`);
}

export async function deleteBarThread(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const threadId = str(formData.get("thread_id"));
  if (!threadId) return;

  const { error } = await supabase
    .from("bar_threads")
    .delete()
    .eq("id", threadId)
    .eq("author_id", user.id);

  if (error) return;

  revalidatePath("/bar");
  redirect("/bar");
}

export async function addBarReply(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const threadId = str(formData.get("thread_id"));
  const body = str(formData.get("body"));

  if (!threadId) return;
  if (body.length < 1 || body.length > 2000) return;

  const { error } = await supabase.from("bar_replies").insert({
    thread_id: threadId,
    author_id: user.id,
    body,
  });

  if (error) return;

  revalidatePath(`/bar/${threadId}`);
  revalidatePath("/bar");
}
