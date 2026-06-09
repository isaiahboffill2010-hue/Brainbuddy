"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  FilePlus2,
  FileText,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ClassCodeCopyButton } from "@/components/teacher/ClassCodeCopyButton";
import type { TeacherClassWithStudents } from "@/lib/supabase/queries/classes";

const emptyAssignmentDraft = {
  title: "",
  dueDate: "",
  totalPoints: "",
  studentInstructions: "",
  brainbuddyNote: "",
};

function createAssignmentDraft() {
  return { ...emptyAssignmentDraft };
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function TeacherClassList({ initialClasses }: { initialClasses: TeacherClassWithStudents[] }) {
  const [classes, setClasses] = useState(initialClasses);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [draft, setDraft] = useState({
    currentUnit: "",
    learningGoal: "",
    brainbuddyInstructions: "",
  });
  const [assignmentClass, setAssignmentClass] = useState<TeacherClassWithStudents | null>(null);
  const [assignmentDraft, setAssignmentDraft] = useState(emptyAssignmentDraft);
  const [assignmentStatus, setAssignmentStatus] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentSaving, setAssignmentSaving] = useState<"draft" | "assigned" | null>(null);
  const [worksheetUploadOpen, setWorksheetUploadOpen] = useState(false);
  const [worksheetFiles, setWorksheetFiles] = useState<File[]>([]);

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
    setConfirmDeleteId(null);
    setDraft({
      currentUnit: item.currentUnit ?? "",
      learningGoal: item.learningGoal ?? "",
      brainbuddyInstructions: item.brainbuddyInstructions ?? "",
    });
  }

  function startAssignment(item: TeacherClassWithStudents) {
    setAssignmentClass(item);
    setConfirmDeleteId(null);
    setAssignmentDraft(createAssignmentDraft());
    setAssignmentStatus(null);
    setAssignmentError(null);
    setWorksheetUploadOpen(false);
    setWorksheetFiles([]);
  }

  function closeAssignmentModal() {
    setAssignmentClass(null);
    setAssignmentDraft(createAssignmentDraft());
    setAssignmentStatus(null);
    setAssignmentError(null);
    setAssignmentSaving(null);
    setWorksheetUploadOpen(false);
    setWorksheetFiles([]);
  }

  function addWorksheetFiles(files: FileList | null) {
    const nextFiles = Array.from(files ?? []);
    if (nextFiles.length === 0) return;
    setWorksheetFiles((prev) => [...prev, ...nextFiles]);
  }

  function removeWorksheetFile(indexToRemove: number) {
    setWorksheetFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }

  function validateAssignmentDraft() {
    if (!assignmentDraft.title.trim()) return "Assignment title is required.";
    if (!assignmentDraft.totalPoints.trim()) return "Number of questions is required.";
    const questionCount = Number(assignmentDraft.totalPoints);
    if (!Number.isInteger(questionCount) || questionCount < 1) {
      return "Number of questions must be a whole number greater than 0.";
    }

    return null;
  }

  async function submitAssignment(status: "draft" | "assigned") {
    if (!assignmentClass) return;
    const validationError = validateAssignmentDraft();
    if (validationError) {
      setAssignmentError(validationError);
      setAssignmentStatus(null);
      return;
    }

    setAssignmentSaving(status);
    setAssignmentError(null);
    setAssignmentStatus(null);

    try {
      const body = new FormData();
      body.append("classId", assignmentClass.id);
      body.append("title", assignmentDraft.title);
      body.append("subject", assignmentClass.subjectName || "General");
      body.append("dueDate", assignmentDraft.dueDate || "");
      body.append("totalPoints", assignmentDraft.totalPoints || "");
      body.append("instructions", assignmentDraft.studentInstructions);
      body.append("teacherNote", assignmentDraft.brainbuddyNote);
      body.append("status", status);
      worksheetFiles.forEach((file) => body.append("worksheets", file));

      const res = await fetch("/api/teacher/assignments", {
        method: "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error ?? "Could not save assignment");

      setAssignmentStatus(
        status === "draft"
          ? "Draft saved."
          : `Assigned to class${data.assignedStudents ? ` for ${data.assignedStudents} student${data.assignedStudents === 1 ? "" : "s"}` : ""}.`
      );
    } catch (err) {
      setAssignmentError(err instanceof Error ? err.message : "Could not save assignment");
    } finally {
      setAssignmentSaving(null);
    }
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

  async function deleteClass(item: TeacherClassWithStudents) {
    if (confirmDeleteId !== item.id) {
      setConfirmDeleteId(item.id);
      setDeleteError(null);
      return;
    }

    setDeletingId(item.id);
    setDeleteError(null);

    try {
      const res = await fetch("/api/teacher/classes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId: item.id }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error ?? "Could not delete class");

      setClasses((prev) => prev.filter((classItem) => classItem.id !== item.id));
      setConfirmDeleteId(null);
      if (editingId === item.id) setEditingId(null);
      if (assignmentClass?.id === item.id) closeAssignmentModal();
      await refreshClasses();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Could not delete class");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
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
      {deleteError && <p className="mb-4 text-sm text-red-300">{deleteError}</p>}

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
                    onClick={() => startAssignment(item)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  >
                    <FilePlus2 className="h-3.5 w-3.5" />
                    Add Assignment
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit learning
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteClass(item)}
                    disabled={deletingId === item.id}
                    className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold disabled:opacity-60 ${
                      confirmDeleteId === item.id
                        ? "border-red-400/30 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                        : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    {confirmDeleteId === item.id ? "Confirm delete" : "Delete"}
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
    {assignmentClass && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
        <div className="max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#1E293B] p-5 shadow-2xl">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Add Assignment</p>
              <h3 className="mt-1 text-xl font-extrabold text-white">
                Add Assignment for {assignmentClass.period || assignmentClass.className}
              </h3>
            </div>
            <button
              type="button"
              onClick={closeAssignmentModal}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              aria-label="Close add assignment"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-200 md:col-span-2">
              Assignment title
              <input
                value={assignmentDraft.title}
                onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, title: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Due date
              <input
                type="date"
                value={assignmentDraft.dueDate}
                onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              How many questions are in the assignment?
              <input
                type="number"
                min={1}
                step={1}
                placeholder="20"
                value={assignmentDraft.totalPoints}
                onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, totalPoints: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200 md:col-span-2">
              Student instructions
              <textarea
                value={assignmentDraft.studentInstructions}
                onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, studentInstructions: e.target.value }))}
                rows={4}
                className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200 md:col-span-2">
              Teacher note for BrainBuddy
              <textarea
                value={assignmentDraft.brainbuddyNote}
                onChange={(e) => setAssignmentDraft((prev) => ({ ...prev, brainbuddyNote: e.target.value }))}
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/60"
              />
            </label>
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setWorksheetUploadOpen((isOpen) => !isOpen)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-bold text-white hover:bg-white/10"
            >
              <span className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4 text-cyan-300" />
                Upload worksheet
                {worksheetFiles.length > 0 && (
                  <span className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-semibold text-cyan-200">
                    {worksheetFiles.length}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-slate-300 transition-transform ${worksheetUploadOpen ? "rotate-180" : ""}`}
              />
            </button>

            {worksheetUploadOpen && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                {worksheetFiles.length === 0 ? (
                  <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-cyan-300/40 bg-[#0B1220] text-center hover:border-cyan-300 hover:bg-cyan-400/5">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        addWorksheetFiles(e.currentTarget.files);
                        e.currentTarget.value = "";
                      }}
                    />
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/10">
                      <Plus className="h-6 w-6 text-cyan-200" />
                    </span>
                    <span className="text-sm font-bold text-white">Add first worksheet</span>
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {worksheetFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${file.size}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B1220] p-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-200">
                              <FileText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                Worksheet {index + 1}: {file.name}
                              </p>
                              <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeWorksheetFile(index)}
                            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                            aria-label={`Remove ${file.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          addWorksheetFiles(e.currentTarget.files);
                          e.currentTarget.value = "";
                        }}
                      />
                      <Plus className="h-3.5 w-3.5" />
                      Add another worksheet
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {assignmentError && <p className="mt-3 text-sm text-red-300">{assignmentError}</p>}
          {assignmentStatus && <p className="mt-3 text-sm text-cyan-200">{assignmentStatus}</p>}

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={closeAssignmentModal}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => submitAssignment("draft")}
              disabled={assignmentSaving !== null}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
            >
              {assignmentSaving === "draft" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => submitAssignment("assigned")}
              disabled={assignmentSaving !== null}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {assignmentSaving === "assigned" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
              Assign to Class
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
