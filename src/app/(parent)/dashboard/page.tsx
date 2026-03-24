import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  Flame, CheckCircle2, TrendingUp, Star, Brain, Eye, ArrowRight,
  BookOpen, FlaskConical, Pencil, Calculator, Clock, Upload,
  MessageSquare, Award, Zap, Target, Play, Camera, BarChart3,
  ChevronRight, Sparkles, Medal, Shield, Trophy, PlusCircle,
} from "lucide-react";

export default async function ParentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get parent profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const profile = profileRaw as { id: string; full_name: string | null } | null;

  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "there";
  const firstName = fullName.split(" ")[0];

  // Get first linked student
  let student: any = null;
  let subjectProgress: any[] = [];
  let sessions: any[] = [];
  let homeworkCount = 0;

  if (profile) {
    const { data: links } = await supabase
      .from("parents_students")
      .select("student_id, students(*)")
      .eq("parent_id", profile.id)
      .limit(1);

    const raw = (links as any)?.[0]?.students;
    if (raw && !Array.isArray(raw)) student = raw;

    if (student) {
      // Subject progress
      const { data: progress } = await supabase
        .from("student_subject_progress")
        .select("*, subjects(name, icon, color)")
        .eq("student_id", student.id);
      subjectProgress = (progress as any[]) ?? [];

      // Sessions
      const { data: sess } = await supabase
        .from("ai_sessions")
        .select("id, created_at, subjects(name)")
        .eq("student_id", student.id)
        .order("created_at", { ascending: false })
        .limit(10);
      sessions = (sess as any[]) ?? [];

      // Homework uploads
      const { count } = await supabase
        .from("homework_uploads")
        .select("id", { count: "exact", head: true })
        .eq("student_id", student.id);
      homeworkCount = count ?? 0;
    }
  }

  const totalSessions = sessions.length;
  const activeSubjectProgress = subjectProgress.filter(s => (s.session_count ?? 0) > 0);
  const avgLevel = activeSubjectProgress.length > 0
    ? Math.round(activeSubjectProgress.reduce((a, s) => a + (s.level ?? 1), 0) / activeSubjectProgress.length * 10)
    : 0;
  const streakDays = subjectProgress.reduce((max, s) => Math.max(max, s.streak_days ?? 0), 0);

  // Map subject colors/icons
  const subjectMeta: Record<string, { icon: any; color: string; bg: string; border: string }> = {
    Math:    { icon: Calculator, color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
    Reading: { icon: BookOpen,   color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0" },
    Science: { icon: FlaskConical, color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
    Writing: { icon: Pencil,     color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
  };

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* ── HERO ── */}
      <div className="relative rounded-3xl bg-gradient-hero overflow-hidden p-6 md:p-8 shadow-blue">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -right-4 h-32 w-32 rounded-full bg-white/8" />
        <div className="absolute top-4 right-24 h-16 w-16 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-float inline-block">🧠</span>
              <span className="text-white/80 text-sm font-medium bg-white/15 rounded-full px-3 py-1">
                AI Tutor Active ✦
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-white/75 text-sm md:text-base max-w-md">
              {student
                ? <>{student.name} has completed <span className="text-[#FFC857] font-bold">{totalSessions} session{totalSessions !== 1 ? "s" : ""}</span> so far. Keep the momentum going!</>
                : <>Add a student profile to start tracking their learning journey.</>
              }
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {student ? (
                <>
                  <Link href="/chat">
                    <button className="flex items-center gap-2 bg-white text-[#4F7CFF] rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                      <Play className="h-4 w-4 fill-current" />
                      Start Session
                    </button>
                  </Link>
                  <Link href="/homework">
                    <button className="flex items-center gap-2 bg-white/20 text-white border border-white/30 rounded-2xl px-5 py-2.5 text-sm font-semibold hover:bg-white/30 transition-all backdrop-blur-sm">
                      <Camera className="h-4 w-4" />
                      Upload Homework
                    </button>
                  </Link>
                </>
              ) : (
                <Link href="/students/new">
                  <button className="flex items-center gap-2 bg-white text-[#4F7CFF] rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                    <PlusCircle className="h-4 w-4" />
                    Add Student
                  </button>
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center gap-2">
            <div className="h-28 w-28 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center text-6xl shadow-lg animate-float backdrop-blur-sm">
              {student?.avatar_emoji ?? "🦊"}
            </div>
            <span className="text-white/70 text-xs font-medium">
              {student ? `${student.name}'s Avatar` : "No student yet"}
            </span>
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          {
            label: "Day Streak", value: streakDays.toString(),
            sub: streakDays > 0 ? "Keep it up! 🔥" : "Start learning today!",
            icon: Flame, bg: "bg-[#FFF8EC]", iconBg: "bg-[#FFC857]",
            iconColor: "text-white", textColor: "text-[#F5AD2E]", border: "border-[#FFE5A0]",
          },
          {
            label: "Homework Done", value: homeworkCount.toString(),
            sub: "Total uploads",
            icon: CheckCircle2, bg: "bg-[#EEF8F0]", iconBg: "bg-[#22C55E]",
            iconColor: "text-white", textColor: "text-[#16A34A]", border: "border-[#BBF7D0]",
          },
          {
            label: "AI Sessions", value: totalSessions.toString(),
            sub: totalSessions > 0 ? "Sessions completed" : "None yet",
            icon: TrendingUp, bg: "bg-[#EEF3FF]", iconBg: "bg-[#4F7CFF]",
            iconColor: "text-white", textColor: "text-[#4F7CFF]", border: "border-[#C7D7FF]",
          },
          {
            label: "Avg. Level", value: avgLevel > 0 ? `${avgLevel}%` : "—",
            sub: avgLevel > 0 ? "Across all subjects" : "No data yet",
            icon: Star, bg: "bg-[#F3F0FF]", iconBg: "bg-[#8B7FFF]",
            iconColor: "text-white", textColor: "text-[#8B7FFF]", border: "border-[#D5D0FF]",
          },
        ].map((stat) => (
          <div key={stat.label}
            className={`rounded-3xl border ${stat.border} ${stat.bg} p-5 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-2xl ${stat.iconBg} flex items-center justify-center shadow-md`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className={`text-3xl font-extrabold ${stat.textColor} leading-none mb-1`}>{stat.value}</div>
            <div className="text-sm font-semibold text-[#1F2A44]">{stat.label}</div>
            <div className="text-xs text-[#9AA4BA] mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── AI TUTOR + LEARNING STYLE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* AI Tutor */}
        <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6 hover:shadow-card-hover transition-all">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-blue flex items-center justify-center shadow-blue">
              <Brain className="h-5 w-5 text-white" />
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
              <div className="h-10 w-10 rounded-2xl bg-gradient-blue flex items-center justify-center text-xl flex-shrink-0 shadow-blue">🧠</div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#1F2A44]">
                  Hey {student?.name ?? firstName}! 👋
                </p>
                <p className="text-sm text-[#6B7A9A] leading-relaxed">
                  Ready to help with <span className="text-[#4F7CFF] font-semibold">math</span>,{" "}
                  <span className="text-[#22C55E] font-semibold">reading</span>, or{" "}
                  <span className="text-[#8B7FFF] font-semibold">science</span> today?
                  {totalSessions > 0
                    ? ` You've had ${totalSessions} great session${totalSessions !== 1 ? "s" : ""} already!`
                    : " Let's start the first session!"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { emoji: "🔢", label: "Math",    color: "#4F7CFF", bg: "#EEF3FF" },
              { emoji: "📚", label: "Reading", color: "#22C55E", bg: "#EEF8F0" },
              { emoji: "🔬", label: "Science", color: "#8B7FFF", bg: "#F3F0FF" },
            ].map((s) => (
              <button key={s.label}
                className="rounded-2xl py-2 text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ backgroundColor: s.bg, color: s.color }}>
                <div className="text-xl mb-0.5">{s.emoji}</div>
                <div className="text-xs font-semibold">{s.label}</div>
              </button>
            ))}
          </div>

          <Link href="/chat">
            <button className="w-full rounded-2xl bg-gradient-blue text-white py-3 font-bold text-sm flex items-center justify-center gap-2 shadow-blue hover:opacity-90 hover:-translate-y-0.5 transition-all">
              <Sparkles className="h-4 w-4" />
              {totalSessions > 0 ? "Continue Learning" : "Start First Session"}
            </button>
          </Link>
        </div>

        {/* Student Profile / Learning Style */}
        <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6 hover:shadow-card-hover transition-all">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#F3F0FF] flex items-center justify-center">
                <Zap className="h-5 w-5 text-[#8B7FFF]" />
              </div>
              <div>
                <h2 className="font-bold text-[#1F2A44]">Student Profile</h2>
                <p className="text-xs text-[#9AA4BA]">
                  {student ? `${student.name}'s learning preferences` : "No student added yet"}
                </p>
              </div>
            </div>
            {student && (
              <span className="text-xs bg-[#F3F0FF] text-[#8B7FFF] border border-[#D5D0FF] rounded-full px-3 py-1 font-semibold capitalize">
                {student.learning_style}
              </span>
            )}
          </div>

          {student ? (
            <>
              <div className="rounded-2xl bg-[#F7FAFF] border border-[#E8EDF8] p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{student.avatar_emoji}</div>
                  <div>
                    <p className="font-semibold text-[#1F2A44]">{student.name}</p>
                    <p className="text-xs text-[#9AA4BA]">{student.grade} · Age {student.age}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="h-1.5 w-24 rounded-full bg-[#E8EDF8] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-blue"
                          style={{ width: `${(student.confidence_level / 10) * 100}%` }} />
                      </div>
                      <span className="text-xs text-[#4F7CFF] font-medium">
                        Confidence {student.confidence_level}/10
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  { icon: Eye,      label: `Learns best with ${student.learning_style} aids`,  color: "#4F7CFF", bg: "#EEF3FF" },
                  { icon: Target,   label: "Prefers step-by-step explanations",                 color: "#8B7FFF", bg: "#F3F0FF" },
                  { icon: Clock,    label: `Grade: ${student.grade}`,                           color: "#FFC857", bg: "#FFF8EC" },
                  { icon: BarChart3, label: `${totalSessions} AI sessions completed`,           color: "#22C55E", bg: "#EEF8F0" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl p-3 transition-all hover:shadow-sm"
                    style={{ backgroundColor: item.bg }}>
                    <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${item.color}20` }}>
                      <item.icon className="h-4 w-4" style={{ color: item.color }} />
                    </div>
                    <span className="text-sm font-medium text-[#1F2A44]">{item.label}</span>
                    <CheckCircle2 className="h-4 w-4 ml-auto flex-shrink-0" style={{ color: item.color }} />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
              <div className="text-5xl">🧒</div>
              <p className="text-sm font-semibold text-[#1F2A44]">No student profile yet</p>
              <p className="text-xs text-[#9AA4BA]">Add a student to see their learning style and progress here</p>
              <Link href="/students/new">
                <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-4 py-2 text-sm font-bold shadow-blue hover:opacity-90 transition-all mt-1">
                  <PlusCircle className="h-4 w-4" /> Add Student
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── SUBJECT PROGRESS ── */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6 hover:shadow-card-hover transition-all">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-[#1F2A44] text-lg">Subject Progress</h2>
            <p className="text-sm text-[#9AA4BA]">
              {student ? `${student.name}'s progress across all subjects` : "Add a student to see subject progress"}
            </p>
          </div>
          <Link href="/progress" className="flex items-center gap-1 text-sm text-[#4F7CFF] font-semibold hover:underline">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {subjectProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectProgress.map((sp: any) => {
              const name = sp.subjects?.name ?? "Unknown";
              const meta = subjectMeta[name] ?? { icon: BookOpen, color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" };
              const pct = (sp.session_count ?? 0) > 0 ? Math.min(100, (sp.level ?? 1) * 10) : 0;
              return (
                <div key={sp.id} className="rounded-2xl border p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
                  style={{ borderColor: `${meta.color}30`, backgroundColor: meta.bg }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                      style={{ backgroundColor: meta.color }}>
                      <meta.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#1F2A44] text-sm">{name}</span>
                        <span className="text-xs font-bold text-[#22C55E]">
                          {sp.session_count > 0 ? `${sp.session_count} sessions` : "Not started"}
                        </span>
                      </div>
                      <span className="text-xs text-[#9AA4BA]">Level {sp.level ?? 1}</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#6B7A9A]">Proficiency</span>
                      <span className="text-sm font-bold" style={{ color: meta.color }}>{pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/80 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: meta.color }} />
                    </div>
                  </div>
                  {sp.topics_mastered?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {sp.topics_mastered.slice(0, 3).map((t: string) => (
                        <span key={t} className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-white/70"
                          style={{ color: meta.color }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="text-4xl">📊</div>
            <p className="text-sm font-semibold text-[#1F2A44]">No progress data yet</p>
            <p className="text-xs text-[#9AA4BA]">
              {student ? "Start an AI session to begin tracking progress" : "Add a student first"}
            </p>
          </div>
        )}
      </div>

      {/* ── RECENT ACTIVITY ── */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6 hover:shadow-card-hover transition-all">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-[#1F2A44] text-lg">Recent Activity</h2>
            <p className="text-sm text-[#9AA4BA]">
              {student ? `What ${student.name} has been working on` : "No activity yet"}
            </p>
          </div>
        </div>

        {sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.slice(0, 5).map((s: any) => {
              const subName = s.subjects?.name ?? "General";
              const meta = subjectMeta[subName] ?? { color: "#4F7CFF", bg: "#EEF3FF" };
              const date = new Date(s.created_at);
              const now = new Date();
              const diffH = Math.round((now.getTime() - date.getTime()) / 3600000);
              const timeStr = diffH < 1 ? "Just now" : diffH < 24 ? `${diffH}h ago` : diffH < 48 ? "Yesterday" : `${Math.round(diffH/24)} days ago`;
              return (
                <div key={s.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-[#F7FAFF] transition-colors">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: meta.bg }}>
                    <MessageSquare className="h-5 w-5" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1F2A44]">AI Tutor session</p>
                      <span className="text-[11px] text-[#9AA4BA] flex-shrink-0">{timeStr}</span>
                    </div>
                    <span className="inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 mt-1"
                      style={{ backgroundColor: meta.bg, color: meta.color }}>{subName}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="text-4xl">💬</div>
            <p className="text-sm font-semibold text-[#1F2A44]">No sessions yet</p>
            <p className="text-xs text-[#9AA4BA]">
              {student ? "Start an AI tutor session to see activity here" : "Add a student to get started"}
            </p>
          </div>
        )}
      </div>

      {/* ── PARENT SUMMARY ── */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6 hover:shadow-card-hover transition-all">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-[#EEF3FF] flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#4F7CFF]" />
          </div>
          <div>
            <h2 className="font-bold text-[#1F2A44] text-lg">Parent Summary</h2>
            <p className="text-sm text-[#9AA4BA]">
              {student ? `${student.name}'s learning overview` : "Add a student to see their summary"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "AI Sessions",      value: totalSessions.toString(), sub: "Total completed",       emoji: "🧠", color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF" },
            { label: "Homework Uploads", value: homeworkCount.toString(), sub: "Photos submitted",       emoji: "📸", color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0" },
            { label: "Current Grade",    value: student?.grade ?? "—",    sub: student?.name ?? "No student", emoji: "🎓", color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF" },
            { label: "Learning Style",   value: student?.learning_style ? student.learning_style.charAt(0).toUpperCase() + student.learning_style.slice(1) : "—",
              sub: "Preferred style", emoji: "💡", color: "#FFC857", bg: "#FFF8EC", border: "#FFE5A0" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border p-4 text-center hover:-translate-y-0.5 hover:shadow-md transition-all"
              style={{ backgroundColor: item.bg, borderColor: item.border }}>
              <div className="text-3xl mb-2">{item.emoji}</div>
              <div className="text-xl font-extrabold mb-0.5" style={{ color: item.color }}>{item.value}</div>
              <div className="text-sm font-semibold text-[#1F2A44]">{item.label}</div>
              <div className="text-xs text-[#9AA4BA] mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
