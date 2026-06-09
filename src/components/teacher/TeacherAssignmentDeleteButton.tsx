"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, X } from "lucide-react";

export function TeacherAssignmentDeleteButton({
  assignmentId,
  assignmentTitle,
}: {
  assignmentId: string;
  assignmentTitle: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteAssignment() {
    setDeleting(true);
    setError("");

    try {
      const res = await fetch(`/api/teacher/assignments?assignmentId=${encodeURIComponent(assignmentId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete assignment");

      setConfirming(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete assignment");
    } finally {
      setDeleting(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 p-3 md:items-end">
        <p className="max-w-xs text-xs font-semibold text-red-100">
          Delete {assignmentTitle}? This removes the assignment and student reports.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              setError("");
            }}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-60"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={deleteAssignment}
            disabled={deleting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400 disabled:opacity-60"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Delete
          </button>
        </div>
        {error && <p className="text-xs font-semibold text-red-100">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-400/20"
    >
      <Trash2 className="h-3.5 w-3.5" />
      Delete
    </button>
  );
}
