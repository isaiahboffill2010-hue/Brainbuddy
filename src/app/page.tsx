import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Sparkles } from "lucide-react";

const subjects = [
  { emoji: "", name: "Math" },
  { emoji: "", name: "Reading" },
  { emoji: "", name: "Science" },
  { emoji: "", name: "Writing" },
  { emoji: "", name: "History" },
];

const highlights = [
  "Step-by-step explanations at your level",
  "Visual worked example cards - auto-generated",
  "Personalized practice targeting weak topics",
  "Chat history saved by subject",
  "Send photos of problems - BrainBuddy reads them",
  "Safe, profanity-free environment for all ages",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#071019] text-slate-200 overflow-x-hidden">
      <nav className="sticky top-0 z-50 bg-[#071019]/60 backdrop-blur-lg border-b border-white/6 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/cosmo-logo.png" alt="BrainBuddy" width={36} height={36} className="rounded-xl object-contain" />
            <span className="font-bold text-lg text-white">BrainBuddy</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg transition-all">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-20 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#4F7CFF]/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#8B7FFF]/5 rounded-full translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/6 rounded-full px-4 py-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">AI-powered learning</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
                Your personal AI tutor,{" "}
                <span className="text-indigo-300">always ready.</span>
              </h1>

              <p className="text-lg text-slate-300 max-w-xl leading-relaxed">
                BrainBuddy explains schoolwork step by step, generates visual worked examples, and personalizes practice to exactly what you need.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg transition-all text-base px-8 gap-2 h-12 rounded-2xl">
                    Start Learning Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/6 text-slate-300 hover:border-indigo-400/30 hover:text-white text-base px-8 h-12 rounded-2xl">
                    Sign In
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {highlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E] flex-shrink-0" />
                    <span className="text-sm text-slate-300">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-48 w-48 rounded-3xl bg-white/5 border border-white/6 shadow-lg flex items-center justify-center overflow-hidden">
                  <Image src="/cosmo-logo.png" alt="BrainBuddy" width={192} height={192} className="object-contain w-full h-full" />
                </div>
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl px-3 py-1.5 text-white text-xs font-bold shadow-lg whitespace-nowrap">
                  Hi! I&apos;m BrainBuddy
                </div>
                <div className="absolute -bottom-3 -left-3 bg-green-500 rounded-2xl px-3 py-1.5 text-white text-xs font-bold shadow-md">
                  Let&apos;s learn!
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-center mt-2">
                {subjects.map((subject) => (
                  <span key={subject.name} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border border-white/6 bg-white/3 text-slate-200">
                    <span>{subject.emoji}</span> {subject.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/6 bg-transparent py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/cosmo-logo.png" alt="BrainBuddy" width={28} height={28} className="rounded-xl object-contain" />
            <span className="font-bold text-white">BrainBuddy</span>
          </div>
          <p className="text-xs text-slate-300">
            Copyright {new Date().getFullYear()} BrainBuddy. Built to help every student succeed.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Shield className="h-3 w-3 text-slate-300" />
            Safe &amp; secure for kids
          </div>
        </div>
      </footer>
    </div>
  );
}
