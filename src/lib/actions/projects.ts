"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/projects";

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

function tagList(v: FormDataEntryValue | null): string[] {
  const s = str(v);
  if (!s) return [];
  return s
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length <= 30)
    .slice(0, 8);
}

async function ensureCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  rawName: string | null,
): Promise<string | null> {
  if (!rawName) return null;
  const name = rawName.trim();
  if (!name) return null;
  const slug = slugify(name);
  if (!slug) return null;

  const { data: existing } = await supabase
    .from("project_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("project_categories")
    .insert({ slug, name, created_by: userId })
    .select("id")
    .single();

  return created?.id ?? null;
}

export async function createProject(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const title = str(formData.get("title"));
  const description = str(formData.get("description"));
  if (!title || !description) return;

  const categoryId = await ensureCategory(
    supabase,
    user.id,
    str(formData.get("category")),
  );

  const stage = str(formData.get("stage"));

  const { data: created } = await supabase
    .from("projects")
    .insert({
      owner_id: user.id,
      title,
      tagline: str(formData.get("tagline")),
      description,
      tags: tagList(formData.get("tags")),
      url: str(formData.get("url")),
      category_id: categoryId,
      stage: stage || null,
    })
    .select("id")
    .single();

  revalidatePath("/progetti");

  if (created) redirect(`/progetti/${created.id}`);
}

export async function toggleLike(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const projectId = str(formData.get("project_id"));
  if (!projectId) return;

  const { data: existing } = await supabase
    .from("project_likes")
    .select("project_id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("project_likes")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", user.id);
  } else {
    await supabase
      .from("project_likes")
      .insert({ project_id: projectId, user_id: user.id });
  }

  revalidatePath(`/progetti/${projectId}`);
  revalidatePath("/progetti");
}

export async function requestJoin(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const projectId = str(formData.get("project_id"));
  if (!projectId) return;

  await supabase.from("project_join_requests").upsert(
    {
      project_id: projectId,
      user_id: user.id,
      message: str(formData.get("message")),
    },
    { onConflict: "project_id,user_id" },
  );

  revalidatePath(`/progetti/${projectId}`);
}

export async function deleteProject(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const projectId = str(formData.get("project_id"));
  if (!projectId) return;

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("owner_id", user.id);

  if (error) return;

  revalidatePath("/progetti");
  redirect("/progetti");
}

export async function addComment(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const projectId = str(formData.get("project_id"));
  const body = str(formData.get("body"));
  if (!projectId || !body) return;

  await supabase.from("project_comments").insert({
    project_id: projectId,
    author_id: user.id,
    body,
  });

  revalidatePath(`/progetti/${projectId}`);
}
