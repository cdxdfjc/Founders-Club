"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/projects";
import { fetchOg, type OgPreview } from "@/lib/og";

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
    .from("resource_categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: created } = await supabase
    .from("resource_categories")
    .insert({ slug, name, created_by: userId })
    .select("id")
    .single();
  return created?.id ?? null;
}

export async function previewUrl(
  url: string,
): Promise<
  | { ok: true; preview: OgPreview }
  | { ok: false; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const og = await fetchOg(url);
  if (!og) {
    return {
      ok: false,
      error:
        "Non sono riuscito a leggere l'anteprima di questo link. Puoi sempre compilare a mano.",
    };
  }
  return { ok: true, preview: og };
}

export async function createResource(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const title = str(formData.get("title"));
  const description = str(formData.get("description"));
  if (!title || !description) return;
  if (title.length < 5 || title.length > 120) return;
  if (description.length < 10 || description.length > 1200) return;

  const categoryId = await ensureCategory(
    supabase,
    user.id,
    str(formData.get("category")),
  );

  const { data: created, error } = await supabase
    .from("resources")
    .insert({
      author_id: user.id,
      category_id: categoryId,
      title,
      description,
      url: str(formData.get("url")),
      image_url: str(formData.get("image_url")),
      site_name: str(formData.get("site_name")),
    })
    .select("id")
    .single();

  if (error || !created) return;

  revalidatePath("/risorse");
  redirect(`/risorse/${created.id}`);
}

export async function deleteResource(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = str(formData.get("resource_id"));
  if (!id) return;

  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id);

  if (error) return;

  revalidatePath("/risorse");
  redirect("/risorse");
}
