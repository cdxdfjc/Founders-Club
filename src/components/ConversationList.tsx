"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Conversation = {
  id: string;
  other_username: string;
  other_full_name: string | null;
  last_message_body: string | null;
  last_message_at: string;
  unread_count: number;
};

function timeAgo(iso: string): string {
  const s = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}g`;
  const mo = Math.floor(d / 30);
  return `${mo}mo`;
}

export function ConversationList({
  initialConversations,
  currentUserId,
}: {
  initialConversations: Conversation[];
  currentUserId: string;
}) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const pathname = usePathname();
  const router = useRouter();

  // Update list when initialConversations change (server re-render)
  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  // Listen for new messages to update the sidebar
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("conversation-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          // Refresh the page to get updated conversation list
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (conversations.length === 0) return null;

  return (
    <div className="space-y-1">
      {conversations.map((c) => {
        const initial = (c.other_full_name ?? c.other_username)
          .charAt(0)
          .toUpperCase();
        const isActive = pathname === `/messaggi/${c.other_username}`;

        return (
          <Link
            key={c.id}
            href={`/messaggi/${c.other_username}`}
            className={`flex items-center gap-3 p-3 rounded-2xl transition ${
              isActive
                ? "bg-white/80 shadow-sm border border-wisteria/30"
                : "hover:bg-white/50"
            }`}
          >
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, #32CBFF, #89A1EF, #EF9CDA)",
              }}
            >
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm truncate">
                  {c.other_full_name ?? c.other_username}
                </p>
                <span className="text-[10px] text-ink/40 shrink-0">
                  {timeAgo(c.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-ink/50 truncate">
                  {c.last_message_body ?? "..."}
                </p>
                {c.unread_count > 0 && (
                  <span
                    className="min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #EF9CDA, #89A1EF)",
                    }}
                  >
                    {c.unread_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
