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

function str(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function statusOrDefault(v: FormDataEntryValue | null): string {
  const s = str(v);
  if (s === "completato" || s === "chiuso" || s === "in_corso") return s;
  return "in_corso";
}

function revalidateProfile() {
  revalidatePath("/impostazioni");
  revalidatePath("/profilo/[username]", "page");
}

export async function updateProfile(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const age = intOrNull(formData.get("age"));
  const safeAge = age !== null && age >= 14 && age <= 120 ? age : null;

  await supabase
    .from("profiles")
    .update({
      full_name: str(formData.get("full_name")),
      city: str(formData.get("city")),
      bio: str(formData.get("bio")),
      age: safeAge,
      occupation: str(formData.get("occupation")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidateProfile();
}

export async function updateContacts(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  await supabase
    .from("profiles")
    .update({
      contact_email: str(formData.get("contact_email")),
      contact_telegram: str(formData.get("contact_telegram")),
      contact_linkedin: str(formData.get("contact_linkedin")),
      contact_twitter: str(formData.get("contact_twitter")),
      contact_instagram: str(formData.get("contact_instagram")),
      contact_website: str(formData.get("contact_website")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  revalidateProfile();
}

export async function addProject(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const name = str(formData.get("name"));
  if (!name) return;

  await supabase.from("user_projects").insert({
    user_id: user.id,
    name,
    description: str(formData.get("description")),
    url: str(formData.get("url")),
    status: statusOrDefault(formData.get("status")),
    year_start: intOrNull(formData.get("year_start")),
    year_end: intOrNull(formData.get("year_end")),
    revenue_note: str(formData.get("revenue_note")),
  });

  revalidateProfile();
}

export async function updateProject(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  if (!id || !name) return;

  await supabase
    .from("user_projects")
    .update({
      name,
      description: str(formData.get("description")),
      url: str(formData.get("url")),
      status: statusOrDefault(formData.get("status")),
      year_start: intOrNull(formData.get("year_start")),
      year_end: intOrNull(formData.get("year_end")),
      revenue_note: str(formData.get("revenue_note")),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateProfile();
}

export async function deleteProject(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const id = str(formData.get("id"));
  if (!id) return;

  await supabase
    .from("user_projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  revalidateProfile();
}

export async function updateEmail(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const email = str(formData.get("email"));
  if (!email) return;
  await supabase.auth.updateUser({ email });
  revalidatePath("/impostazioni");
}

export async function updatePassword(formData: FormData): Promise<void> {
  const { supabase } = await requireUser();
  const password = str(formData.get("password"));
  if (!password || password.length < 8) return;
  await supabase.auth.updateUser({ password });
  revalidatePath("/impostazioni");
}

export async function deleteMyAccount(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const confirm = str(formData.get("confirm"));
  const userEmail = user.email ?? null;

  if (
    !userEmail ||
    !confirm ||
    confirm.toLowerCase() !== userEmail.toLowerCase()
  ) {
    redirect("/impostazioni?error=confirm_mismatch");
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    console.error("[deleteMyAccount]", error.message);
    redirect("/impostazioni?error=delete_failed");
  }

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
