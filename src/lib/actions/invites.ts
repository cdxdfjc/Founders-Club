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

export async function sendInvite(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const projectId = str(formData.get("project_id"));
  const inviteeId = str(formData.get("invitee_id"));
  const message = str(formData.get("message"));
  if (!projectId || !inviteeId) return;
  if (inviteeId === user.id) return;
  if (message && message.length > 500) return;

  // Check autorizzazione (owner o membro)
  const { data: project } = await supabase
    .from("projects")
    .select("owner_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return;

  const isOwner = project.owner_id === user.id;
  let isMember = false;
  if (!isOwner) {
    const { data: mem } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();
    isMember = !!mem;
  }
  if (!isOwner && !isMember) return;

  // L'invitato non deve già essere membro o owner
  if (project.owner_id === inviteeId) return;
  const { data: already } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId)
    .eq("user_id", inviteeId)
    .maybeSingle();
  if (already) return;

  // Insert (unique violation = invito già pendente, ignoriamo silenziosamente)
  await supabase.from("project_invites").insert({
    project_id: projectId,
    inviter_id: user.id,
    invitee_id: inviteeId,
    message,
  });

  revalidatePath(`/progetti/${projectId}`);
  revalidatePath("/messaggi");
}

export async function acceptInvite(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const inviteId = str(formData.get("invite_id"));
  if (!inviteId) return;

  const { error } = await supabase
    .from("project_invites")
    .update({ status: "accepted" })
    .eq("id", inviteId)
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  if (error) return;

  revalidatePath("/messaggi");
  revalidatePath("/progetti");
}

export async function declineInvite(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const inviteId = str(formData.get("invite_id"));
  if (!inviteId) return;

  await supabase
    .from("project_invites")
    .update({ status: "declined" })
    .eq("id", inviteId)
    .eq("invitee_id", user.id)
    .eq("status", "pending");

  revalidatePath("/messaggi");
}

export async function cancelInvite(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const inviteId = str(formData.get("invite_id"));
  if (!inviteId) return;

  await supabase
    .from("project_invites")
    .delete()
    .eq("id", inviteId)
    .eq("inviter_id", user.id)
    .eq("status", "pending");

  revalidatePath("/progetti");
}
