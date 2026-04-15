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

function intOrNull(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

export async function createEvent(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();

  const title = str(formData.get("title"));
  const description = str(formData.get("description"));
  const city = str(formData.get("city"));
  const venue = str(formData.get("venue"));
  const startsAtRaw = str(formData.get("starts_at"));
  const maxParticipants = intOrNull(formData.get("max_participants"));

  if (title.length < 4 || title.length > 120) return;
  if (description.length < 10 || description.length > 4000) return;
  if (city.length < 2 || city.length > 80) return;
  if (venue.length < 2 || venue.length > 200) return;
  if (!startsAtRaw) return;

  const startsAt = new Date(startsAtRaw);
  if (Number.isNaN(startsAt.getTime())) return;
  if (startsAt.getTime() < Date.now() - 60 * 60 * 1000) return; // non nel passato

  if (maxParticipants !== null && (maxParticipants < 2 || maxParticipants > 500))
    return;

  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      title,
      description,
      city,
      venue,
      starts_at: startsAt.toISOString(),
      max_participants: maxParticipants,
    })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/eventi");
  redirect(`/eventi/${data.id}`);
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = str(formData.get("event_id"));
  if (!id) return;

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id)
    .eq("organizer_id", user.id);

  if (error) return;

  revalidatePath("/eventi");
  redirect("/eventi");
}

export async function joinEvent(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = str(formData.get("event_id"));
  if (!id) return;

  // Verifica capienza
  const { data: ev } = await supabase
    .from("events")
    .select("max_participants")
    .eq("id", id)
    .maybeSingle();
  if (!ev) return;

  if (ev.max_participants !== null) {
    const { count } = await supabase
      .from("event_participants")
      .select("user_id", { count: "exact", head: true })
      .eq("event_id", id);
    if ((count ?? 0) >= ev.max_participants) return;
  }

  await supabase
    .from("event_participants")
    .insert({ event_id: id, user_id: user.id });

  revalidatePath(`/eventi/${id}`);
  revalidatePath("/eventi");
}

export async function leaveEvent(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = str(formData.get("event_id"));
  if (!id) return;

  await supabase
    .from("event_participants")
    .delete()
    .eq("event_id", id)
    .eq("user_id", user.id);

  revalidatePath(`/eventi/${id}`);
  revalidatePath("/eventi");
}
