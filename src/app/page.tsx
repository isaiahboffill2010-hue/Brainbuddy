import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Brain, Camera, BookOpen, TrendingUp, Users, Star, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Adapts to Every Kid",
    desc: "BrainBuddy learns your child's style — visual, hands-on, auditory, or reading — and explains things their way, every time.",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Camera,
    title: "Homework Photo Help",
    desc: "Snap a photo of any problem. BrainBuddy reads it and guides step by step — no typing required.",
    color: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: BookOpen,
    title: "4 Core Subjects",
    desc: "Math, Reading, Science, and Writing — fully covered with kid-friendly step-by-step explanations.",
    color: "from-indigo-500/20 to-blue-500/10",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
  },
  {
    icon: Zap,
    title: "Learns Over Time",
    desc: "BrainBuddy remembers what worked and what didn't, getting smarter and more personal with every session.",
    color: "from-purple-500/20 to-violet-500/10",
    border: "border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    icon: Users,
    title: "Parent Dashboard",
    desc: "Track every subject, session, and breakthrough. Always know exactly how your child is growing.",
    color: "from-blue-500/20 to-indigo-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    desc: "Watch topics move from 'still learning' to 'mastered' with clear visual progress for every subject.",
    color: "from-violet-500/20 to-blue-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
];

const subjects = [
  { emoji: "🔢", name: "Math", glow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]", border: "border-indigo-500/30" },
  { emoji: "📚", name: "Reading", glow: "shadow-[0_0_20px_rgba(59,130,246,0.3)]", border: "border-blue-500/30" },
  { emoji: "🔬", name: "Science", glow: "shadow-[0_0_20px_rgba(139,92,246,0.3)]", border: "border-violet-500/30" },
  { emoji: "✏️", name: "Writing", glow: "shadow-[0_0_20px_rgba(99,102,241,0.3)]", border: "border-indigo-500/30" },
];

const steps = [
  { n: "01", title: "Create a profile", desc: "Tell us your child's grade and how they learn best. Takes 60 seconds." },
  { n: "02", title: "Ask anything", desc: "Type a question or snap a photo of homework. BrainBuddy handles it." },
  { n: "03", title: "Learn and grow", desc: "Step-by-step guidance that adapts and remembers what clicks." },
];

const stats = [
  { value: "4", label: "Subjects covered", suffix: "" },
  { value: "4", label: "Learning styles", suffix: "" },
  { value: "24", label: "Availability", suffix: "/7" },
  { value: "∞", label: "Patience", suffix: "" },
];

export default function LandingPage() {
  return (
    <div className="dark-theme min-h-screen bg-[#06070D] overflow-x-hidden text-white">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-brand flex items-center justify-center text-lg shadow-glow-sm">
              🧠
            </div>
            <span className="font-bold text-lg gradient-text">BrainBuddy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-brand text-white border-0 shadow-glow-sm hover:shadow-glow-md transition-all hover:opacity-90">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] glow-blob-purple pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] glow-blob-blue pointer-events-none opacity-50" />
        <div className="absolute inset-0 bg-dots opacity-30 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <div className="animate-slide-up">
            <Badge className="bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 text-sm gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered learning for every child
            </Badge>
          </div>

          <div className="animate-slide-up space-y-4" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Every kid learns{" "}
              <span className="gradient-text-bright">differently.</span>
              <br />
              <span className="gradient-text">BrainBuddy</span> adapts.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A personalized AI tutor that explains schoolwork in the exact way your child understands best — with memory, patience, and always-on availability.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <Link href="/register">
              <Button size="lg" className="bg-gradient-brand text-white border-0 shadow-glow-md hover:shadow-glow-lg transition-all hover:opacity-90 text-base px-8 gap-2 h-12">
                Start Learning Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-white/10 text-foreground hover:bg-white/5 text-base px-8 h-12">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Floating mascot */}
          <div className="flex justify-center pt-8 animate-slide-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
            <div className="relative">
              <div className="h-36 w-36 rounded-3xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 glass-bright flex items-center justify-center text-7xl animate-float shadow-glow-lg border border-primary/20">
                🧠
              </div>
              <div className="absolute -top-3 -right-3 bg-gradient-brand rounded-full px-3 py-1 text-white text-xs font-bold shadow-glow-sm whitespace-nowrap">
                Hi! I&apos;m BrainBuddy ✨
              </div>
              <div className="absolute -bottom-2 -left-3 bg-emerald-500/90 rounded-full px-2.5 py-1 text-white text-xs font-bold">
                Always learning 🔥
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center space-y-1">
              <div className="text-3xl font-extrabold gradient-text">
                {s.value}{s.suffix}
              </div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Subjects ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">
              Covers the subjects that <span className="gradient-text">matter most</span>
            </h2>
            <p className="text-muted-foreground">Full support across every core school subject</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {subjects.map((s) => (
              <div
                key={s.name}
                className={`glass-bright rounded-2xl p-6 text-center space-y-3 border ${s.border} hover:scale-105 transition-transform cursor-default ${s.glow}`}
              >
                <div className="text-5xl">{s.emoji}</div>
                <div className="font-semibold">{s.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 relative">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl md:text-4xl font-bold">
              Built for how kids <span className="gradient-text">actually learn</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No generic explanations. BrainBuddy adapts to each child&apos;s unique way of understanding the world.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} p-6 space-y-4 hover:shadow-card-hover transition-all group`}
              >
                <div className={`h-10 w-10 rounded-xl glass flex items-center justify-center ${f.iconColor} border border-white/10`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-base text-foreground">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold">
              Up and running in <span className="gradient-text">3 steps</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={step.n} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-primary/40 to-transparent -translate-x-6 z-0" />
                )}
                <div className="glass-bright rounded-2xl p-6 space-y-4 border border-white/5 relative z-10">
                  <div className="text-4xl font-extrabold gradient-text opacity-50">{step.n}</div>
                  <h3 className="font-semibold text-base">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] glow-blob-purple pointer-events-none" />
        <div className="max-w-2xl mx-auto text-center relative z-10 space-y-6">
          <div className="text-5xl">🚀</div>
          <h2 className="text-4xl md:text-5xl font-extrabold">
            Ready to help your child{" "}
            <span className="gradient-text-bright">level up?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Join thousands of parents helping their kids learn smarter, not harder.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-gradient-brand text-white border-0 shadow-glow-lg hover:opacity-90 transition-all text-base px-10 h-14 gap-2">
              <Sparkles className="h-5 w-5" />
              Get Started — It&apos;s Free
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">No credit card needed • Set up in 60 seconds</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <span className="font-bold gradient-text">BrainBuddy</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} BrainBuddy. Built to help every child succeed.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            Safe & secure for kids
          </div>
        </div>
      </footer>
    </div>
  );
}
