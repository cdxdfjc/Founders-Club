"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markAsRead } from "@/lib/actions/chat";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function ChatMessages({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read on mount
  useEffect(() => {
    markAsRead(conversationId);
  }, [conversationId]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Segna come letto se siamo il destinatario
          if (newMsg.sender_id !== currentUserId) {
            markAsRead(conversationId);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.length === 0 && (
        <div className="text-center text-ink/40 py-12">
          <div className="text-4xl mb-2">💬</div>
          <p>Inizia la conversazione!</p>
        </div>
      )}
      {messages.map((msg) => {
        const isMine = msg.sender_id === currentUserId;
        return (
          <div
            key={msg.id}
            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMine
                  ? "text-white rounded-br-md"
                  : "bg-white/70 backdrop-blur border border-white/80 text-ink rounded-bl-md"
              }`}
              style={
                isMine
                  ? {
                      background:
                        "linear-gradient(135deg, #32CBFF, #89A1EF 60%, #EF9CDA)",
                    }
                  : undefined
              }
            >
              <p className="whitespace-pre-wrap break-words">{msg.body}</p>
              <p
                className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-ink/40"}`}
              >
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
