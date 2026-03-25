import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Flame, TrendingUp, BookOpen, FlaskConical, Pencil, Calculator,
  MessageSquare, Clock, Upload, ChevronRight, Sparkles, Play,
  Star, Zap, Trophy, Award, Target,
} from "lucide-react";

// ── badge definitions (computed from real data) ───────────────────────────
function computeBadges(
  totalSessions: number,
  homeworkCount: number,
  streakDays: number,
  subjectsActive: number,
  topicsMasteredTotal: number
) {
  return [
    { id: "first_session", label: "First Session",  emoji: "🚀", desc: "Completed your first AI session",  earned: totalSessions >= 1        },
    { id: "on_fire",       label: "On Fire",         emoji: "🔥", desc: "3-day learning streak",            earned: streakDays >= 3           },
    { id: "explorer",      label: "Explorer",        emoji: "🧭", desc: "Tried 3 or more subjects",         earned: subjectsActive >= 3       },
    { id: "hw_hero",       label: "Homework Hero",   emoji: "📸", desc: "Uploaded 5 homework photos",       earned: homeworkCount >= 5        },
    { id: "topic_master",  label: "Topic Master",    emoji: "🏆", desc: "Mastered 5 topics",               earned: topicsMasteredTotal >= 5  },
    { id: "consistent",    label: "Consistent",      emoji: "💎", desc: "7-day learning streak",            earned: streakDays >= 7           },
    { id: "power",         label: "Power Learner",   emoji: "⚡", desc: "Completed 10 AI sessions",         earned: totalSessions >= 10       },
    { id: "deep_dive",     label: "Deep Diver",      emoji: "🤿", desc: "Mastered 10 topics",              earned: topicsMasteredTotal >= 10 },
  ];
}

