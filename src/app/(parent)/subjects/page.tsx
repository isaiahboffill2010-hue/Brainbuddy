import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ChevronRight, Sparkles, PlusCircle } from "lucide-react";

const subjectMeta: Record<string, { emoji: string; color: string; bg: string; border: string; desc: string }> = {
  Math:        { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", desc: "Numbers, operations, fractions, geometry, and problem-solving" },
  Mathematics: { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", desc: "Numbers, operations, fractions, geometry, and problem-solving" },
  Reading:     { emoji: "📚", color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0", desc: "Comprehension, vocabulary, literary analysis, and critical thinking" },
  Science:     { emoji: "🔬", color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF", desc: "Life science, earth science, physical science, and experiments" },
  Writing:     { emoji: "✏️", color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0", desc: "Sentence structure, grammar, essays, creative writing, and editing" },
};

export default async function SubjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const profile = profileRaw as { id: string } | null;

  let student: any = null;
  let subjectProgress: any[] = [];

  if (profile) {
    const { data: links } = await supabase
      .from("parents_students")
      .select("student_id")
      .eq("parent_id", profile.id)
      .limit(1);

    const studentId = (links as any)?.[0]?.student_id;
    if (studentId) {
      const { data: studentData } = await supabase
        .from("students").select("*").eq("id", studentId).single();
      student = studentData;

      const { data: progress } = await supabase
        .from("student_subject_progress")
        .select("*, subjects(name)")
        .eq("student_id", studentId);
      subjectProgress = (progress as any[]) ?? [];
    }
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      <div>
        <h1 className="text-2xl font-extrabold text-[#1F2A44]">Subjects</h1>
        <p className="text-sm text-[#9AA4BA] mt-0.5">
          {student ? `${student.name}'s subject progress` : "All core subjects covered by BrainBuddy"}
        </p>
      </div>

      {subjectProgress.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {subjectProgress.map((sp: any) => {
            const name = sp.subjects?.name ?? "Unknown";
            const meta = subjectMeta[name] ?? { emoji: "📖", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", desc: "" };
            const pct = (sp.session_count ?? 0) > 0 ? Math.min(100, (sp.level ?? 1) * 10) : 0;
            const topics: string[] = sp.topics_mastered ?? [];

            return (
              <div key={sp.id}
                className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all">

                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ backgroundColor: meta.bg }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-bold text-[#1F2A44] text-lg">{name}</h2>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {student?.grade ?? "—"}
                      </span>
                    </div>
                    <p className="text-xs text-[#9AA4BA] mt-1 leading-relaxed">{meta.desc}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#6B7A9A] font-medium">Proficiency</span>
                    <span className="text-sm font-bold" style={{ color: meta.color }}>{pct}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#F7FAFF] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                  </div>
                </div>

                {topics.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[#9AA4BA] uppercase tracking-wider mb-2">Mastered Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topics.map((topic: string) => (
                        <span key={topic} className="text-xs font-medium rounded-full px-2.5 py-1"
                          style={{ backgroundColor: meta.bg, color: meta.color }}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {topics.length === 0 && (
                  <p className="text-xs text-[#C4CDE0] mb-4 italic">No topics mastered yet — start a session!</p>
                )}

                <div className="flex items-center gap-2 pt-3 border-t border-[#E8EDF8]">
                  <Link href={`/tutor?subject=${name.toLowerCase()}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
                      style={{ backgroundColor: meta.color }}>
                      <Sparkles className="h-4 w-4" />
                      Start Session
                    </button>
                  </Link>
                  <Link href="/notes">
                    <button className="flex items-center gap-1 rounded-2xl px-4 py-2.5 text-sm font-semibold border transition-all hover:shadow-sm"
                      style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.border }}>
                      Notes <ChevronRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="text-5xl">📚</div>
          <p className="text-lg font-bold text-[#1F2A44]">No subject data yet</p>
          <p className="text-sm text-[#9AA4BA]">
            {student
              ? "Start an AI session to begin tracking subject progress"
              : "Add a student to see their subject progress"}
          </p>
          {!student && (
            <Link href="/students/new">
              <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-blue hover:opacity-90 transition-all mt-2">
                <PlusCircle className="h-4 w-4" /> Add Student
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
