"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, ArrowRight, BookOpen, MessageSquare, Zap, ImageIcon } from "lucide-react";

export default function ChoosePlanPage() {
  const router = useRouter();
  const [loadingFree, setLoadingFree] = useState(false);
  const [loadingPremium, setLoadingPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartFree() {
    setError(null);
    setLoadingFree(true);
    try {
      const res = await fetch("/api/plan/free", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not start free trial.");
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start free trial.");
    } finally {
      setLoadingFree(false);
    }
  }

  async function handleUpgradePremium() {
    setError(null);
    setLoadingPremium(true);
    try {
      router.push("/premium/checkout");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment.");
      setLoadingPremium(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Choose Your Plan</p>
        <h1 className="mt-4 text-4xl font-extrabold text-white">Pick how you want to learn with BrainBuddy</h1>
        <p className="mt-3 text-slate-300 max-w-2xl mx-auto">Start free today or upgrade to Premium for unlimited AI tutoring, homework help, and practice.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-[#0F172A]/90 p-8 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-[0.25em]">Free Trial</p>
              <p className="mt-2 text-3xl font-extrabold text-white">$0</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-indigo-500/15 px-3 py-1 text-sm font-semibold text-indigo-300">Start free</span>
          </div>
          <p className="text-slate-300 mb-6">Try BrainBuddy with your first messages, upload one homework photo, and generate one practice quiz.</p>
          <div className="space-y-4 text-sm text-slate-300 mb-8">
            {[
              "15 AI tutor messages",
              "1 homework snip/upload",
              "1 practice quiz",
              "Limited notes",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <Button onClick={handleStartFree} disabled={loadingFree} className="w-full bg-white text-slate-950 hover:bg-slate-100">
            {loadingFree ? "Starting free trial..." : "Start Free Trial"}
          </Button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#111827]/90 p-8 shadow-2xl shadow-black/20">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-400 uppercase tracking-[0.25em]">BrainBuddy Premium</p>
              <p className="mt-2 text-3xl font-extrabold text-white">$20/month</p>
            </div>
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-1 text-sm font-semibold text-white">Best value</span>
          </div>
          <p className="text-slate-300 mb-6">Unlimited access to the AI tutor, uploads, saved notes, past chats, practice quizzes, and personalized tutoring.</p>
          <div className="space-y-4 text-sm text-slate-300 mb-8">
            {[
              "AI tutor chat",
              "Homework snip/upload help",
              "Saved notes",
              "Past chats",
              "Practice quizzes",
              "Personalized tutoring",
              "Visual explanations",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2.5 w-2.5 rounded-full bg-purple-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <Button onClick={handleUpgradePremium} disabled={loadingPremium} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-95">
            {loadingPremium ? "Redirecting..." : "Upgrade to Premium"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-8 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}
    </div>
  );
}
