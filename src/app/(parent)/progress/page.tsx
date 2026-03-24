import { createClient } from "@/lib/supabase/server";
import { TrendingUp, Clock, Award, Target, ChevronRight, PlusCircle } from "lucide-react";
import Link from "next/link";

const subjectMeta: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  Math:        { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
  Mathematics: { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
  Reading:     { emoji: "📚", color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0" },
  Science:     { emoji: "🔬", color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
  Writing:     { emoji: "✏️", color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diffH = Math.round((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return `${Math.round(diffH / 24)} days ago`;
}

export default async function ProgressPage() {
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

  const activeSps = subjectProgress.filter(sp => (sp.session_count ?? 0) > 0);
  const avgProgress = activeSps.length > 0
    ? Math.round(activeSps.reduce((a, sp) => a + (sp.level ?? 1) * 10, 0) / activeSps.length)
    : 0;
  const totalSessions = subjectProgress.reduce((sum, sp) => sum + (sp.session_count ?? 0), 0);
  const topicsMastered = subjectProgress.reduce((sum, sp) => sum + (sp.topics_mastered?.length ?? 0), 0);
  const activeSubjects = subjectProgress.filter(sp => (sp.session_count ?? 0) > 0).length;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1F2A44]">Progress</h1>
          <p className="text-sm text-[#9AA4BA] mt-0.5">
            {student ? `${student.name}'s learning progress` : "Track learning across all subjects"}
          </p>
        </div>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Progress", value: avgProgress > 0 ? `${avgProgress}%` : "—", icon: TrendingUp, color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
          { label: "Total Sessions",   value: totalSessions.toString(),                   icon: Clock,      color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
          { label: "Topics Mastered",  value: topicsMastered.toString(),                  icon: Award,      color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0" },
          { label: "Active Subjects",  value: activeSubjects.toString(),                  icon: Target,     color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: stat.bg, borderColor: stat.border }}>
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center mb-3 shadow-sm"
              style={{ backgroundColor: stat.color }}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-3xl font-extrabold leading-none mb-1" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-sm font-semibold text-[#1F2A44]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Subject breakdown */}
      {subjectProgress.length > 0 ? (
        <div className="space-y-4">
          {subjectProgress.map((sp: any) => {
            const name = sp.subjects?.name ?? "Unknown";
            const meta = subjectMeta[name] ?? { emoji: "📖", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" };
            const pct = (sp.session_count ?? 0) > 0 ? Math.min(100, (sp.level ?? 1) * 10) : 0;
            const mastered: string[] = sp.topics_mastered ?? [];
            const struggling: string[] = sp.topics_struggling ?? [];

            return (
              <div key={sp.id} className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6 hover:shadow-card-hover transition-all">

                <div className="flex items-center gap-4 mb-5">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: meta.bg }}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-[#1F2A44]">{name}</h2>
                      {student?.grade && (
                        <span className="text-xs text-[#9AA4BA] bg-[#F7FAFF] rounded-full px-2 py-0.5">{student.grade}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-[#9AA4BA]">
                      <span>{sp.session_count ?? 0} sessions</span>
                      <span>Last active: {timeAgo(sp.last_session_at)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-extrabold" style={{ color: meta.color }}>{pct}%</div>
                    <div className="text-xs text-[#9AA4BA]">Proficiency</div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="h-3 w-full rounded-full bg-[#F7FAFF] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                  </div>
                </div>

                {(mastered.length > 0 || struggling.length > 0) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                    {mastered.map((topic) => (
                      <div key={topic} className="rounded-2xl p-3 flex items-center justify-between"
                        style={{ backgroundColor: meta.bg }}>
                        <span className="text-xs font-semibold text-[#1F2A44]">{topic}</span>
                        <span className="text-xs font-bold text-[#22C55E] bg-white rounded-full px-2 py-0.5 ml-2 flex-shrink-0">✓</span>
                      </div>
                    ))}
                    {struggling.map((topic) => (
                      <div key={topic} className="rounded-2xl p-3 flex items-center justify-between border"
                        style={{ backgroundColor: `${meta.color}08`, borderColor: `${meta.color}25` }}>
                        <span className="text-xs font-semibold text-[#1F2A44]">{topic}</span>
                        <span className="text-xs text-[#F87171] bg-[#FEF2F2] rounded-full px-2 py-0.5 ml-2 flex-shrink-0">Needs work</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-center text-[#C4CDE0] py-3 italic">
                    No topics recorded yet — start a session to track progress
                  </p>
                )}

                <div className="flex justify-end border-t border-[#E8EDF8] pt-4">
                  <Link href={`/tutor?subject=${name.toLowerCase()}`}>
                    <button className="flex items-center gap-1 text-sm font-semibold hover:underline" style={{ color: meta.color }}>
                      Practice {name} <ChevronRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="text-5xl">📈</div>
          <p className="text-lg font-bold text-[#1F2A44]">No progress data yet</p>
          <p className="text-sm text-[#9AA4BA]">
            {student
              ? "Start an AI tutor session to begin tracking progress"
              : "Add a student to see their progress"}
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
