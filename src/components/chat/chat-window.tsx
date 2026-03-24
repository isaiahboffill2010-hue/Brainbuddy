"use client";
import { useEffect, useCallback } from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { useChatStore } from "@/stores/chat-store";
import type { AiMessage, AiSession, Subject } from "@/types/app";
import type { ChatMessage } from "@/types/app";

interface ChatWindowProps {
  session: AiSession & { subjects: Subject | null };
  initialMessages: AiMessage[];
  studentId: string;
}

export function ChatWindow({ session, initialMessages, studentId }: ChatWindowProps) {
  const { messages, isStreaming, setSession, setMessages, addMessage, appendToLastMessage, setStreaming } =
    useChatStore();

  useEffect(() => {
    setSession(session);
    setMessages(
      initialMessages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        imageUrl: m.image_url ?? undefined,
        createdAt: m.created_at,
      }))
    );
  }, [session.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(
    async (message: string, imageUrl?: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message,
        imageUrl,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMsg);
      setStreaming(true);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: "",
        isStreaming: true,
        createdAt: new Date().toISOString(),
      };
      addMessage(aiMsg);

      try {
        const res = await fetch(`/api/chat/${session.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, imageUrl }),
        });
        if (!res.ok) throw new Error("Failed");
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          appendToLastMessage(decoder.decode(value, { stream: true }));
        }
      } catch {
        appendToLastMessage("\n\n⚠️ Something went wrong. Please try again.");
      } finally {
        setStreaming(false);
        useChatStore.setState((state) => ({
          messages: state.messages.map((m, i) =>
            i === state.messages.length - 1 ? { ...m, isStreaming: false } : m
          ),
        }));
      }
    },
    [session.id, isStreaming, addMessage, appendToLastMessage, setStreaming]
  );

  const subject = session.subjects;

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] glass-bright rounded-3xl border border-white/8 overflow-hidden shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-card/50">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/20 flex items-center justify-center text-xl">
          {subject?.icon ?? "💬"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{session.title ?? subject?.name ?? "Chat"}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
            BrainBuddy is ready to help
          </p>
        </div>
      </div>

      <MessageList messages={messages} isStreaming={isStreaming} />

      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        studentId={studentId}
        subjectId={session.subject_id ?? undefined}
      />
    </div>
  );
}
