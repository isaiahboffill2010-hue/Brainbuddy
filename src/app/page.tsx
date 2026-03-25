import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Sparkles, Brain, MessageSquare, Zap,
  BookOpen, Shield, CheckCircle2, ImageIcon,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Tutor — Cosmo",
    desc: "Ask anything and get step-by-step explanations tailored to your grade. Cosmo adapts to how YOU learn.",
    iconBg: "#EEF3FF",
    iconColor: "#4F7CFF",
    border: "#C7D7FF",
  },
  {
    icon: Zap,
    title: "Worked Example Cards",
    desc: "Cosmo auto-generates visual step-by-step worked example cards with hints and a similar practice problem.",
    iconBg: "#F3F0FF",
    iconColor: "#8B7FFF",
    border: "#D5D0FF",
  },
  {
    icon: BookOpen,
    title: "Personalized Practice",
    desc: "Practice mode targets your weak topics per subject with custom questions and on-demand hints from Cosmo.",
    iconBg: "#EEF8F0",
    iconColor: "#22C55E",
    border: "#BBF7D0",
  },
  {
    icon: MessageSquare,
    title: "My Chats",
    desc: "Every conversation is saved and organized by subject — Math, Reading, Science, Writing. Pick up right where you left off.",
    iconBg: "#EEF3FF",
    iconColor: "#4F7CFF",
    border: "#C7D7FF",
  },
  {
    icon: ImageIcon,
    title: "Send Images in Chat",
    desc: "Send a photo of any problem directly to Cosmo. The AI reads and explains it — no typing the whole question required.",
    iconBg: "#FFF8EC",
    iconColor: "#FFC857",
    border: "#FFE5A0",
  },
  {
    icon: Shield,
    title: "Safe & Kid-Friendly",
    desc: "Built-in profanity filter keeps every conversation clean. BrainBuddy is a safe space — no inappropriate content, ever.",
    iconBg: "#EEF8F0",
    iconColor: "#22C55E",
    border: "#BBF7D0",
  },
];

const subjects = [
  { emoji: "🔢", name: "Math",    bg: "#EEF3FF", border: "#C7D7FF", color: "#4F7CFF" },
  { emoji: "📚", name: "Reading", bg: "#EEF8F0", border: "#BBF7D0", color: "#22C55E" },
  { emoji: "🔬", name: "Science", bg: "#F3F0FF", border: "#D5D0FF", color: "#8B7FFF" },
  { emoji: "✏️", name: "Writing", bg: "#FFF8EC", border: "#FFE5A0", color: "#FFC857" },
];

