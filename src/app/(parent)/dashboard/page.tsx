import Link from "next/link";
import Image from "next/image";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { StudentClassPanel } from "@/components/classes/StudentClassPanel";
import { getJoinedClassesForStudent, type JoinedClassSummary } from "@/lib/supabase/queries/classes";
import { Flame, Play, Sparkles, Zap } from "lucide-react";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select(
      "id, full_name, plan, subscription_status, messages_used, snips_used, quizzes_used, message_limit, snip_limit, quiz_limit"
    )
    .eq("user_id", user?.id ?? "")
    .maybeSingle();

  const profile = profileRaw as {
    id: string;
    full_name: string | null;
    plan?: string | null;
    subscription_status?: string | null;
    messages_used?: number | null;
    snips_used?: number | null;
    quizzes_used?: number | null;
    message_limit?: number | null;
    snip_limit?: number | null;
    quiz_limit?: number | null;
  } | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let student: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let subjectProgress: any[] = [];
  let allSessions: unknown[] = [];
  let joinedClasses: JoinedClassSummary[] = [];

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
      const [progressRes, sessionsRes, joinedClassRows] = await Promise.all([
        supabase
          .from("student_subject_progress")
          .select("streak_days")
          .eq("student_id", student.id),
        supabase
          .from("ai_sessions")
          .select("id")
          .eq("student_id", student.id)
          .not("subject_id", "is", null),
        getJoinedClassesForStudent(service, student.id).catch(() => []),
      ]);

      subjectProgress = (progressRes.data as unknown[]) ?? [];
      allSessions = (sessionsRes.data as unknown[]) ?? [];
      joinedClasses = joinedClassRows;
    }
  }

  const totalSessions = allSessions.length;
  const streakDays = subjectProgress.reduce((mx, item) => Math.max(mx, item.streak_days ?? 0), 0);
  const studentName = student?.name ?? profile?.full_name?.split(" ")[0] ?? "there";
  const isPremium = profile?.plan === "premium";
  const planLabel = isPremium ? "BrainBuddy Premium" : "Free Trial";
  const planStatus = isPremium ? "Premium active" : "Free trial active";
  const messagesUsed = profile?.messages_used ?? 0;
  const messageLimit = profile?.message_limit ?? 15;
  const snipsUsed = profile?.snips_used ?? 0;
  const snipLimit = profile?.snip_limit ?? 1;
  const quizzesUsed = profile?.quizzes_used ?? 0;
  const quizLimit = profile?.quiz_limit ?? 1;

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
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
              Welcome back, {studentName}!
            </h1>
            {streakDays > 0 && (
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5">
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="text-white text-sm font-bold">
                  {streakDays} day streak
                </span>
              </div>
            )}
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
                  <span className="text-5xl">{student.avatar_emoji ?? ""}</span>
                )}
              </div>
              <span className="text-slate-300 text-xs font-medium">{student.grade}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          {
            label: "Day Streak",
            value: streakDays.toString(),
            sub: streakDays > 0 ? "Keep going!" : "Start today",
            icon: Flame,
            iconBg: "bg-gradient-to-r from-orange-500 to-yellow-500",
            border: "border-orange-500/20",
            bg: "bg-orange-500/10",
            text: "text-orange-400",
          },
          {
            label: "AI Sessions",
            value: totalSessions.toString(),
            sub: totalSessions > 0 ? "Sessions done" : "None yet",
            icon: Sparkles,
            iconBg: "bg-gradient-to-r from-indigo-500 to-purple-500",
            border: "border-indigo-500/20",
            bg: "bg-indigo-500/10",
            text: "text-indigo-400",
          },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-3xl border ${stat.border} ${stat.bg} backdrop-blur-xl p-5 shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-0.5 transition-all`}>
            <div className={`h-10 w-10 rounded-2xl ${stat.iconBg} flex items-center justify-center shadow-lg mb-3`}>
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div className={`text-3xl font-extrabold ${stat.text} leading-none mb-1`}>{stat.value}</div>
            <div className="text-sm font-semibold text-white">{stat.label}</div>
            <div className="text-xs text-slate-300 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
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
                    student.avatar_emoji ?? ""
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
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${((student.confidence_level ?? 5) / 10) * 100}%` }}
                  />
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

        <div className="bg-[#1E293B]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">{planLabel}</p>
              <h2 className="text-2xl font-extrabold text-white">{planStatus}</h2>
            </div>
            {!isPremium && (
              <a href="/premium/checkout" className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-purple-500/20 transition-all">
                Upgrade Plan
              </a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6 text-sm text-slate-300">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Messages</p>
              <p className="mt-2 text-lg font-semibold text-white">{messagesUsed}/{messageLimit}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Homework snips</p>
              <p className="mt-2 text-lg font-semibold text-white">{snipsUsed}/{snipLimit}</p>
            </div>
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Practice quizzes</p>
              <p className="mt-2 text-lg font-semibold text-white">{quizzesUsed}/{quizLimit}</p>
            </div>
          </div>
        </div>
      </div>

      {student && <StudentClassPanel studentClasses={joinedClasses} />}
    </div>
  );
}
