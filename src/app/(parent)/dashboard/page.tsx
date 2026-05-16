import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Flame, TrendingUp, BookOpen, FlaskConical, Pencil, Calculator, Scroll,
  MessageSquare, Clock, ChevronRight, Sparkles, Play,
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
  History: { icon: Scroll,       color: "#F97316", bg: "#FFF7ED", border: "#FED7AA" },
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
  let allSessions: unknown[] = [];
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
          .eq("student_id", student.id)
          .not("subject_id", "is", null),
      ]);
      subjectProgress  = (progressRes.data as unknown[]) ?? [];
      recentSessions   = (sessRes.data   as unknown[]) ?? [];
      allSessions      = (allSessRes.data as unknown[]) ?? [];
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
  const totalSessions       = allSessions.length;
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
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-600/20 backdrop-blur-xl border border-white/10 overflow-hidden p-6 md:p-8 shadow-2xl">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-8 -right-4 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-slate-300 text-sm font-medium">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Welcome back, {studentName}! 👋
            </h1>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-white text-sm font-bold">
                {streakDays > 0 ? `${streakDays} day streak` : "Start your streak today!"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/sessions">
                <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all">
                  <Play className="h-4 w-4 fill-current" />
                  My Chats
                </button>
              </Link>
            </div>
          </div>

          {student && (
            <div className="hidden sm:flex flex-col items-center gap-2 flex-shrink-0">
              <div className="h-24 w-24 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm overflow-hidden">
                {student.avatar_url ? (
                  <Image src={student.avatar_url} alt={student.name} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <span className="text-5xl">{student.avatar_emoji ?? "🦊"}</span>
                )}
              </div>
              <span className="text-slate-300 text-xs font-medium">{student.grade}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── STATS ROW ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Day Streak",   value: streakDays.toString(),    sub: streakDays > 0 ? "Keep going! 🔥" : "Start today",    icon: Flame,    iconBg: "bg-gradient-to-r from-orange-500 to-yellow-500", border: "border-orange-500/20", bg: "bg-orange-500/10", text: "text-orange-400" },
          { label: "AI Sessions",  value: totalSessions.toString(), sub: totalSessions > 0 ? "Sessions done" : "None yet",     icon: Sparkles, iconBg: "bg-gradient-to-r from-indigo-500 to-purple-500", border: "border-indigo-500/20", bg: "bg-indigo-500/10", text: "text-indigo-400" },
        ].map((s) => (
          <div key={s.label} className={`rounded-3xl border ${s.border} ${s.bg} backdrop-blur-xl p-5 shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-0.5 transition-all`}>
            <div className={`h-10 w-10 rounded-2xl ${s.iconBg} flex items-center justify-center shadow-lg mb-3`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div className={`text-3xl font-extrabold ${s.text} leading-none mb-1`}>{s.value}</div>
            <div className="text-sm font-semibold text-white">{s.label}</div>
            <div className="text-xs text-slate-300 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── PROFILE + AI TUTOR ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Profile card */}
        <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6">
          <h2 className="font-bold text-white text-base mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-400" /> My Profile
          </h2>
          {student ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-3xl flex-shrink-0">
                  {student.avatar_url ? (
                    <Image src={student.avatar_url} alt={student.name} width={64} height={64} className="object-cover w-full h-full" />
                  ) : (
                    student.avatar_emoji ?? "🦊"
                  )}
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{student.name}</p>
                  <p className="text-sm text-slate-300">{student.grade}</p>
                  {student.learning_style && (
                    <span className="inline-block mt-1 text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full px-2.5 py-0.5 capitalize">
                      {student.learning_style} learner
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-slate-300">Confidence level</span>
                  <span className="font-bold text-indigo-400">{student.confidence_level ?? 5}/10</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${((student.confidence_level ?? 5) / 10) * 100}%` }} />
                </div>
              </div>

              {student.interests && (
                <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-3">
                  <p className="text-xs font-semibold text-orange-400 mb-0.5">Interests</p>
                  <p className="text-sm text-white">{student.interests}</p>
                </div>
              )}

              <Link href={`/students/${student.id}/settings`}>
                <button className="w-full rounded-2xl border border-white/20 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:border-indigo-500/30 transition-all">
                  Edit Profile
                </button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <span className="text-5xl">🧒</span>
              <p className="text-sm font-semibold text-white">No profile set up yet</p>
              <p className="text-xs text-slate-300">Create a student profile to get started</p>
              <Link href="/students/new">
                <button className="mt-1 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all">
                  Create a Student
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* AI Tutor card */}
        <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white">AI Tutor</h2>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Online & ready</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 mb-5">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                  <Image src="/cosmo-logo.png" alt="BrainBuddy" width={40} height={40} className="rounded-2xl" />
                </div>
              <div>
                <p className="text-sm font-semibold text-white">Hey {studentName}! 👋</p>
                <p className="text-sm text-slate-300 leading-relaxed mt-0.5">
                  {totalSessions > 0
                    ? `You've had ${totalSessions} session${totalSessions !== 1 ? "s" : ""}. Ready to keep going?`
                    : "I'm ready to help you learn anything. Let's start!"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { emoji: "🔢", label: "Math",    color: "#4F7CFF", bg: "bg-indigo-500/20", border: "border-indigo-500/30", href: "/chat?subject=Math"    },
              { emoji: "📚", label: "Reading", color: "#22C55E", bg: "bg-green-500/20", border: "border-green-500/30", href: "/chat?subject=Reading" },
              { emoji: "🔬", label: "Science", color: "#8B7FFF", bg: "bg-purple-500/20", border: "border-purple-500/30", href: "/chat?subject=Science" },
              { emoji: "✏️", label: "Writing", color: "#FFC857", bg: "bg-yellow-500/20", border: "border-yellow-500/30", href: "/chat?subject=Writing" },
              { emoji: "📜", label: "History", color: "#F97316", bg: "bg-orange-500/20", border: "border-orange-500/30", href: "/chat?subject=History" },
            ].map((s) => (
              <Link key={s.label} href={s.href}>
                <button className={`w-full rounded-2xl py-2.5 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg ${s.bg} ${s.border} border text-white hover:bg-opacity-30`}>
                  <div className="text-xl mb-0.5">{s.emoji}</div>
                  <div className="text-xs font-semibold">{s.label}</div>
                </button>
              </Link>
            ))}
          </div>

          <Link href="/sessions">
            <button className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5 transition-all">
              <Play className="h-4 w-4 fill-current" />
              {totalSessions > 0 ? "Continue Learning" : "Start First Session"}
            </button>
          </Link>
        </div>
      </div>

      {/* ── QUIZ PROGRESS ─────────────────────────────────────────────── */}
      <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" /> Quiz Progress
          </h2>
          <Link href="/subjects" className="flex items-center gap-1 text-sm text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            View all quizes <ChevronRight className="h-4 w-4" />
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
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 bg-gradient-to-r from-indigo-500 to-purple-500">
                      <meta.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{name}</span>
                        <span className="text-xs font-bold text-indigo-400">{pct}%</span>
                      </div>
                      <span className="text-xs text-slate-300">
                        {(sp.session_count ?? 0) > 0
                          ? `${sp.session_count} session${sp.session_count !== 1 ? "s" : ""} · Level ${sp.level ?? 1}`
                          : "Not started yet"}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-white/10 overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                  {mastered > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3 w-3 text-indigo-400" />
                      <span className="text-xs font-medium text-indigo-400">
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
            <p className="text-sm font-semibold text-white">No progress yet</p>
            <p className="text-sm text-slate-300">Start an AI session to begin tracking your progress</p>
          </div>
        )}
      </div>

      

      {/* ── RECENT ACTIVITY ────────────────────────────────────────────── */}
      <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6">
        <h2 className="font-bold text-white text-lg flex items-center gap-2 mb-5">
          <Clock className="h-5 w-5 text-slate-300" /> Recent Activity
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
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 bg-indigo-500/20">
                    <MessageSquare className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {s.title ?? "AI Tutor session"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 bg-purple-500/20 text-purple-400">
                        {subName}
                      </span>
                      <span className="text-[11px] text-slate-300">{timeAgo(s.created_at)}</span>
                    </div>
                  </div>
                  <Link href={`/chat/${s.id}`}>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <span className="text-4xl">💬</span>
            <p className="text-sm font-semibold text-white">No sessions yet</p>
            <p className="text-xs text-slate-300">Your learning history will show up here</p>
            <Link href="/chat">
              <button className="mt-2 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl px-4 py-2 text-sm font-bold shadow-lg hover:shadow-purple-500/25 transition-all">
                <Sparkles className="h-4 w-4" /> Start a session
              </button>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
