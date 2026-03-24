import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Camera, Upload, Clock, CheckCircle2, BookOpen, ChevronRight, Sparkles, AlertCircle } from "lucide-react";

const subjectMeta: Record<string, { emoji: string; color: string; bg: string }> = {
  Math:        { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF" },
  Mathematics: { emoji: "🔢", color: "#4F7CFF", bg: "#EEF3FF" },
  Reading:     { emoji: "📚", color: "#22C55E", bg: "#EEF8F0" },
  Science:     { emoji: "🔬", color: "#8B7FFF", bg: "#F3F0FF" },
  Writing:     { emoji: "✏️", color: "#FFC857", bg: "#FFF8EC" },
};

function timeAgo(dateStr: string): string {
  const diffH = Math.round((Date.now() - new Date(dateStr).getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  if (diffH < 48) return "Yesterday";
  return `${Math.round(diffH / 24)} days ago`;
}

export default async function HomeworkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const profile = profileRaw as { id: string } | null;

  let uploads: any[] = [];

  if (profile) {
    const { data: links } = await supabase
      .from("parents_students")
      .select("student_id")
      .eq("parent_id", profile.id)
      .limit(1);

    const studentId = (links as any)?.[0]?.student_id;
    if (studentId) {
      const { data } = await supabase
        .from("homework_uploads")
        .select("*, subjects(name)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);
      uploads = (data as any[]) ?? [];
    }
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1F2A44]">Homework Help</h1>
          <p className="text-sm text-[#9AA4BA] mt-0.5">Upload a photo of any problem and get step-by-step help</p>
        </div>
      </div>

      {/* Upload card */}
      <div className="relative rounded-3xl bg-gradient-hero overflow-hidden p-8 shadow-blue">
        <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 right-8 h-32 w-32 rounded-full bg-white/8" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#FFC857]" />
              <span className="text-white/80 text-sm font-medium">AI-Powered Homework Helper</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white">Snap a photo, get answers</h2>
            <p className="text-white/70 text-sm max-w-md">
              Take a photo of any homework question. BrainBuddy will read it and explain step-by-step in a way your child understands.
            </p>
            <div className="flex gap-3 pt-1">
              <Link href="/upload">
                <button className="flex items-center gap-2 bg-white text-[#4F7CFF] rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <Camera className="h-4 w-4" />
                  Upload Photo
                </button>
              </Link>
              <Link href="/tutor">
                <button className="flex items-center gap-2 bg-white/20 text-white border border-white/30 rounded-2xl px-5 py-2.5 text-sm font-semibold hover:bg-white/30 transition-all">
                  <BookOpen className="h-4 w-4" />
                  Type a Question
                </button>
              </Link>
            </div>
          </div>
          <div className="hidden md:flex h-28 w-28 rounded-3xl bg-white/15 border border-white/25 items-center justify-center text-6xl shadow-lg animate-float backdrop-blur-sm flex-shrink-0">
            📸
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { step: "1", icon: Camera,       title: "Take a photo",      desc: "Snap any homework question or problem",                   color: "#4F7CFF", bg: "#EEF3FF" },
          { step: "2", icon: Sparkles,     title: "AI reads it",       desc: "BrainBuddy identifies the subject and problem",           color: "#8B7FFF", bg: "#F3F0FF" },
          { step: "3", icon: CheckCircle2, title: "Step-by-step help", desc: "Get a clear explanation tailored to your child",          color: "#22C55E", bg: "#EEF8F0" },
        ].map((item) => (
          <div key={item.step} className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
              <item.icon className="h-5 w-5" style={{ color: item.color }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: item.color }}>Step {item.step}</p>
              <p className="text-sm font-semibold text-[#1F2A44]">{item.title}</p>
              <p className="text-xs text-[#9AA4BA] mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent uploads */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-[#1F2A44] text-lg">Recent Uploads</h2>
            <p className="text-sm text-[#9AA4BA]">Previously solved homework</p>
          </div>
        </div>

        {uploads.length > 0 ? (
          <>
            <div className="space-y-3">
              {uploads.map((item: any) => {
                const subName = (item.subjects as any)?.name ?? "General";
                const meta = subjectMeta[subName] ?? { emoji: "📄", color: "#4F7CFF", bg: "#EEF3FF" };
                const statusColor = item.status === "processed" ? "#22C55E" : item.status === "error" ? "#F87171" : "#FFC857";
                const statusBg   = item.status === "processed" ? "#EEF8F0"  : item.status === "error" ? "#FEF2F2"  : "#FFF8EC";
                const statusLabel = item.status === "processed" ? "Solved" : item.status === "error" ? "Error" : "Pending";
                const StatusIcon  = item.status === "error" ? AlertCircle : item.status === "processed" ? CheckCircle2 : Clock;

                return (
                  <div key={item.id}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#F7FAFF] transition-colors cursor-pointer group">
                    <div className="h-10 w-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: meta.bg }}>
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1F2A44]">{subName}</p>
                      <p className="text-xs text-[#9AA4BA]">
                        {item.question_text
                          ? item.question_text.slice(0, 60) + (item.question_text.length > 60 ? "…" : "")
                          : "Homework photo"}{" "}
                        · {timeAgo(item.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1"
                        style={{ color: statusColor, backgroundColor: statusBg }}>
                        <StatusIcon className="h-3 w-3" /> {statusLabel}
                      </span>
                      <ChevronRight className="h-4 w-4 text-[#C4CDE0] group-hover:text-[#4F7CFF] transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-[#E8EDF8] text-center">
              <Link href="/upload">
                <button className="flex items-center gap-2 mx-auto text-sm font-semibold text-[#4F7CFF] hover:underline">
                  <Upload className="h-4 w-4" /> Upload new homework
                </button>
              </Link>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <div className="text-4xl">📭</div>
            <p className="text-sm font-semibold text-[#1F2A44]">No uploads yet</p>
            <p className="text-xs text-[#9AA4BA]">Upload your first homework photo to get AI-powered help</p>
            <Link href="/upload">
              <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-blue hover:opacity-90 transition-all mt-1">
                <Camera className="h-4 w-4" /> Upload Photo
              </button>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
