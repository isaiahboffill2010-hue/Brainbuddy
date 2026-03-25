import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries/profiles";
import { Camera, TrendingUp, Sparkles } from "lucide-react";

const SUBJECTS = [
  { name: "Math", icon: "🔢", color: "#6366f1", glow: "shadow-[0_0_16px_rgba(99,102,241,0.3)]", border: "border-indigo-500/25", bg: "from-indigo-500/15 to-violet-500/5", desc: "Numbers & shapes" },
  { name: "Reading", icon: "📚", color: "#3b82f6", glow: "shadow-[0_0_16px_rgba(59,130,246,0.3)]", border: "border-blue-500/25", bg: "from-blue-500/15 to-cyan-500/5", desc: "Stories & comprehension" },
  { name: "Science", icon: "🔬", color: "#8b5cf6", glow: "shadow-[0_0_16px_rgba(139,92,246,0.3)]", border: "border-violet-500/25", bg: "from-violet-500/15 to-purple-500/5", desc: "How the world works" },
  { name: "Writing", icon: "✏️", color: "#6366f1", glow: "shadow-[0_0_16px_rgba(99,102,241,0.3)]", border: "border-indigo-500/25", bg: "from-indigo-500/15 to-blue-500/5", desc: "Essays & creativity" },
];

export default async function StudentHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let name = "friend";
  try {
    const profile = await getProfile(supabase, user.id);
    if (profile) name = profile.full_name?.split(" ")[0] ?? "friend";
  } catch { /* ok */ }

  return (
    <div className="space-y-8 pb-4">
      {/* Welcome hero */}
      <div className="relative rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-accent/10 border border-primary/15 p-6 text-center space-y-4 overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-20 pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="text-6xl animate-float inline-block">🧠</div>
          <div>
            <h1 className="text-2xl font-bold">Hey, {name}! <span className="animate-pulse">✨</span></h1>
            <p className="text-sm text-muted-foreground mt-1">
              What do you want to learn today?
            </p>
          </div>
        </div>
      </div>

      {/* Subject grid */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">Pick a subject</h2>
        <div className="grid grid-cols-2 gap-3">
          {SUBJECTS.map((subject) => (
            <Link key={subject.name} href={`/chat?subject=${subject.name}`}>
              <div className={`glass-bright rounded-2xl border ${subject.border} bg-gradient-to-br ${subject.bg} p-4 flex flex-col items-center text-center gap-3 cursor-pointer hover:scale-[1.02] transition-all ${subject.glow} hover:${subject.glow}`}>
                <div className="text-4xl">{subject.icon}</div>
                <div>
                  <div className="font-semibold text-sm">{subject.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{subject.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/upload">
            <div className="glass-bright rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 p-4 flex items-center gap-3 cursor-pointer hover:border-blue-500/40 transition-all hover:scale-[1.02]">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <Camera className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">Upload homework</div>
                <div className="text-xs text-muted-foreground">Take a photo</div>
              </div>
            </div>
          </Link>
          <Link href="/progress">
            <div className="glass-bright rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-purple-500/5 p-4 flex items-center gap-3 cursor-pointer hover:border-violet-500/40 transition-all hover:scale-[1.02]">
              <div className="h-10 w-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <div className="font-semibold text-sm">My progress</div>
                <div className="text-xs text-muted-foreground">See how I&apos;m doing</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