const subjectMeta: Record<string, { icon: typeof Calculator; color: string; bg: string; border: string }> = {
  Math:    { icon: Calculator,   color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
  Reading: { icon: BookOpen,     color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0" },
  Science: { icon: FlaskConical, color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
  Writing: { icon: Pencil,       color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
};

function timeAgo(iso: string) {
  const diffH = Math.round((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (diffH < 1)  return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return `${Math.round(diffH / 24)}d ago`;
}

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const profile = profileRaw as { id: string; full_name: string | null } | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let student: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let subjectProgress: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentSessions: any[] = [];
  let homeworkCount = 0;

  if (profile) {
    const { data: links } = await supabase
      .from("parents_students")
      .select("student_id, students(*)")
      .eq("parent_id", profile.id)
      .limit(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (links as any)?.[0]?.students;
    if (raw && !Array.isArray(raw)) student = raw;

    if (student) {
      const [progressRes, sessRes, allSessRes] = await Promise.all([
        supabase
          .from("student_subject_progress")
          .select("*, subjects(name, icon, color)")
          .eq("student_id", student.id),
        supabase
          .from("ai_sessions")
          .select("id, title, created_at, subjects(name)")
          .eq("student_id", student.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("ai_sessions")
          .select("id")
          .eq("student_id", student.id),
      ]);
      subjectProgress  = (progressRes.data as unknown[]) ?? [];
      recentSessions   = (sessRes.data   as unknown[]) ?? [];
      // Count images sent across all sessions
      const sessionIds = (allSessRes.data ?? []).map((s: { id: string }) => s.id);
      if (sessionIds.length > 0) {
        const { count } = await supabase
          .from("ai_messages")
          .select("id", { count: "exact", head: true })
          .in("session_id", sessionIds)
          .not("image_url", "is", null);
        homeworkCount = count ?? 0;
      }
    }
  }

  // ── derived stats ──────────────────────────────────────────────────────
  const totalSessions       = recentSessions.length;
  const streakDays          = subjectProgress.reduce((mx, s) => Math.max(mx, s.streak_days ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subjectsActive      = subjectProgress.filter((s: any) => (s.session_count ?? 0) > 0).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const topicsMasteredTotal = subjectProgress.reduce((n: number, s: any) => n + (s.topics_mastered?.length ?? 0), 0);
  const totalPoints         = totalSessions * 10 + topicsMasteredTotal * 25 + homeworkCount * 5;
  const badges              = computeBadges(totalSessions, homeworkCount, streakDays, subjectsActive, topicsMasteredTotal);
  const earnedBadges        = badges.filter(b => b.earned);
  const studentName         = student?.name ?? profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6 pb-10 animate-fade-in">

      {/* ── WELCOME HEADER ─────────────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-gradient-hero overflow-hidden p-6 md:p-8 shadow-blue">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-8 -right-4  h-32 w-32 rounded-full bg-white/8 pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-white/70 text-sm font-medium">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Welcome back, {studentName}! 👋
            </h1>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-4 py-1.5">
              <Flame className="h-4 w-4 text-[#FFC857]" />
              <span className="text-white text-sm font-bold">
                {streakDays > 0 ? `${streakDays} day streak` : "Start your streak today!"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/sessions">
                <button className="flex items-center gap-2 bg-white text-[#4F7CFF] rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <Play className="h-4 w-4 fill-current" />
                  My Chats
                </button>
              </Link>
            </div>
          </div>

          {student && (
            <div className="hidden sm:flex flex-col items-center gap-2 flex-shrink-0">
              <div className="h-24 w-24 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center shadow-lg animate-float overflow-hidden">
                {student.avatar_url ? (
                  <Image src={student.avatar_url} alt={student.name} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-5xl">{student.avatar_emoji ?? "🦊"}</span>
                )}
              </div>
              <span className="text-white/60 text-xs font-medium">{student.grade}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── STATS ROW ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Day Streak",   value: streakDays.toString(),    sub: streakDays > 0 ? "Keep going! 🔥" : "Start today",    icon: Flame,    iconBg: "bg-[#FFC857]", border: "border-[#FFE5A0]", bg: "bg-[#FFF8EC]", text: "text-[#F5AD2E]" },
          { label: "AI Sessions",  value: totalSessions.toString(), sub: totalSessions > 0 ? "Sessions done" : "None yet",     icon: Sparkles, iconBg: "bg-[#4F7CFF]", border: "border-[#C7D7FF]", bg: "bg-[#EEF3FF]", text: "text-[#4F7CFF]" },
          { label: "Images Sent",  value: homeworkCount.toString(), sub: "Sent in chat",                                       icon: Upload,   iconBg: "bg-[#22C55E]", border: "border-[#BBF7D0]", bg: "bg-[#EEF8F0]", text: "text-[#16A34A]" },
          { label: "Total Points", value: totalPoints.toString(),   sub: `${earnedBadges.length} badge${earnedBadges.length !== 1 ? "s" : ""} earned`, icon: Star, iconBg: "bg-[#8B7FFF]", border: "border-[#D5D0FF]", bg: "bg-[#F3F0FF]", text: "text-[#8B7FFF]" },
        ].map((s) => (
          <div key={s.label} className={`rounded-3xl border ${s.border} ${s.bg} p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all`}>
            <div className={`h-10 w-10 rounded-2xl ${s.iconBg} flex items-center justify-center shadow-md mb-3`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div className={`text-3xl font-extrabold ${s.text} leading-none mb-1`}>{s.value}</div>
            <div className="text-sm font-semibold text-[#1F2A44]">{s.label}</div>
            <div className="text-xs text-[#9AA4BA] mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── PROFILE + AI TUTOR ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Profile card */}
        <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
          <h2 className="font-bold text-[#1F2A44] text-base mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#8B7FFF]" /> My Profile
          </h2>
          {student ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F7FAFF] border border-[#E8EDF8]">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-3xl flex-shrink-0">
                  {student.avatar_url ? (
                    <Image src={student.avatar_url} alt={student.name} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    student.avatar_emoji ?? "🦊"
                  )}
                </div>
                <div>
                  <p className="font-bold text-[#1F2A44] text-lg">{student.name}</p>
                  <p className="text-sm text-[#6B7A9A]">{student.grade}</p>
                  {student.learning_style && (
                    <span className="inline-block mt-1 text-xs font-semibold bg-[#EEF3FF] text-[#4F7CFF] border border-[#C7D7FF] rounded-full px-2.5 py-0.5 capitalize">
                      {student.learning_style} learner
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-[#6B7A9A]">Confidence level</span>
                  <span className="font-bold text-[#4F7CFF]">{student.confidence_level ?? 5}/10</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-[#E8EDF8] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-blue transition-all duration-700"
                    style={{ width: `${((student.confidence_level ?? 5) / 10) * 100}%` }} />
                </div>
              </div>

              {student.interests && (
                <div className="rounded-2xl bg-[#FFF8EC] border border-[#FFE5A0] p-3">
                  <p className="text-xs font-semibold text-[#F5AD2E] mb-0.5">Interests</p>
                  <p className="text-sm text-[#1F2A44]">{student.interests}</p>
                </div>
              )}

              <Link href={`/students/${student.id}/settings`}>
                <button className="w-full rounded-2xl border border-[#E8EDF8] py-2.5 text-sm font-semibold text-[#6B7A9A] hover:bg-[#F7FAFF] hover:border-[#4F7CFF]/30 transition-all">
                  Edit Profile
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <span className="text-5xl">🧒</span>
              <p className="text-sm font-semibold text-[#1F2A44]">No profile set up yet</p>
              <p className="text-xs text-[#9AA4BA]">Your profile will appear here once created</p>
            </div>
          )}
        </div>

        {/* AI Tutor card */}
        <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-blue flex items-center justify-center shadow-blue">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[#1F2A44]">AI Tutor</h2>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse-soft" />
                <span className="text-xs text-[#22C55E] font-medium">Online & ready</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F7FAFF] border border-[#E8EDF8] p-4 mb-5">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-blue flex items-center justify-center flex-shrink-0 shadow-blue overflow-hidden">
                  <Image src="/brainbuddy-logo.png" alt="Cosmo" width={40} height={40} className="rounded-2xl" />
                </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2A44]">Hey {studentName}! 👋</p>
                <p className="text-sm text-[#6B7A9A] leading-relaxed mt-0.5">
                  {totalSessions > 0
                    ? `You've had ${totalSessions} session${totalSessions !== 1 ? "s" : ""}. Ready to keep going?`
                    : "I'm ready to help you learn anything. Let's start!"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { emoji: "🔢", label: "Math",    color: "#4F7CFF", bg: "#EEF3FF", href: "/chat?subject=Math"    },
              { emoji: "📚", label: "Reading", color: "#22C55E", bg: "#EEF8F0", href: "/chat?subject=Reading" },
              { emoji: "🔬", label: "Science", color: "#8B7FFF", bg: "#F3F0FF", href: "/chat?subject=Science" },
              { emoji: "✏️", label: "Writing", color: "#FFC857", bg: "#FFF8EC", href: "/chat?subject=Writing" },
            ].map((s) => (
              <Link key={s.label} href={s.href}>
                <button className="w-full rounded-2xl py-2.5 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: s.bg, color: s.color }}>
                  <div className="text-xl mb-0.5">{s.emoji}</div>
                  <div className="text-xs font-semibold">{s.label}</div>
                </button>
              </Link>
            ))}
          </div>

          <Link href="/sessions">
            <button className="w-full rounded-2xl bg-gradient-blue text-white py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-blue hover:opacity-90 hover:-translate-y-0.5 transition-all">
              <Play className="h-4 w-4 fill-current" />
              {totalSessions > 0 ? "Continue Learning" : "Start First Session"}
            </button>
          </Link>
        </div>
      </div>

      {/* ── SUBJECT PROGRESS ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1F2A44] text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#4F7CFF]" /> Subject Progress
          </h2>
          <Link href="/subjects" className="flex items-center gap-1 text-sm text-[#4F7CFF] font-semibold hover:underline">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {subjectProgress.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {subjectProgress.map((sp: any) => {
              const name = sp.subjects?.name ?? "Unknown";
              const meta = subjectMeta[name] ?? { icon: BookOpen, color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" };
              const pct  = (sp.session_count ?? 0) > 0 ? Math.min(100, (sp.level ?? 1) * 10) : 0;
              const mastered = sp.topics_mastered?.length ?? 0;
              return (
                <div key={sp.id}
                  className="rounded-2xl border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  style={{ borderColor: `${meta.color}30`, backgroundColor: meta.bg }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                      style={{ backgroundColor: meta.color }}>
                      <meta.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1F2A44] text-sm">{name}</span>
                        <span className="text-xs font-bold" style={{ color: meta.color }}>{pct}%</span>
                      </div>
                      <span className="text-xs text-[#9AA4BA]">
                        {(sp.session_count ?? 0) > 0
                          ? `${sp.session_count} session${sp.session_count !== 1 ? "s" : ""} · Level ${sp.level ?? 1}`
                          : "Not started yet"}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/70 overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                  </div>
                  {mastered > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3" style={{ color: meta.color }} />
                      <span className="text-xs font-medium" style={{ color: meta.color }}>
                        {mastered} topic{mastered !== 1 ? "s" : ""} mastered
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <span className="text-4xl">📊</span>
            <p className="text-sm font-semibold text-[#1F2A44]">No progress yet</p>
            <p className="text-xs text-[#9AA4BA]">Start an AI session to begin tracking your progress</p>
          </div>
        )}
      </div>

      {/* ── REWARDS ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1F2A44] text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#FFC857]" /> Rewards & Badges
          </h2>
          <div className="flex items-center gap-2 bg-[#FFF8EC] border border-[#FFE5A0] rounded-full px-3 py-1">
            <Star className="h-3.5 w-3.5 text-[#FFC857]" />
            <span className="text-sm font-bold text-[#F5AD2E]">{totalPoints} pts</span>
          </div>
        </div>

        {/* streak highlight */}
        <div className="rounded-2xl bg-gradient-to-r from-[#FFF8EC] to-[#FFF3D6] border border-[#FFE5A0] p-4 mb-5 flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-[#FFC857] flex items-center justify-center text-3xl shadow-md flex-shrink-0">
            🔥
          </div>
          <div>
            <p className="font-bold text-[#1F2A44] text-lg">{streakDays} Day Streak</p>
            <p className="text-sm text-[#9AA4BA]">
              {streakDays === 0
                ? "Learn something today to start your streak!"
                : streakDays >= 7
                  ? "Amazing! You're on fire! 🏆"
                  : `${7 - streakDays} more day${7 - streakDays !== 1 ? "s" : ""} to earn the Consistent badge!`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {badges.map((badge) => (
            <div key={badge.id}
              className={`rounded-2xl p-3 text-center transition-all ${
                badge.earned
                  ? "bg-gradient-to-br from-[#EEF3FF] to-[#F3F0FF] border border-[#C7D7FF] hover:shadow-md hover:-translate-y-0.5"
                  : "bg-[#F7FAFF] border border-[#E8EDF8] opacity-50"
              }`}>
              <div className={`text-3xl mb-1.5 ${badge.earned ? "" : "grayscale"}`}>{badge.emoji}</div>
              <p className={`text-xs font-bold ${badge.earned ? "text-[#1F2A44]" : "text-[#9AA4BA]"}`}>{badge.label}</p>
              <p className="text-[10px] text-[#9AA4BA] mt-0.5 leading-tight">{badge.desc}</p>
              {badge.earned && (
                <div className="mt-1.5 inline-flex items-center gap-1 bg-[#22C55E] text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
                  <Award className="h-2.5 w-2.5" /> Earned
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT ACTIVITY ────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
        <h2 className="font-bold text-[#1F2A44] text-lg flex items-center gap-2 mb-5">
          <Clock className="h-5 w-5 text-[#6B7A9A]" /> Recent Activity
        </h2>

        {recentSessions.length > 0 ? (
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {recentSessions.map((s: any) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const subName = (s.subjects as any)?.name ?? "General";
              const meta    = subjectMeta[subName] ?? { color: "#4F7CFF", bg: "#EEF3FF" };
              return (
                <div key={s.id}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#F7FAFF] transition-colors group">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: meta.bg }}>
                    <MessageSquare className="h-5 w-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1F2A44] truncate">
                      {s.title ?? "AI Tutor session"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold rounded-full px-2 py-0.5"
                        style={{ backgroundColor: meta.bg, color: meta.color }}>
                        {subName}
                      </span>
                      <span className="text-[11px] text-[#9AA4BA]">{timeAgo(s.created_at)}</span>
                    </div>
                  </div>
                  <Link href={`/chat/${s.id}`}>
                    <ChevronRight className="h-4 w-4 text-[#9AA4BA] group-hover:text-[#4F7CFF] transition-colors" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <span className="text-4xl">💬</span>
            <p className="text-sm font-semibold text-[#1F2A44]">No sessions yet</p>
            <p className="text-xs text-[#9AA4BA]">Your learning history will show up here</p>
            <Link href="/chat">
              <button className="mt-2 flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-4 py-2 text-sm font-bold shadow-blue hover:opacity-90 transition-all">
                <Sparkles className="h-4 w-4" /> Start a session
              </button>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
