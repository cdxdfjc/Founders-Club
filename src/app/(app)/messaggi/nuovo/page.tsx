import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserSearch } from "@/components/UserSearch";
import Link from "next/link";

export default async function NuovaConversazionePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="card p-5 sm:p-8">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/messaggi" className="text-ink/50 hover:text-ink">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19L5 12L12 5" />
          </svg>
        </Link>
        <h2 className="font-display font-semibold text-xl">
          Nuovo messaggio
        </h2>
      </div>
      <UserSearch currentUserId={user.id} />
    </div>
  );
}
