"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Loader2, School, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JoinedClassSummary } from "@/lib/supabase/queries/classes";

function periodNumber(period: string | null) {
  const match = period?.match(/\d+/);
  return match ? Number(match[0]) : 99;
}

type StudentClassPanelProps = {
  studentClasses?: JoinedClassSummary[];
  studentClass?: JoinedClassSummary | null;
};

export function StudentClassPanel({ studentClasses, studentClass }: StudentClassPanelProps) {
  const initialClasses = useMemo(() => {
    if (Array.isArray(studentClasses)) return studentClasses;
    return studentClass ? [studentClass] : [];
  }, [studentClasses, studentClass]);
  const [liveClasses, setLiveClasses] = useState(initialClasses);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const refreshClasses = useCallback(async () => {
    try {
      const res = await fetch("/api/classes/current?all=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setLiveClasses(Array.isArray(data) ? data : []);
    } catch {
      // Keep the current cards if a background refresh fails.
    }
  }, []);

  useEffect(() => {
    setLiveClasses(initialClasses);
  }, [initialClasses]);

  useEffect(() => {
    setHydrated(true);
    refreshClasses();
    const interval = window.setInterval(refreshClasses, 15000);
    return () => window.clearInterval(interval);
  }, [refreshClasses]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not join class");
      }

      setCode("");
      await refreshClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join class");
    } finally {
      setLoading(false);
    }
  }

  const sortedClasses = [...liveClasses].sort((a, b) => periodNumber(a.period) - periodNumber(b.period));

  return (
    <section className="rounded-3xl border border-white/10 bg-[#1E293B]/80 p-5 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
          <School className="h-5 w-5 text-indigo-300" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Join a class</h2>
          <p className="text-sm text-slate-400">
            Enter your teacher's class code to see what your class is learning.
          </p>
        </div>
      </div>

      <form onSubmit={handleJoin} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Class code"
          className="bg-white/5 border-white/10 text-white"
        />
        <Button type="submit" disabled={loading || !code.trim()} className="rounded-xl bg-gradient-brand border-0">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}

      {hydrated && (sortedClasses.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-3 text-sm text-slate-400">
          No classes joined yet. Add a class code when your teacher gives you one.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {sortedClasses.map((studentClass) => {
            const classLabel = studentClass.period || studentClass.className;
            const isExpanded = expandedClassId === studentClass.id;

            return (
              <div key={studentClass.id} className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 overflow-hidden">
                <button
                  onClick={() => setExpandedClassId(isExpanded ? null : studentClass.id)}
                  className="w-full flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-cyan-500/20 transition-colors"
                >
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                      {classLabel}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-white">
                      You are learning: {studentClass.currentUnit || studentClass.subjectName || "Your class topic"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-300">
                      {[studentClass.gradeLevel, studentClass.subjectName].filter(Boolean).join(" - ") || "Class focus"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-cyan-100">
                      {studentClass.classCode}
                    </span>
                    <ChevronDown 
                      className={`h-5 w-5 text-cyan-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-cyan-500/20 px-4 py-3 bg-cyan-500/5">
                    <div className="grid gap-3 md:grid-cols-2">
                      {studentClass.learningGoal && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                            <BookOpen className="h-3.5 w-3.5" /> Teacher focus
                          </p>
                          <p className="mt-1 text-sm text-white">{studentClass.learningGoal}</p>
                        </div>
                      )}
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-purple-200">
                          <Sparkles className="h-3.5 w-3.5" /> BrainBuddy
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {studentClass.brainbuddyInstructions || "BrainBuddy will help you study this topic step by step."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
