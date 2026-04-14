"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function loginWithGoogle() {
  const supabase = await createClient();
  const h = await headers();
  const origin =
    h.get("origin") ?? `https://${h.get("host") ?? "foundersclub.it"}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=google_oauth_failed");
  }
  redirect(data.url);
}
