import { create } from "zustand";
import type { ChatMessage, AiSession } from "@/types/app";

interface ChatState {
  session: AiSession | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  setSession: (session: AiSession | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  setStreaming: (streaming: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  session: null,
  messages: [],
  isStreaming: false,
  setSession: (session) => set({ session }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  appendToLastMessage: (text) =>
    set((state) => {
      const messages = [...state.messages];
      const last = messages[messages.length - 1];
      if (last && last.role === "assistant") {
        messages[messages.length - 1] = { ...last, content: last.content + text };
      }
      return { messages };
    }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  reset: () => set({ session: null, messages: [], isStreaming: false }),
}));
