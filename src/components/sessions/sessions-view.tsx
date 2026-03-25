"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare, Plus, Clock, ChevronRight, Trash2 } from "lucide-react";

const SUBJECTS = ["Math", "Reading", "Science", "Writing"] as const;

const subjectMeta: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  Math:    { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
  Reading: { emoji: "📚", color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0" },
  Science: { emoji: "🔬", color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
  Writing: { emoji: "✏️", color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
};

function timeAgo(iso: string) {
  const diffH = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (diffH < 1)  return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return `${Math.round(diffH / 24)}d ago`;
}

export interface SessionItem {
  id: string;
  title: string | null;
  created_at: string;
  subjectName: string;
  subjectId: string;
}

interface SessionsViewProps {
  sessions: SessionItem[];
  studentId: string;
  subjectIdMap: Record<string, string>;
}

export function SessionsView({ sessions: initialSessions, studentId, subjectIdMap }: SessionsViewProps) {
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [activeTab, setActiveTab] = useState<string>("Math");
  const [starting, setStarting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const router = useRouter();

  const filtered = sessions.filter((s) => s.subjectName === activeTab);
  const meta = subjectMeta[activeTab] ?? subjectMeta["Math"];

  async function handleNewChat() {
    const subjectId = subjectIdMap[activeTab];
    if (!subjectId) return;
    setStarting(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, subjectId, title: `${activeTab} Session` }),
    });
    if (res.ok) {
      const session = await res.json();
      router.push(`/tutor?session=${session.id}`);
    }
    setStarting(false);
  }

  async function handleDelete(sessionId: string) {
    setDeletingId(sessionId);
    await fetch(`/api/sessions?sessionId=${sessionId}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setDeletingId(null);
    setConfirmId(null);
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1F2A44]">My Chats</h1>
          <p className="text-sm text-[#9AA4BA] mt-0.5">Pick up where you left off</p>
        </div>
        <button
          onClick={handleNewChat}
          disabled={starting}
          className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-blue hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {starting ? "Starting..." : `New ${activeTab} Chat`}
        </button>
      </div>

      {/* Subject tabs */}
      <div className="flex gap-2 flex-wrap">
        {SUBJECTS.map((subject) => {
          const m = subjectMeta[subject];
          const count = sessions.filter((s) => s.subjectName === subject).length;
          const isActive = activeTab === subject;
          return (
            <button
              key={subject}
              onClick={() => { setActiveTab(subject); setConfirmId(null); }}
              className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all border"
              style={{
                backgroundColor: isActive ? m.color : m.bg,
                color: isActive ? "#fff" : m.color,
                borderColor: isActive ? m.color : m.border,
              }}
            >
              <span>{m.emoji}</span>
              {subject}
              {count > 0 && (
                <span
                  className="h-5 min-w-5 rounded-full text-[10px] font-bold flex items-center justify-center px-1.5"
                  style={{
                    backgroundColor: isActive ? "rgba(255,255,255,0.25)" : m.color + "22",
                    color: isActive ? "#fff" : m.color,
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Sessions list */}
      <div
        className="bg-white rounded-3xl border shadow-card p-6"
        style={{ borderColor: meta.border }}
      >
        {filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="relative group">
                {confirmId === s.id ? (
                  /* Confirm delete row */
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF0F0] border border-[#FFD5D5]">
                    <span className="text-sm font-semibold text-[#F87171] flex-1">Delete this chat?</span>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={deletingId === s.id}
                      className="rounded-xl bg-[#F87171] text-white text-xs font-bold px-4 py-1.5 hover:bg-[#ef4444] transition-colors disabled:opacity-60"
                    >
                      {deletingId === s.id ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      className="rounded-xl bg-white border border-[#E8EDF8] text-xs font-semibold text-[#6B7A9A] px-4 py-1.5 hover:bg-[#F7FAFF] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#F7FAFF] transition-colors">
                    <Link href={`/tutor?session=${s.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className="h-11 w-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
                        style={{ backgroundColor: meta.bg }}
                      >
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1F2A44] truncate">
                          {s.title ?? `${s.subjectName} Session`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-[#9AA4BA]" />
                          <span className="text-xs text-[#9AA4BA]">{timeAgo(s.created_at)}</span>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        <MessageSquare className="h-3 w-3" />
                        Continue
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#9AA4BA] group-hover:text-[#4F7CFF] transition-colors flex-shrink-0" />
                    </Link>
                    <button
                      onClick={() => setConfirmId(s.id)}
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-[#9AA4BA] hover:bg-[#FFF0F0] hover:text-[#F87171] transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
                      title="Delete chat"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <span className="text-5xl">{meta.emoji}</span>
            <p className="text-sm font-semibold text-[#1F2A44]">No {activeTab} chats yet</p>
            <p className="text-xs text-[#9AA4BA]">Start a new chat to begin learning {activeTab}!</p>
            <button
              onClick={handleNewChat}
              disabled={starting}
              className="mt-2 flex items-center gap-2 text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-60"
              style={{ backgroundColor: meta.color }}
            >
              <Plus className="h-4 w-4" />
              {starting ? "Starting..." : `Start ${activeTab} Chat`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
