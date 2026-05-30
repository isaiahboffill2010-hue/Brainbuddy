"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { GraduationCap, Loader2, Pencil, RefreshCw, Save, X } from "lucide-react";
import { ClassCodeCopyButton } from "@/components/teacher/ClassCodeCopyButton";
import type { TeacherClassWithStudents } from "@/lib/supabase/queries/classes";

export function TeacherClassList({ initialClasses }: { initialClasses: TeacherClassWithStudents[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    currentUnit: "",
    learningGoal: "",
    brainbuddyInstructions: "",
  });

  const refreshClasses = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/teacher/classes", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setClasses(data);
      setRefreshError(null);
    } catch {
      setRefreshError("Could not refresh classes. Try again in a moment.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(refreshClasses, 10000);
    return () => window.clearInterval(interval);
  }, [refreshClasses]);

  function startEdit(item: TeacherClassWithStudents) {
    setEditingId(item.id);
    setEditError(null);
    setDraft({
      currentUnit: item.currentUnit ?? "",
      learningGoal: item.learningGoal ?? "",
      brainbuddyInstructions: item.brainbuddyInstructions ?? "",
    });
  }

  async function saveLearningFocus(classId: string) {
    setSavingId(classId);
    setEditError(null);

    try {
      const res = await fetch("/api/teacher/classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, ...draft }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error ?? "Could not update class learning focus");
      }

      await refreshClasses();
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Could not update class learning focus");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#1E293B]/80 p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Your Classes</h2>
          <p className="text-sm text-slate-400">Share a code so students can join.</p>
        </div>
        <button
          type="button"
          onClick={refreshClasses}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
        >
          {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>
      {refreshError && <p className="mb-4 text-sm text-amber-200">{refreshError}</p>}

      {classes.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 text-center p-6">
          <GraduationCap className="h-10 w-10 text-indigo-300" />
          <p className="mt-3 font-semibold text-white">No classes yet</p>
          <p className="mt-1 text-sm text-slate-400">Create your first class to get a student join code.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((item) => {
            const classLabel = item.period || item.className;

            return (
            <article key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.subjectIcon ?? "?"}</span>
                    <h3 className="font-bold text-white truncate">{classLabel}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {[item.gradeLevel, item.subjectName].filter(Boolean).join(" - ") || "Class details"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <ClassCodeCopyButton code={item.classCode} />
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit learning
                  </button>
                </div>
              </div>

              {editingId === item.id ? (
                <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-200">
                      Current unit/topic
                      <input
                        value={draft.currentUnit}
                        onChange={(e) => setDraft((prev) => ({ ...prev, currentUnit: e.target.value }))}
                        placeholder="Example: Fractions"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-200">
                      What students are learning
                      <input
                        value={draft.learningGoal}
                        onChange={(e) => setDraft((prev) => ({ ...prev, learningGoal: e.target.value }))}
                        placeholder="Example: Adding fractions with unlike denominators"
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
                      />
                    </label>
                    <label className="text-sm font-semibold text-slate-200 md:col-span-2">
                      BrainBuddy focus/instructions
                      <textarea
                        value={draft.brainbuddyInstructions}
                        onChange={(e) => setDraft((prev) => ({ ...prev, brainbuddyInstructions: e.target.value }))}
                        rows={3}
                        placeholder="Example: Teach step by step and give hints before final answers."
                        className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
                      />
                    </label>
                  </div>
                  {editError && <p className="mt-3 text-sm text-red-300">{editError}</p>}
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveLearningFocus(item.id)}
                      disabled={savingId === item.id}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {savingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save update
                    </button>
                  </div>
                </div>
              ) : (item.currentUnit || item.learningGoal || item.brainbuddyInstructions) ? (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {item.currentUnit && (
                    <div className="rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-indigo-300">Topic</p>
                      <p className="mt-1 text-sm font-semibold text-white">{item.currentUnit}</p>
                    </div>
                  )}
                  {item.learningGoal && (
                    <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Learning</p>
                      <p className="mt-1 text-sm text-white">{item.learningGoal}</p>
                    </div>
                  )}
                  {item.brainbuddyInstructions && (
                    <div className="rounded-2xl bg-purple-500/10 border border-purple-500/20 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-purple-300">Focus</p>
                      <p className="mt-1 text-sm text-white">{item.brainbuddyInstructions}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
                  No learning focus set yet. Use Edit learning to tell students what to focus on today.
                </p>
              )}

              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Students</p>
                  <span className="text-xs text-slate-400">{item.studentCount} joined</span>
                </div>
                {item.students.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No students have joined this class yet.</p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {item.students.map((student) => (
                      <div key={student.id} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center overflow-hidden">
                          {student.avatarUrl ? (
                            <Image src={student.avatarUrl} alt={student.name} width={36} height={36} className="h-full w-full object-cover" />
                          ) : (
                            <span>{student.avatarEmoji}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.grade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
          })}
        </div>
      )}
    </section>
  );
}
