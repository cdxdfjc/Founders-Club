"use client";

import { useRef } from "react";
import { sendMessage } from "@/lib/actions/chat";

export function ChatInput({
  conversationId,
  recipientId,
}: {
  conversationId: string;
  recipientId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const body = (formData.get("body") as string)?.trim();
    if (!body) return;
    formRef.current?.reset();
    await sendMessage(formData);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="border-t border-ink/8 p-3 sm:p-4"
    >
      <input type="hidden" name="conversation_id" value={conversationId} />
      <input type="hidden" name="recipient_id" value={recipientId} />
      <div className="flex items-end gap-2">
        <textarea
          name="body"
          placeholder="Scrivi un messaggio..."
          rows={1}
          maxLength={2000}
          onKeyDown={handleKeyDown}
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
  );
}