const highlights = [
  "Step-by-step explanations at your level",
  "Visual worked example cards — auto-generated",
  "Personalized practice targeting weak topics",
  "Chat history saved by subject",
  "Send photos of problems — Cosmo reads them",
  "Safe, profanity-free environment for all ages",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7FAFF] text-[#1F2A44] overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E8EDF8] shadow-[0_2px_12px_rgba(79,124,255,0.06)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/cosmo-logo.png" alt="BrainBuddy" width={36} height={36} className="rounded-xl object-contain" />
            <span className="font-bold text-lg text-[#1F2A44]">BrainBuddy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-[#6B7A9A] hover:text-[#1F2A44]">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-[#4F7CFF] text-white hover:bg-[#3D6AE8] shadow-[0_4px_12px_rgba(79,124,255,0.3)] transition-all">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        {/* Subtle background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4F7CFF]/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8B7FFF]/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Left — text */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-[#EEF3FF] border border-[#C7D7FF] rounded-full px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#4F7CFF]" />
                <span className="text-xs font-semibold text-[#4F7CFF] uppercase tracking-wider">AI-powered learning</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#1F2A44]">
                Your personal AI tutor,{" "}
                <span className="text-[#4F7CFF]">always ready.</span>
              </h1>

              <p className="text-lg text-[#6B7A9A] max-w-xl leading-relaxed">
                BrainBuddy explains schoolwork step by step, generates visual worked examples, and personalizes practice to exactly what you need.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link href="/register">
                  <Button size="lg" className="bg-[#4F7CFF] text-white hover:bg-[#3D6AE8] shadow-[0_8px_24px_rgba(79,124,255,0.35)] transition-all text-base px-8 gap-2 h-12 rounded-2xl">
                    Start Learning Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-[#E8EDF8] text-[#6B7A9A] hover:border-[#4F7CFF]/40 hover:text-[#1F2A44] text-base px-8 h-12 rounded-2xl">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Highlight checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E] flex-shrink-0" />
                    <span className="text-sm text-[#6B7A9A]">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Cosmo mascot card */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-48 w-48 rounded-3xl bg-white border border-[#E8EDF8] shadow-[0_12px_40px_rgba(79,124,255,0.15)] flex items-center justify-center overflow-hidden">
                  <Image src="/cosmo-logo.png" alt="BrainBuddy" width={192} height={192} className="object-contain w-full h-full" />
                </div>
                <div className="absolute -top-3 -right-3 bg-[#4F7CFF] rounded-2xl px-3 py-1.5 text-white text-xs font-bold shadow-[0_4px_12px_rgba(79,124,255,0.4)] whitespace-nowrap">
                  Hi! I&apos;m Cosmo ✨
                </div>
                <div className="absolute -bottom-3 -left-3 bg-[#22C55E] rounded-2xl px-3 py-1.5 text-white text-xs font-bold shadow-[0_4px_12px_rgba(34,197,94,0.35)]">
                  Let&apos;s learn! 🚀
                </div>
              </div>

              {/* Mini subject pills */}
              <div className="flex gap-2 flex-wrap justify-center mt-2">
                {subjects.map((s) => (
                  <span key={s.name} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                    style={{ background: s.bg, borderColor: s.border, color: s.color }}>
                    <span>{s.emoji}</span> {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-white border-y border-[#E8EDF8]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44]">
              Everything you need to{" "}
              <span className="text-[#4F7CFF]">actually learn</span>
            </h2>
            <p className="text-[#6B7A9A] max-w-xl mx-auto">
              Not just a chatbot — BrainBuddy is a full learning system built for students.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-[#F7FAFF] rounded-2xl border border-[#E8EDF8] p-6 space-y-4 hover:shadow-[0_8px_24px_rgba(79,124,255,0.1)] hover:border-[#C7D7FF] transition-all group">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ background: f.iconBg }}>
                  <f.icon className="h-5 w-5" style={{ color: f.iconColor }} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-base text-[#1F2A44]">{f.title}</h3>
                  <p className="text-sm text-[#6B7A9A] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1F2A44]">
              Up and running in{" "}
              <span className="text-[#4F7CFF]">seconds</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { n: "01", title: "Create your profile", desc: "Set up your student profile with your name, grade, and photo. BrainBuddy personalizes everything to you." },
              { n: "02", title: "Ask Cosmo anything", desc: "Type a question or send a photo. Cosmo explains it step by step in a way that makes sense for your grade." },
              { n: "03", title: "Practice and improve", desc: "Use Practice Mode to work on your weak topics. Cosmo targets exactly what needs work." },
            ].map((step, i, arr) => (
              <div key={step.n} className="relative flex items-start gap-4 md:flex-col md:gap-0">
                {i < arr.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-0 h-px bg-[#E8EDF8]" />
                )}
                <div className="bg-white rounded-2xl border border-[#E8EDF8] p-6 space-y-3 shadow-[0_2px_12px_rgba(79,124,255,0.06)] w-full hover:shadow-[0_8px_24px_rgba(79,124,255,0.1)] hover:border-[#C7D7FF] transition-all">
                  <div className="text-3xl font-extrabold text-[#4F7CFF] opacity-40">{step.n}</div>
                  <h3 className="font-semibold text-[#1F2A44]">{step.title}</h3>
                  <p className="text-sm text-[#6B7A9A] leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="py-12 px-6 bg-white border-y border-[#E8EDF8]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: "4", label: "Core subjects", suffix: "" },
            { value: "4", label: "Learning styles", suffix: "" },
            { value: "24", label: "Availability", suffix: "/7" },
            { value: "∞", label: "Patience", suffix: "" },
          ].map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="text-3xl font-extrabold text-[#4F7CFF]">{s.value}{s.suffix}</div>
              <div className="text-sm text-[#6B7A9A]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-3xl bg-white border border-[#E8EDF8] shadow-[0_8px_24px_rgba(79,124,255,0.15)] overflow-hidden flex items-center justify-center">
              <Image src="/cosmo-logo.png" alt="BrainBuddy" width={80} height={80} className="object-contain w-full h-full" />
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1F2A44]">
            Ready to{" "}
            <span className="text-[#4F7CFF]">level up?</span>
          </h2>
          <p className="text-[#6B7A9A] text-lg">
            Create your free account and start learning with Cosmo today.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-[#4F7CFF] text-white hover:bg-[#3D6AE8] shadow-[0_8px_24px_rgba(79,124,255,0.35)] transition-all text-base px-10 h-14 gap-2 rounded-2xl">
              <Sparkles className="h-5 w-5" />
              Get Started — It&apos;s Free
            </Button>
          </Link>
          <p className="text-xs text-[#9AA4BA]">No credit card needed • Set up in 60 seconds</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E8EDF8] bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/cosmo-logo.png" alt="BrainBuddy" width={28} height={28} className="rounded-xl object-contain" />
            <span className="font-bold text-[#1F2A44]">BrainBuddy</span>
          </div>
          <p className="text-xs text-[#9AA4BA]">
            © {new Date().getFullYear()} BrainBuddy. Built to help every student succeed.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#9AA4BA]">
            <Shield className="h-3 w-3" />
            Safe &amp; secure for kids
          </div>
        </div>
      </footer>
    </div>
  );
}
