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

export async function sendUserProjectInvite(
  formData: FormData,
): Promise<void> {
  const { supabase, user } = await requireUser();

  const userProjectId = str(formData.get("user_project_id"));
  const inviteeId = str(formData.get("invitee_id"));
  const message = str(formData.get("message"));
  if (!userProjectId || !inviteeId) return;
  if (inviteeId === user.id) return;
  if (message && message.length > 500) return;

  // Solo l'owner del user_project può invitare
  const { data: project } = await supabase
    .from("user_projects")
    .select("user_id")
    .eq("id", userProjectId)
    .maybeSingle();
  if (!project || project.user_id !== user.id) return;

  await supabase.from("user_project_invites").insert({
    user_project_id: userProjectId,
    inviter_id: user.id,
    invitee_id: inviteeId,
    message,
  });

  revalidatePath("/impostazioni");
  revalidatePath("/messaggi");
}

export async function acceptUserProjectInvite(
  formData: FormData,
): Promise<void> {
  const { supabase, user } = await requireUser();
  const inviteId = str(formData.get("invite_id"));
  if (!inviteId) return;

  await supabase
    .from("user_project_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId)
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  revalidatePath("/messaggi");
}

export async function declineUserProjectInvite(
  formData: FormData,
): Promise<void> {
  const { supabase, user } = await requireUser();
  const inviteId = str(formData.get("invite_id"));
  if (!inviteId) return;

  await supabase
    .from("user_project_invites")
    .update({ status: "declined" })
    .eq("id", inviteId)
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  revalidatePath("/messaggi");
}

export async function cancelUserProjectInvite(
  formData: FormData,
): Promise<void> {
  const { supabase, user } = await requireUser();
  const inviteId = str(formData.get("invite_id"));
  if (!inviteId) return;

  await supabase
    .from("user_project_invites")
    .delete()
    .eq("id", inviteId)
    .eq("inviter_id", user.id)
    .eq("status", "pending");

  revalidatePath("/impostazioni");
}
