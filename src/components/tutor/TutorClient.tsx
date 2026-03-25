"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, FileText, PlusCircle, Loader2, ImagePlus, X, BookOpen, Scissors, AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { SnipCropModal } from "./SnipCropModal";
import { captureScreenFrame } from "@/lib/screenCapture";
import { WorkedExampleCard, type WorkedExample } from "@/components/chat/worked-example-card";

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
type Message = {
  id?: string; role: "user" | "assistant"; content: string;
  image_url?: string | null; created_at?: string;
  workedExample?: WorkedExample | null;
};

// ── Worked-example trigger logic ──────────────────────────────────────────────
const EXAMPLE_REQUEST_RE =
  /\b(show me|example|worked?\s*(out|through|example)|walk\s*me\s*through|how\s*(do|does|did)|demonstrate|step\s*by\s*step|can\s*you\s*show)\b/i;

function shouldGenerateWorkedExample(
  text: string,
  hasImage: boolean,
  learningStyle: string,
): boolean {
  const isVisual = learningStyle === "visual";
  const asksForExample = EXAMPLE_REQUEST_RE.test(text);
  // Trigger when: visual learner uploads/snips an image  OR  anyone explicitly asks for an example
  return (isVisual && hasImage) || asksForExample;
}
type StudyNote = { id: string; topic: string | null; subject: string | null; note: string; created_at: string };

type SnipState =
  | { status: "idle" }
  | { status: "capturing" }                   // waiting for screen picker
  | { status: "cropping"; dataUrl: string }   // crop modal open
  | { status: "sending" }                     // sending cropped image to chat
  | { status: "error"; message: string };     // something went wrong

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

