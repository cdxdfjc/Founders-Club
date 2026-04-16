"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markAsRead, sendMessage } from "@/lib/actions/chat";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export function ChatView({
  conversationId,
  currentUserId,
  recipientId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  recipientId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync initialMessages when server re-renders (navigation, revalidation)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read on mount
  useEffect(() => {
    markAsRead(conversationId);
  }, [conversationId]);

  // Fetch all messages from the client (fallback + polling)
  const refreshMessages = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data as Message[]);
    }
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
            // Skip if already present
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            // Replace optimistic message if it matches
            const withoutOptimistic = prev.filter(
              (m) =>
                !(
                  m.id.startsWith("optimistic-") &&
                  m.body === newMsg.body &&
                  m.sender_id === newMsg.sender_id
                ),
            );
            return [...withoutOptimistic, newMsg];
          });
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

  // Poll for new messages every 3 seconds (reliable fallback if Realtime isn't active)
  useEffect(() => {
    const interval = setInterval(refreshMessages, 3000);
    return () => clearInterval(interval);
  }, [refreshMessages]);

  // Optimistic send
  const handleSubmit = useCallback(
    async (formData: FormData) => {
      const body = (formData.get("body") as string)?.trim();
      if (!body) return;

      // Add message optimistically
      const optimisticMsg: Message = {
        id: `optimistic-${Date.now()}`,
        sender_id: currentUserId,
        body,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // Reset form
      formRef.current?.reset();
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }

      // Send to server, then fetch real messages to replace optimistic
      await sendMessage(formData);
      await refreshMessages();
    },
    [currentUserId, refreshMessages],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  // Auto-resize textarea
  function handleTextareaInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = "44px";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {/* Messaggi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-ink/40 py-12">
            <div className="text-4xl mb-2">💬</div>
            <p>Inizia la conversazione!</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          const isOptimistic = msg.id.startsWith("optimistic-");
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
                } ${isOptimistic ? "opacity-70" : ""}`}
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
                  {isOptimistic ? "Invio..." : formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        ref={formRef}
        action={handleSubmit}
        className="border-t border-ink/8 p-3 sm:p-4"
      >
        <input type="hidden" name="conversation_id" value={conversationId} />
        <input type="hidden" name="recipient_id" value={recipientId} />
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            name="body"
            placeholder="Scrivi un messaggio..."
            rows={1}
            maxLength={2000}
            onKeyDown={handleKeyDown}
            onInput={handleTextareaInput}
            className="field !rounded-2xl !py-3 !px-4 resize-none flex-1"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />
          <button
            type="submit"
            className="btn-gradient !py-3 !px-4 !rounded-full shrink-0"
          >
            <span className="sr-only">Invia</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
      </form>
    </>
  );
}
