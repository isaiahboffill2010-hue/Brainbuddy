"use client";
import { useState } from "react";
import { Plus, Edit3, Trash2, X, Check, Sparkles, PenLine } from "lucide-react";

type StudentNote = {
  id: string;
  student_id: string;
  session_id: string | null;
  subject: string | null;
  topic: string | null;
  note: string;
  created_at: string;
};

const SUBJECTS = ["All", "Math", "Reading", "Science", "Writing"] as const;
type SubjectFilter = (typeof SUBJECTS)[number];

const subjectMeta: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
  Math:    { color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", emoji: "🔢" },
  Reading: { color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0", emoji: "📚" },
  Science: { color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF", emoji: "🔬" },
  Writing: { color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0", emoji: "✏️" },
};

function timeAgo(iso: string) {
  const diffH = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return `${Math.round(diffH / 24)}d ago`;
}

interface NotesClientProps {
  initialNotes: StudentNote[];
}

export function NotesClient({ initialNotes }: NotesClientProps) {
  const [notes, setNotes] = useState<StudentNote[]>(initialNotes);
  const [filter, setFilter] = useState<SubjectFilter>("All");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createSubject, setCreateSubject] = useState("Math");
  const [createTopic, setCreateTopic] = useState("");
  const [createNote, setCreateNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filtered = filter === "All" ? notes : notes.filter(n => n.subject === filter);

  const counts = SUBJECTS.reduce<Record<string, number>>((acc, s) => {
    acc[s] = s === "All" ? notes.length : notes.filter(n => n.subject === s).length;
    return acc;
  }, {});

  function startEdit(note: StudentNote) {
    setEditingId(note.id);
    setEditText(note.note);
    setEditTopic(note.topic ?? "");
  }

  async function saveEdit(noteId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: editText, topic: editTopic || null }),
      });
      if (res.ok) {
        setNotes(prev =>
          prev.map(n =>
            n.id === noteId ? { ...n, note: editText, topic: editTopic || null } : n
          )
        );
        setEditingId(null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: string) {
    const res = await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    if (res.ok) {
      setNotes(prev => prev.filter(n => n.id !== noteId));
      setDeleteConfirm(null);
    }
  }

  async function handleCreate() {
    if (!createNote.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: createSubject,
          topic: createTopic.trim() || null,
          note: createNote.trim(),
        }),
      });
      if (res.ok) {
        const newNote: StudentNote = await res.json();
        setNotes(prev => [newNote, ...prev]);
        setShowCreate(false);
        setCreateTopic("");
        setCreateNote("");
        setCreateSubject("Math");
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1F2A44]">My Notes</h1>
          <p className="text-sm text-[#9AA4BA] mt-0.5">
            {notes.length} note{notes.length !== 1 ? "s" : ""} saved from your AI tutor sessions
          </p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setFilter("All"); }}
          className="flex items-center gap-2 text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg hover:opacity-90 transition-all flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #4F7CFF 0%, #8B7FFF 100%)" }}
        >
          <Plus className="h-4 w-4" />
          Add My Own Note
        </button>
      </div>

      {/* ── Subject filter tabs ────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {SUBJECTS.map(s => {
          const meta = subjectMeta[s];
          const active = filter === s;
          const activeColor = s === "All" ? "#4F7CFF" : meta?.color;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all border"
              style={
                active
                  ? { backgroundColor: activeColor, color: "#fff", borderColor: activeColor }
                  : {
                      backgroundColor: s === "All" ? "#F7FAFF" : meta?.bg,
                      color: s === "All" ? "#6B7A9A" : meta?.color,
                      borderColor: s === "All" ? "#E8EDF8" : meta?.border,
                    }
              }
            >
              {s !== "All" && <span className="text-sm leading-none">{meta?.emoji}</span>}
              {s}
              <span className="ml-0.5 text-[10px] opacity-60">({counts[s] ?? 0})</span>
            </button>
          );
        })}
      </div>

      {/* ── Create note form ──────────────────────────────────── */}
      {showCreate && (
        <div className="bg-white rounded-3xl border-2 shadow-lg p-5" style={{ borderColor: "#4F7CFF33" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #4F7CFF 0%, #8B7FFF 100%)" }}
              >
                <PenLine className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-[#1F2A44]">New Note</span>
            </div>
            <button
              onClick={() => setShowCreate(false)}
              className="h-8 w-8 rounded-xl bg-[#F7FAFF] flex items-center justify-center text-[#9AA4BA] hover:text-[#1F2A44] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Subject picker */}
          <p className="text-xs font-semibold text-[#9AA4BA] uppercase tracking-wider mb-2">Subject</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(["Math", "Reading", "Science", "Writing"] as const).map(s => {
              const m = subjectMeta[s];
              return (
                <button
                  key={s}
                  onClick={() => setCreateSubject(s)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all border"
                  style={
                    createSubject === s
                      ? { backgroundColor: m.color, color: "#fff", borderColor: m.color }
                      : { backgroundColor: m.bg, color: m.color, borderColor: m.border }
                  }
                >
                  {m.emoji} {s}
                </button>
              );
            })}
          </div>

          <p className="text-xs font-semibold text-[#9AA4BA] uppercase tracking-wider mb-1.5">Topic <span className="normal-case font-normal">(optional)</span></p>
          <input
            value={createTopic}
            onChange={e => setCreateTopic(e.target.value)}
            placeholder="e.g. Fractions, Main Idea, Photosynthesis…"
            className="w-full rounded-xl border border-[#E8EDF8] px-3 py-2 text-sm text-[#1F2A44] placeholder:text-[#C4CDE0] focus:outline-none focus:border-[#4F7CFF] mb-4"
          />

          <p className="text-xs font-semibold text-[#9AA4BA] uppercase tracking-wider mb-1.5">Note</p>
          <textarea
            value={createNote}
            onChange={e => setCreateNote(e.target.value)}
            placeholder="Write your note here…"
            rows={4}
            className="w-full rounded-xl border border-[#E8EDF8] px-3 py-2 text-sm text-[#1F2A44] placeholder:text-[#C4CDE0] focus:outline-none focus:border-[#4F7CFF] resize-none"
          />

          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-[#6B7A9A] hover:bg-[#F7FAFF] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!createNote.trim() || creating}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg, #4F7CFF 0%, #8B7FFF 100%)" }}
            >
              <Check className="h-4 w-4" />
              {creating ? "Saving…" : "Save Note"}
            </button>
          </div>
        </div>
      )}

      {/* ── Notes grid ───────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
          <div className="text-5xl">📝</div>
          <p className="text-lg font-bold text-[#1F2A44]">
            {filter === "All" ? "No notes yet" : `No ${filter} notes yet`}
          </p>
          <p className="text-sm text-[#9AA4BA] max-w-sm">
            {filter === "All"
              ? "Start an AI tutor session — your tutor will automatically take notes as you learn."
              : `Start a ${filter} session and your AI tutor will take notes for you.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(note => {
            const meta = subjectMeta[note.subject ?? ""] ?? {
              color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", emoji: "📝",
            };
            const isEditing = editingId === note.id;
            const isManual = !note.session_id;
            const isDeleting = deleteConfirm === note.id;

            return (
              <div
                key={note.id}
                className="bg-white rounded-3xl border shadow-[0_2px_12px_rgba(79,124,255,0.06)] p-5 hover:shadow-[0_4px_20px_rgba(79,124,255,0.12)] transition-all group"
                style={{ borderColor: isEditing ? "#4F7CFF66" : "#E8EDF8" }}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                    {note.subject && (
                      <span
                        className="inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 flex-shrink-0"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {meta.emoji} {note.subject}
                      </span>
                    )}
                    {note.topic && !isEditing && (
                      <span className="text-xs font-semibold text-[#6B7A9A] bg-[#F7FAFF] rounded-full px-2.5 py-1 border border-[#E8EDF8] truncate">
                        {note.topic}
                      </span>
                    )}
                  </div>

                  {!isEditing && !isDeleting && (
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(note)}
                        className="h-7 w-7 rounded-lg bg-[#F7FAFF] flex items-center justify-center text-[#9AA4BA] hover:text-[#4F7CFF] hover:bg-[#EEF3FF] transition-colors"
                        title="Edit note"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(note.id)}
                        className="h-7 w-7 rounded-lg bg-[#F7FAFF] flex items-center justify-center text-[#9AA4BA] hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete confirmation */}
                {isDeleting && (
                  <div className="mb-3 p-3 rounded-2xl bg-red-50 border border-red-100">
                    <p className="text-sm text-red-600 font-medium mb-2">Delete this note?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="flex-1 rounded-xl py-1.5 text-xs font-semibold text-[#6B7A9A] bg-white border border-[#E8EDF8] hover:bg-[#F7FAFF] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="flex-1 rounded-xl py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit topic field */}
                {isEditing && (
                  <input
                    value={editTopic}
                    onChange={e => setEditTopic(e.target.value)}
                    placeholder="Topic (optional)"
                    className="w-full rounded-xl border border-[#4F7CFF]/30 px-3 py-1.5 text-sm text-[#1F2A44] placeholder:text-[#C4CDE0] focus:outline-none focus:border-[#4F7CFF] mb-2"
                  />
                )}

                {/* Note body */}
                {isEditing ? (
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={4}
                    autoFocus
                    className="w-full rounded-xl border border-[#4F7CFF]/30 px-3 py-2 text-sm text-[#1F2A44] focus:outline-none focus:border-[#4F7CFF] resize-none"
                  />
                ) : (
                  !isDeleting && (
                    <p className="text-sm text-[#3A4560] leading-relaxed">{note.note}</p>
                  )
                )}

                {/* Card footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E8EDF8]">
                  <div className="flex items-center gap-2">
                    {isManual ? (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{ color: "#8B7FFF", backgroundColor: "#F3F0FF" }}
                      >
                        <PenLine className="h-2.5 w-2.5" /> My Note
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{ color: "#4F7CFF", backgroundColor: "#EEF3FF" }}
                      >
                        <Sparkles className="h-2.5 w-2.5" /> AI Generated
                      </span>
                    )}
                    <span className="text-[10px] text-[#C4CDE0]">{timeAgo(note.created_at)}</span>
                  </div>

                  {isEditing && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingId(null)}
                        className="rounded-lg px-3 py-1 text-xs font-medium text-[#9AA4BA] hover:bg-[#F7FAFF] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEdit(note.id)}
                        disabled={saving || !editText.trim()}
                        className="flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold text-white bg-[#4F7CFF] hover:bg-[#3D6AE8] disabled:opacity-50 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
