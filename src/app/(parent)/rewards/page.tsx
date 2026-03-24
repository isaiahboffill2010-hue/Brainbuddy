import { createClient } from "@/lib/supabase/server";
import { Trophy, Lock, Star, Medal, PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function RewardsPage() {
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
  let homeworkCount = 0;

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

      const { count } = await supabase
        .from("homework_uploads")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId);
      homeworkCount = count ?? 0;
    }
  }

  const totalSessions = subjectProgress.reduce((sum, sp) => sum + (sp.session_count ?? 0), 0);
  const maxStreak = subjectProgress.reduce((max, sp) => Math.max(max, sp.streak_days ?? 0), 0);
  const getSubjectLevel = (name: string) =>
    subjectProgress.find((sp: any) => sp.subjects?.name === name)?.level ?? 0;

  // Define all possible badges with real progress
  const allBadges = [
    {
      name: "First Steps",
      emoji: "🎯",
      desc: "Complete your first AI session",
      category: "Milestone",
      current: Math.min(totalSessions, 1),
      goal: 1,
    },
    {
      name: "Streak Star",
      emoji: "⭐",
      desc: "Maintain a 7-day learning streak",
      category: "Consistency",
      current: Math.min(maxStreak, 7),
      goal: 7,
    },
    {
      name: "Study Buddy",
      emoji: "📖",
      desc: "Complete 5 AI sessions",
      category: "Milestone",
      current: Math.min(totalSessions, 5),
      goal: 5,
    },
    {
      name: "Homework Hero",
      emoji: "📸",
      desc: "Upload 5 homework photos",
      category: "Homework",
      current: Math.min(homeworkCount, 5),
      goal: 5,
    },
    {
      name: "Math Whiz",
      emoji: "🔢",
      desc: "Reach 70% proficiency in Math",
      category: "Mathematics",
      current: Math.min(getSubjectLevel("Math") || getSubjectLevel("Mathematics"), 7),
      goal: 7,
    },
    {
      name: "Science Pro",
      emoji: "🔬",
      desc: "Reach 70% proficiency in Science",
      category: "Science",
      current: Math.min(getSubjectLevel("Science"), 7),
      goal: 7,
    },
    {
      name: "Super Reader",
      emoji: "📚",
      desc: "Reach 70% proficiency in Reading",
      category: "Reading",
      current: Math.min(getSubjectLevel("Reading"), 7),
      goal: 7,
    },
    {
      name: "Perfect Week",
      emoji: "🏆",
      desc: "Maintain a 14-day learning streak",
      category: "Consistency",
      current: Math.min(maxStreak, 14),
      goal: 14,
    },
    {
      name: "Session Master",
      emoji: "🧠",
      desc: "Complete 20 AI sessions",
      category: "Milestone",
      current: Math.min(totalSessions, 20),
      goal: 20,
    },
  ];

  const earnedBadges = allBadges.filter((b) => b.current >= b.goal);
  const lockedBadges = allBadges.filter((b) => b.current < b.goal);
  const totalPoints = earnedBadges.length * 100;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      <div>
        <h1 className="text-2xl font-extrabold text-[#1F2A44]">Rewards</h1>
        <p className="text-sm text-[#9AA4BA] mt-0.5">
          {student ? `${student.name}'s badges and achievements` : "Earn badges by hitting learning milestones"}
        </p>
      </div>

      {/* Streak hero */}
      <div className="relative rounded-3xl overflow-hidden p-6 shadow-yellow"
        style={{ background: "linear-gradient(135deg, #FFC857 0%, #FFD97D 100%)" }}>
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="text-6xl animate-float">🔥</div>
          <div className="flex-1">
            <p className="text-white/80 text-sm font-medium">Current Streak</p>
            <p className="text-4xl font-extrabold text-white">
              {maxStreak} {maxStreak === 1 ? "Day" : "Days"}
            </p>
            <p className="text-white/80 text-sm mt-1">
              {maxStreak === 0
                ? "Start learning today to build your streak!"
                : maxStreak >= 14
                  ? "Amazing! You've earned the Perfect Week badge! 🏆"
                  : `${14 - maxStreak} more days to unlock the "Perfect Week" badge!`}
            </p>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-white/70 text-xs">Best streak</p>
            <p className="text-2xl font-extrabold text-white">{maxStreak}</p>
          </div>
        </div>
        {maxStreak < 14 && (
          <div className="relative z-10 mt-4">
            <div className="flex items-center justify-between mb-1 text-xs text-white/70">
              <span>Day {maxStreak}</span>
              <span>Day 14 — Perfect Week 🏆</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-white/30 overflow-hidden">
              <div className="h-full rounded-full bg-white"
                style={{ width: `${(maxStreak / 14) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Badges Earned", value: earnedBadges.length, icon: Trophy, color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
          { label: "Total Points",  value: totalPoints,         icon: Star,   color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
          { label: "Badges Left",   value: lockedBadges.length, icon: Medal,  color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border p-4 text-center hover:-translate-y-0.5 transition-all"
            style={{ backgroundColor: item.bg, borderColor: item.border }}>
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center mx-auto mb-2"
              style={{ backgroundColor: item.color }}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-2xl font-extrabold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs text-[#9AA4BA] mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Earned badges */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-2xl bg-[#FFF8EC] flex items-center justify-center">
            <Trophy className="h-5 w-5 text-[#FFC857]" />
          </div>
          <div>
            <h2 className="font-bold text-[#1F2A44]">Earned Badges</h2>
            <p className="text-xs text-[#9AA4BA]">{earnedBadges.length} unlocked so far</p>
          </div>
        </div>

        {earnedBadges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {earnedBadges.map((badge) => (
              <div key={badge.name}
                className="rounded-2xl bg-gradient-to-br from-[#FFF8EC] to-[#FFF0CC] border border-[#FFE5A0] p-4 flex items-center gap-4 hover:shadow-yellow hover:-translate-y-0.5 transition-all">
                <div className="text-4xl flex-shrink-0">{badge.emoji}</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1F2A44]">{badge.name}</p>
                  <p className="text-xs text-[#9AA4BA]">{badge.desc}</p>
                  <p className="text-[10px] text-[#FFC857] font-semibold mt-1">✓ Completed</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <div className="text-4xl">🎖️</div>
            <p className="text-sm font-semibold text-[#1F2A44]">No badges yet</p>
            <p className="text-xs text-[#9AA4BA]">
              {student
                ? "Start learning to earn your first badge!"
                : "Add a student to start earning badges"}
            </p>
            {!student && (
              <Link href="/students/new">
                <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-4 py-2 text-sm font-bold shadow-blue hover:opacity-90 transition-all mt-1">
                  <PlusCircle className="h-4 w-4" /> Add Student
                </button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Locked badges */}
      {lockedBadges.length > 0 && (
        <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-2xl bg-[#F7FAFF] flex items-center justify-center">
              <Lock className="h-5 w-5 text-[#9AA4BA]" />
            </div>
            <div>
              <h2 className="font-bold text-[#1F2A44]">Coming Up</h2>
              <p className="text-xs text-[#9AA4BA]">Keep going to unlock these</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lockedBadges.map((badge) => (
              <div key={badge.name} className="rounded-2xl border border-[#E8EDF8] bg-[#F7FAFF] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl opacity-40 grayscale flex-shrink-0">{badge.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#9AA4BA]">{badge.name}</p>
                    <p className="text-xs text-[#C4CDE0]">{badge.desc}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[#9AA4BA]">Progress</span>
                    <span className="text-[#9AA4BA] font-medium">{badge.current} / {badge.goal}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#E8EDF8] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-blue"
                      style={{ width: `${(badge.current / badge.goal) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
