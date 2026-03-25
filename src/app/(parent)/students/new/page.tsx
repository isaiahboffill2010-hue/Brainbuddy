"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { StudentForm } from "@/components/students/student-form";
import { Brain, Sparkles, Target, Zap } from "lucide-react";

export default function NewStudentPage() {
  const router = useRouter();

  async function handleCreate(data: {
    name: string;
    age: number;
    grade: string;
    avatar_emoji: string;
    learning_style: "visual" | "auditory" | "kinesthetic" | "reading";
    confidence_level: number;
    interests?: string;
    personality?: string;
    struggles_with?: string;
    learning_description?: string;
    avatarFile?: File;
  }) {
    const { avatarFile, ...rest } = data;
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to create student");
    }
    const student = await res.json();

    // Upload avatar photo if one was selected
    if (avatarFile && student.id) {
      const fd = new FormData();
      fd.append("file", avatarFile);
      await fetch(`/api/students/${student.id}/avatar`, { method: "POST", body: fd });
    }

    router.push("/dashboard");
  }

  return (
    <div className="max-w-2xl mx-auto pb-12 animate-fade-in">

      {/* ── Hero intro ── */}
      <div className="relative rounded-3xl bg-gradient-hero overflow-hidden p-7 mb-8 shadow-blue">
        <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-6 -left-4 h-28 w-28 rounded-full bg-white/8 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-5">
          <div className="h-16 w-16 rounded-3xl bg-white/15 border border-white/25 flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
            <Image src="/cosmo-logo.png" alt="BrainBuddy" width={48} height={48} className="rounded-2xl" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3.5 w-3.5 text-[#FFC857]" />
              <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Learning Profile Setup</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              BrainBuddy knows how you learn
            </h1>
            <p className="text-white/70 text-sm mt-1 leading-relaxed">
              This profile tells the AI exactly how to teach — so every session feels made just for you.
            </p>
          </div>
        </div>
      </div>

      {/* ── Feature pills ── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: Brain,    color: "#4F7CFF", bg: "#EEF3FF", border: "#C7D7FF", title: "AI-Powered",      desc: "The AI reads your profile before every session" },
          { icon: Target,   color: "#8B7FFF", bg: "#F3F0FF", border: "#D5D0FF", title: "Personalized",    desc: "Questions and explanations matched to how you think" },
          { icon: Sparkles, color: "#22C55E", bg: "#EEF8F0", border: "#BBF7D0", title: "Adaptive",        desc: "BrainBuddy adjusts as you grow and improve" },
        ].map(({ icon: Icon, color, bg, border, title, desc }) => (
          <div key={title} className="rounded-2xl border p-4 text-center" style={{ backgroundColor: bg, borderColor: border }}>
            <div className="h-9 w-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: color }}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold text-[#1F2A44]">{title}</p>
            <p className="text-[11px] text-[#9AA4BA] mt-0.5 leading-snug">{desc}</p>
          </div>
        ))}
      </div>

      {/* ── Info banner ── */}
      <div className="rounded-2xl bg-[#FFF8EC] border border-[#FFE5A0] px-5 py-4 mb-8 flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">💡</span>
        <div>
          <p className="text-sm font-bold text-[#1F2A44]">This is how you learn</p>
          <p className="text-xs text-[#6B7A9A] mt-0.5 leading-relaxed">
            Every answer you fill in below is sent directly to the AI. BrainBuddy uses this to choose the right words,
            the right examples, and the right pace — every single time you ask a question.
            The more detail you add, the smarter it gets at helping you.
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-7">
        <div className="mb-6">
          <h2 className="text-lg font-extrabold text-[#1F2A44]">Create Your Learning Profile</h2>
          <p className="text-sm text-[#9AA4BA] mt-0.5">
            Fill this in once — BrainBuddy will remember it forever.
          </p>
        </div>
        <StudentForm onSubmit={handleCreate} submitLabel="Continue →" />
      </div>

    </div>
  );
}
