"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Brain, FileText, PlusCircle, Loader2, ImagePlus, X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Subject = { id: string; name: string; icon: string; color: string };
type Student = {
  id: string; name: string; grade: string; age: number | null;
  avatar_emoji: string; learning_style: string; confidence_level: number;
};
type Session = {
  id: string; title: string | null; subject_id: string | null;
  learning_notes: string | null; session_summary: string | null;
  created_at: string; subjects?: { name: string; icon: string; color: string } | null;
};
type Message = { id?: string; role: "user" | "assistant"; content: string; image_url?: string | null; created_at?: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
const subjectMeta: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  Math:        { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
  Mathematics: { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
  Reading:     { emoji: "📚", color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0" },
  Science:     { emoji: "🔬", color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
  Writing:     { emoji: "✏️", color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
};
function getMeta(name?: string | null) {
  return subjectMeta[name ?? ""] ?? { emoji: "🧠", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" };
}
function timeAgo(dateStr: string) {
  const diffH = Math.round((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return `${Math.round(diffH / 24)}d ago`;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function TutorClient({
  student,
  subjects,
  initialSessions,
}: {
  student: Student;
  subjects: Subject[];
  initialSessions: Session[];
}) {
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(subjects[0] ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [starting, setStarting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // Load messages for a session
  const loadMessages = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/${sessionId}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectSession = useCallback(async (session: Session) => {
    setActiveSession(session);
    setStreamText("");
    const subj = subjects.find((s) => s.id === session.subject_id) ?? null;
    if (subj) setActiveSubject(subj);
    await loadMessages(session.id);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [loadMessages, subjects]);

  // Start a new session for the selected subject, then send the message
  async function getOrCreateSession(): Promise<Session | null> {
    if (activeSession) return activeSession;
    const subject = activeSubject ?? subjects[0];
    if (!subject) return null;
    setStarting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          subjectId: subject.id,
          title: `${subject.name} session`,
        }),
      });
      if (!res.ok) return null;
      const newSession: Session = await res.json();
      const enriched: Session = {
        ...newSession,
        subjects: { name: subject.name, icon: subject.icon, color: subject.color },
      };
      setSessions((prev) => [enriched, ...prev]);
      setActiveSession(enriched);
      return enriched;
    } catch {
      return null;
    } finally {
      setStarting(false);
    }
  }

  // Send message + stream response
  async function sendMessage() {
    if (!input.trim() && !imageFile) return;
    if (streaming) return;

    const textContent = input.trim() || "Please help me understand this.";
    const pendingImage = imageFile;
    const pendingPreview = imagePreview;

    // Show user message with image preview immediately
    const userMsg: Message = { role: "user", content: textContent };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    removeImage();
    setStreaming(true);
    setStreamText("");

    const session = await getOrCreateSession();
    if (!session) { setStreaming(false); return; }

    // Upload image if present
    let imageUrl: string | null = null;
    if (pendingImage) {
      imageUrl = await uploadImage(pendingImage, session.id);
    }

    try {
      const res = await fetch(`/api/chat/${session.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textContent, imageUrl }),
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamText(full);
      }
      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
      setStreamText("");

      // Refresh sessions list after a delay (notes update in background)
      setTimeout(async () => {
        const sessRes = await fetch(`/api/sessions?studentId=${student.id}`).catch(() => null);
        if (sessRes?.ok) {
          const updated = await sessRes.json();
          if (Array.isArray(updated)) setSessions(updated);
        }
      }, 4000);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Make sure your OpenAI API key is set in .env.local." },
      ]);
      setStreamText("");
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function pickImage() {
    fileInputRef.current?.click();
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  }

  function removeImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  async function uploadImage(file: File, sessionId: string): Promise<string | null> {
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("studentId", student.id);
      if (activeSubject) fd.append("subjectId", activeSubject.id);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) return null;
      const data = await res.json();
      return data.image_url ?? null;
    } catch {
      return null;
    } finally {
      setUploadingImage(false);
    }
  }

  function startNewSession() {
    setActiveSession(null);
    setMessages([]);
    setStreamText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const currentMeta = getMeta(activeSubject?.name);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-[calc(100vh-120px)] animate-fade-in">

      {/* ── LEFT: Chat ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-white rounded-3xl border border-[#E8EDF8] shadow-card overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EDF8] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-blue flex items-center justify-center shadow-blue flex-shrink-0">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-[#1F2A44] text-sm">BrainBuddy AI Tutor</p>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse-soft" />
                <span className="text-[10px] text-[#22C55E] font-medium">Online & ready to help</span>
              </div>
            </div>
          </div>
          <button
            onClick={startNewSession}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#4F7CFF] bg-[#EEF3FF] rounded-xl px-3 py-1.5 hover:bg-[#C7D7FF] transition-colors"
          >
            <PlusCircle className="h-3.5 w-3.5" /> New chat
          </button>
        </div>

        {/* Subject pills */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#E8EDF8] flex-shrink-0 overflow-x-auto">
          <span className="text-[10px] font-semibold text-[#9AA4BA] uppercase tracking-wider flex-shrink-0">Subject:</span>
          {subjects.map((s) => {
            const meta = getMeta(s.name);
            const isActive = activeSubject?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => { setActiveSubject(s); if (!activeSession) startNewSession(); }}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0 transition-all border"
                style={{
                  backgroundColor: isActive ? meta.color : meta.bg,
                  color: isActive ? "#fff" : meta.color,
                  borderColor: isActive ? meta.color : meta.border,
                }}
              >
                <span>{meta.emoji}</span> {s.name}
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* Welcome message (no chat yet) */}
          {messages.length === 0 && !loadingMessages && !streamText && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
              <div className="h-16 w-16 rounded-3xl bg-gradient-blue flex items-center justify-center text-3xl shadow-blue animate-float">
                🧠
              </div>
              <div className="space-y-1">
                <p className="font-bold text-[#1F2A44] text-lg">Hey {student.name}! 👋</p>
                <p className="text-sm text-[#6B7A9A] max-w-xs">
                  I&apos;m BrainBuddy, your AI tutor. Ask me anything — a question, a problem, or something you don&apos;t understand.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 max-w-sm w-full">
                {[
                  "Explain this to me step by step",
                  "I don't understand this problem",
                  "Can you quiz me?",
                  "Help me with my homework",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="text-left rounded-2xl bg-[#F7FAFF] border border-[#E8EDF8] px-4 py-2.5 text-sm text-[#6B7A9A] hover:bg-[#EEF3FF] hover:text-[#4F7CFF] hover:border-[#C7D7FF] transition-all"
                  >
                    &ldquo;{prompt}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingMessages && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-[#4F7CFF]" />
            </div>
          )}

          {/* Chat messages */}
          {!loadingMessages && messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-blue mt-0.5 text-base">
                  🧠
                </div>
              )}
              <div className={`max-w-[78%] flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.image_url && (
                  <img src={msg.image_url} alt="Uploaded"
                    className="rounded-2xl max-h-48 max-w-full object-contain border border-white/20 shadow-sm" />
                )}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#4F7CFF] text-white rounded-br-sm"
                      : "bg-[#F7FAFF] border border-[#E8EDF8] text-[#1F2A44] rounded-bl-sm"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {msg.content}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="h-8 w-8 rounded-xl bg-[#EEF3FF] flex items-center justify-center flex-shrink-0 text-base mt-0.5">
                  {student.avatar_emoji}
                </div>
              )}
            </div>
          ))}

          {/* Streaming text */}
          {streamText && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-blue mt-0.5 text-base">🧠</div>
              <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed bg-[#F7FAFF] border border-[#E8EDF8] text-[#1F2A44] streaming-cursor"
                style={{ whiteSpace: "pre-wrap" }}>
                {streamText}
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {(streaming || starting) && !streamText && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-blue text-base">🧠</div>
              <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-[#F7FAFF] border border-[#E8EDF8] flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-[#4F7CFF] animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-[#E8EDF8] flex-shrink-0">

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
          />

          {/* Image preview */}
          {imagePreview && (
            <div className="mb-2 relative inline-block">
              <img src={imagePreview} alt="Upload preview"
                className="h-20 w-20 rounded-xl object-cover border border-[#E8EDF8] shadow-sm" />
              <button
                onClick={removeImage}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#1F2A44] flex items-center justify-center shadow"
              >
                <X className="h-2.5 w-2.5 text-white" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 bg-[#F7FAFF] border border-[#E8EDF8] rounded-2xl px-3 py-2 focus-within:border-[#4F7CFF]/40 transition-colors">
            {/* Image upload button */}
            <button
              onClick={pickImage}
              disabled={streaming || starting || uploadingImage}
              className="h-8 w-8 rounded-xl bg-white border border-[#E8EDF8] flex items-center justify-center flex-shrink-0 mb-0.5 hover:bg-[#EEF3FF] hover:border-[#C7D7FF] transition-all disabled:opacity-40"
              title="Upload image"
            >
              {uploadingImage
                ? <Loader2 className="h-3.5 w-3.5 text-[#4F7CFF] animate-spin" />
                : <ImagePlus className="h-3.5 w-3.5 text-[#6B7A9A]" />}
            </button>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask BrainBuddy anything… (Enter to send)"
              rows={1}
              disabled={streaming || starting}
              className="flex-1 bg-transparent resize-none text-sm text-[#1F2A44] placeholder:text-[#C4CDE0] outline-none min-h-[24px] max-h-[120px] py-1 disabled:opacity-50"
              style={{ scrollbarWidth: "none" }}
            />
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !imageFile) || streaming || starting}
              className="h-9 w-9 rounded-xl bg-[#4F7CFF] flex items-center justify-center shadow-blue hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
            >
              {streaming || starting
                ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                : <Send className="h-4 w-4 text-white" />}
            </button>
          </div>
          <p className="text-[10px] text-[#C4CDE0] text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>

      {/* ── RIGHT: Note Taker ── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col bg-white rounded-3xl border border-[#E8EDF8] shadow-card overflow-hidden">

        {/* Header */}
        <div className="px-4 py-4 border-b border-[#E8EDF8] flex-shrink-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="h-7 w-7 rounded-xl bg-[#F3F0FF] flex items-center justify-center flex-shrink-0">
              <FileText className="h-3.5 w-3.5 text-[#8B7FFF]" />
            </div>
            <p className="font-bold text-[#1F2A44] text-sm">Note Taker</p>
          </div>
          <p className="text-[11px] text-[#9AA4BA]">AI writes notes as you learn</p>
        </div>

        {/* Notes body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
            <div className="text-4xl">📝</div>
            <p className="text-sm font-semibold text-[#1F2A44]">Note Taker</p>
            <p className="text-xs text-[#9AA4BA] leading-relaxed max-w-[200px]">
              Notes about what you&apos;re learning will appear here as you chat with BrainBuddy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