/** Convert a Blob to a base64 data URL (stays in memory, never touches disk). */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(blob);
  });
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function TutorClient({
  student,
  subjects,
  initialSessions,
  initialSessionId,
}: {
  student: Student;
  subjects: Subject[];
  initialSessions: Session[];
  initialSessionId?: string;
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
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [generatingExample, setGeneratingExample] = useState(false);

  // Snip state machine
  const [snip, setSnip] = useState<SnipState>({ status: "idle" });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamText]);

  // Auto-open a session passed via URL (?session=ID)
  useEffect(() => {
    if (!initialSessionId) return;
    const target = initialSessions.find((s) => s.id === initialSessionId);
    if (target) selectSession(target);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSessionId]);

  // Auto-dismiss snip errors after 4 seconds
  useEffect(() => {
    if (snip.status !== "error") return;
    const t = setTimeout(() => setSnip({ status: "idle" }), 4000);
    return () => clearTimeout(t);
  }, [snip]);

  // ── Data fetching ────────────────────────────────────────────────────────
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

  const loadNotes = useCallback(async (sessionId: string) => {
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/notes?sessionId=${sessionId}`);
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : []);
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  }, []);

  const selectSession = useCallback(async (session: Session) => {
    setActiveSession(session);
    setStreamText("");
    setNotes([]);
    const subj = subjects.find((s) => s.id === session.subject_id) ?? null;
    if (subj) setActiveSubject(subj);
    await Promise.all([loadMessages(session.id), loadNotes(session.id)]);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [loadMessages, loadNotes, subjects]);

  // ── Session management ───────────────────────────────────────────────────
  async function getOrCreateSession(): Promise<Session | null> {
    if (activeSession) return activeSession;
    const subject = activeSubject ?? subjects[0];
    if (!subject) return null;
    setStarting(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id, subjectId: subject.id, title: `${subject.name} session` }),
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

  // ── Core send — handles both normal and snip paths ───────────────────────
  async function sendMessageCore(params: {
    text: string;
    /** Persistent image already in Supabase Storage — saved to DB. */
    file?: File | null;
    /** Base64 data URL from snip — sent to OpenAI directly, NOT saved to DB. */
    imageDataUrl?: string | null;
    /** Local blob URL used only for immediate chat preview (revoked after send). */
    localPreview?: string | null;
  }) {
    const { text, file, imageDataUrl, localPreview } = params;
    if (!text.trim() && !file && !imageDataUrl) return;
    if (streaming) return;

    // Optimistic user message — local preview URL used here (not stored)
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, image_url: localPreview ?? undefined },
    ]);
    setStreaming(true);
    setStreamText("");

    const session = await getOrCreateSession();
    if (!session) { setStreaming(false); return; }

    // For normal file uploads: persist to Supabase Storage first
    let persistedImageUrl: string | null = null;
    if (file) {
      persistedImageUrl = await uploadImage(file, session.id);
    }

    try {
      const res = await fetch(`/api/chat/${session.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          // Persistent URL (file upload path) — gets saved to DB
          imageUrl: persistedImageUrl ?? undefined,
          // Ephemeral base64 (snip path) — used by OpenAI only, not saved to DB
          imageDataUrl: imageDataUrl ?? undefined,
        }),
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

      // ── Worked-example generation (non-blocking) ──────────────────────────
      const hasImage = !!(file || imageDataUrl);
      if (shouldGenerateWorkedExample(text, hasImage, student.learning_style)) {
        setGeneratingExample(true);
        fetch("/api/chat/worked-example", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: text,
            imageUrl: persistedImageUrl ?? undefined,
            imageDataUrl: imageDataUrl ?? undefined,
            subject: activeSubject?.name ?? "General",
            studentName: student.name,
            grade: student.grade,
          }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((example) => {
            if (!example) return;
            setMessages((prev) => {
              const copy = [...prev];
              // Attach to the last assistant message
              const lastIdx = copy.length - 1;
              if (copy[lastIdx]?.role === "assistant") {
                copy[lastIdx] = { ...copy[lastIdx], workedExample: example };
              }
              return copy;
            });
          })
          .catch(() => null)
          .finally(() => setGeneratingExample(false));
      }

      const sessionForNotes = session;
      setTimeout(() => loadNotes(sessionForNotes.id), 2500);
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
      // Revoke local blob preview URL — it was only needed for immediate display
      if (localPreview) URL.revokeObjectURL(localPreview);
    }
  }

  // ── Normal textarea send ─────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() && !imageFile) return;
    const text = input.trim() || "Please help me understand this.";
    const file = imageFile;
    const preview = imagePreview;
    setInput("");
    removeImage();
    await sendMessageCore({ text, file, localPreview: preview });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── File upload helpers ──────────────────────────────────────────────────
  function pickImage() { fileInputRef.current?.click(); }

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

  // ── Snip Question flow ───────────────────────────────────────────────────

  /**
   * Step 1 — launch screen capture.
   * Must be called directly from a button onClick (user-gesture requirement).
   */
  async function handleSnipClick() {
    if (streaming || snip.status !== "idle") return;
    setSnip({ status: "capturing" });

    const dataUrl = await captureScreenFrame();

    if (!dataUrl) {
      // User cancelled the picker — silently return to idle
      setSnip({ status: "idle" });
      return;
    }

    setSnip({ status: "cropping", dataUrl });
  }

  /** Step 2 — user confirmed the crop; send blob straight to chat. */
  async function handleCropConfirm(blob: Blob) {
    setSnip({ status: "sending" });

    let imageDataUrl: string;
    try {
      imageDataUrl = await blobToDataUrl(blob);
    } catch {
      setSnip({ status: "error", message: "Could not read the cropped image. Please try again." });
      return;
    }

    // Local blob URL used only so the image shows in the chat bubble instantly.
    // It lives in memory and is revoked inside sendMessageCore after use.
    const localPreview = URL.createObjectURL(blob);

    setSnip({ status: "idle" });

    await sendMessageCore({
      text: "Please help me understand this question.",
      imageDataUrl,
      localPreview,
    });
  }

  /** Step 2b — user closed the modal without confirming. */
  function handleCropCancel() {
    setSnip({ status: "idle" });
  }

  function startNewSession() {
    setActiveSession(null);
    setMessages([]);
    setStreamText("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const currentMeta = getMeta(activeSubject?.name);
  const snipBusy = snip.status === "capturing" || snip.status === "sending";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Crop modal — rendered outside the chat layout so it can be truly full-screen */}
      {snip.status === "cropping" && (
        <SnipCropModal
          screenshotDataUrl={snip.dataUrl}
          onCrop={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      <div className="flex gap-4 h-[calc(100vh-120px)] animate-fade-in">

        {/* ── LEFT: Chat ── */}
        <div className="flex flex-col flex-1 min-w-0 bg-white rounded-3xl border border-[#E8EDF8] shadow-card overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8EDF8] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-gradient-blue flex items-center justify-center shadow-blue flex-shrink-0 overflow-hidden">
                <Image src="/cosmo-logo.png" alt="Cosmo" width={28} height={28} className="rounded-xl" />
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

            {messages.length === 0 && !loadingMessages && !streamText && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
                <div className="h-16 w-16 rounded-3xl bg-gradient-blue flex items-center justify-center shadow-blue animate-float overflow-hidden">
                  <Image src="/cosmo-logo.png" alt="Cosmo" width={48} height={48} className="rounded-2xl" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-[#1F2A44] text-lg">Hey {student.name}! 👋</p>
                  <p className="text-sm text-[#6B7A9A] max-w-xs">
                    I&apos;m BrainBuddy, your AI tutor. Ask me anything — or snip a question straight from your homework!
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

            {!loadingMessages && messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-blue mt-0.5 overflow-hidden">
                    <Image src="/cosmo-logo.png" alt="Cosmo" width={22} height={22} className="rounded-lg" />
                  </div>
                )}
                <div className={`max-w-[78%] flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {msg.image_url && (
                    <img
                      src={msg.image_url}
                      alt="Attached"
                      className="rounded-2xl max-h-48 max-w-full object-contain border border-white/20 shadow-sm"
                    />
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
                  {/* Worked-example card */}
                  {msg.role === "assistant" && msg.workedExample && (
                    <div className="w-full max-w-[520px]">
                      <WorkedExampleCard example={msg.workedExample} />
                    </div>
                  )}
                  {/* "Building example…" indicator on the last assistant message */}
                  {msg.role === "assistant" && i === messages.length - 1 && generatingExample && (
                    <div className="flex items-center gap-2 rounded-2xl bg-[#F3F0FF] border border-[#D5D0FF] px-4 py-2.5 mt-1">
                      <Loader2 className="h-3.5 w-3.5 text-[#8B7FFF] animate-spin flex-shrink-0" />
                      <span className="text-xs text-[#8B7FFF] font-medium">Building your worked example…</span>
                    </div>
                  )}
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
                <div className="h-8 w-8 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-blue mt-0.5 overflow-hidden">
                  <Image src="/cosmo-logo.png" alt="Cosmo" width={22} height={22} className="rounded-lg" />
                </div>
                <div className="max-w-[78%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed bg-[#F7FAFF] border border-[#E8EDF8] text-[#1F2A44] streaming-cursor"
                  style={{ whiteSpace: "pre-wrap" }}>
                  {streamText}
                </div>
              </div>
            )}

            {/* Typing / analyzing indicator */}
            {(streaming || starting) && !streamText && (
              <div className="flex gap-3 justify-start">
                <div className="h-8 w-8 rounded-xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-blue overflow-hidden">
                  <Image src="/cosmo-logo.png" alt="Cosmo" width={22} height={22} className="rounded-lg" />
                </div>
                <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-[#F7FAFF] border border-[#E8EDF8] flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-[#4F7CFF] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                  {snip.status === "idle" && (
                    <span className="text-xs text-[#9AA4BA] ml-1">
                      Cosmo is analyzing your question…
                    </span>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-4 py-3 border-t border-[#E8EDF8] flex-shrink-0">

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            {/* File upload preview */}
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

            {/* Snip error banner */}
            {snip.status === "error" && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                <span className="text-xs text-red-600">{snip.message}</span>
                <button onClick={() => setSnip({ status: "idle" })} className="ml-auto">
                  <X className="h-3.5 w-3.5 text-red-400" />
                </button>
              </div>
            )}

            {/* Snip "capturing" overlay hint */}
            {snip.status === "capturing" && (
              <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#EEF3FF] border border-[#C7D7FF] px-3 py-2">
                <Loader2 className="h-3.5 w-3.5 text-[#4F7CFF] animate-spin flex-shrink-0" />
                <span className="text-xs text-[#4F7CFF] font-medium">
                  Choose a screen, window, or tab in the popup…
                </span>
              </div>
            )}

            <div className="flex items-end gap-2 bg-[#F7FAFF] border border-[#E8EDF8] rounded-2xl px-3 py-2 focus-within:border-[#4F7CFF]/40 transition-colors">

              {/* Upload image button */}
              <button
                onClick={pickImage}
                disabled={streaming || starting || uploadingImage || snipBusy}
                className="h-8 w-8 rounded-xl bg-white border border-[#E8EDF8] flex items-center justify-center flex-shrink-0 mb-0.5 hover:bg-[#EEF3FF] hover:border-[#C7D7FF] transition-all disabled:opacity-40"
                title="Attach image"
              >
                {uploadingImage
                  ? <Loader2 className="h-3.5 w-3.5 text-[#4F7CFF] animate-spin" />
                  : <ImagePlus className="h-3.5 w-3.5 text-[#6B7A9A]" />}
              </button>

              {/* Snip Question button */}
              <button
                onClick={handleSnipClick}
                disabled={streaming || starting || snipBusy}
                className="h-8 rounded-xl bg-white border border-[#E8EDF8] flex items-center justify-center gap-1.5 flex-shrink-0 mb-0.5 px-2.5 hover:bg-[#EEF3FF] hover:border-[#C7D7FF] hover:text-[#4F7CFF] transition-all disabled:opacity-40 group"
                title="Snip a question from your screen"
              >
                {snipBusy
                  ? <Loader2 className="h-3.5 w-3.5 text-[#4F7CFF] animate-spin" />
                  : <Scissors className="h-3.5 w-3.5 text-[#6B7A9A] group-hover:text-[#4F7CFF] transition-colors" />}
                <span className="text-xs font-semibold text-[#6B7A9A] group-hover:text-[#4F7CFF] transition-colors hidden sm:inline">
                  {snipBusy ? "Working…" : "Snip"}
                </span>
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask BrainBuddy anything… (Enter to send)"
                rows={1}
                disabled={streaming || starting || snipBusy}
                className="flex-1 bg-transparent resize-none text-sm text-[#1F2A44] placeholder:text-[#C4CDE0] outline-none min-h-[24px] max-h-[120px] py-1 disabled:opacity-50"
                style={{ scrollbarWidth: "none" }}
              />

              <button
                onClick={sendMessage}
                disabled={(!input.trim() && !imageFile) || streaming || starting || snipBusy}
                className="h-9 w-9 rounded-xl bg-[#4F7CFF] flex items-center justify-center shadow-blue hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 mb-0.5"
              >
                {streaming || starting
                  ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                  : <Send className="h-4 w-4 text-white" />}
              </button>
            </div>

            <p className="text-[10px] text-[#C4CDE0] text-center mt-1.5">
              Enter to send · Shift+Enter for new line · Snip to capture from screen
            </p>
          </div>
        </div>

        {/* ── RIGHT: Note Taker ── */}
        <div className="w-[280px] flex-shrink-0 flex flex-col bg-white rounded-3xl border border-[#E8EDF8] shadow-card overflow-hidden">

          <div className="px-4 py-4 border-b border-[#E8EDF8] flex-shrink-0">
            <div className="flex items-center justify-between mb-0.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-xl bg-[#F3F0FF] flex items-center justify-center flex-shrink-0">
                  <FileText className="h-3.5 w-3.5 text-[#8B7FFF]" />
                </div>
                <p className="font-bold text-[#1F2A44] text-sm">My Notes</p>
              </div>
              {notes.length > 0 && (
                <span className="text-[10px] font-bold bg-[#F3F0FF] text-[#8B7FFF] border border-[#D5D0FF] rounded-full px-2 py-0.5">
                  {notes.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#9AA4BA]">Cosmo writes notes as you learn</p>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">

            {loadingNotes && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-[#8B7FFF]" />
              </div>
            )}

            {!loadingNotes && notes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-10 min-h-[200px]">
                <div className="h-12 w-12 rounded-2xl bg-[#F3F0FF] flex items-center justify-center text-2xl">
                  📝
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1F2A44]">No notes yet</p>
                  <p className="text-[11px] text-[#9AA4BA] leading-relaxed mt-0.5 max-w-[180px]">
                    {activeSession
                      ? "Your study notes will appear here as you learn"
                      : "Start a session to see your notes here"}
                  </p>
                </div>
              </div>
            )}

            {!loadingNotes && notes.map((note, i) => {
              const meta = getMeta(note.subject);
              const isNew = i === 0 && !streaming;
              return (
                <div
                  key={note.id}
                  className={`rounded-2xl border p-3 transition-all ${
                    isNew && notes.length === 1
                      ? "border-[#D5D0FF] bg-[#F3F0FF] animate-fade-in"
                      : "border-[#E8EDF8] bg-[#F7FAFF]"
                  }`}
                >
                  {note.topic && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <BookOpen className="h-3 w-3 flex-shrink-0" style={{ color: meta.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-wide truncate" style={{ color: meta.color }}>
                        {note.topic}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-[#1F2A44] leading-relaxed">{note.note}</p>
                  <p className="text-[10px] text-[#C4CDE0] mt-1.5">{timeAgo(note.created_at)}</p>
                </div>
              );
            })}

            {streaming && activeSession && (
              <div className="rounded-2xl border border-dashed border-[#D5D0FF] bg-[#F3F0FF]/50 p-3 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-[#8B7FFF] flex-shrink-0" />
                <span className="text-[11px] text-[#8B7FFF] font-medium">Writing note…</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
