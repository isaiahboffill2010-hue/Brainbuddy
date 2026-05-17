"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import PremiumPaymentForm from "@/components/stripe/premium-payment-form";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, ImageIcon, MessageSquare, BookOpen, Zap } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function PremiumCheckoutPage() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initSubscription() {
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/stripe/checkout", { method: "POST" });
        const data = await res.json();
        console.log("Checkout response:", { status: res.status, ok: res.ok, data });
        if (!res.ok) {
          throw new Error(data?.error || `API Error: ${res.status}`);
        }
        if (!data?.clientSecret) {
          throw new Error("Missing Stripe client secret.");
        }
        setClientSecret(data.clientSecret);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("Checkout error:", errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    initSubscription();
  }, []);

  const appearance = useMemo(
    () => ({
      theme: "night" as const,
      variables: {
        colorPrimary: "#818cf8",
        colorBackground: "#020617",
        colorText: "#e2e8f0",
        colorDanger: "#fb7185",
        fontFamily: "Inter, system-ui, sans-serif",
        borderRadius: "16px",
      },
      rules: {
        ".Input": {
          backgroundColor: "#0f172a",
          borderColor: "#334155",
        },
      },
    }),
    []
  );

  const options = useMemo<StripeElementsOptions>(() => ({
    clientSecret: clientSecret ?? "",
    appearance,
  }), [clientSecret, appearance]);

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="rounded-3xl border border-white/10 bg-[#0F172A]/90 p-10 shadow-2xl shadow-black/30">
        <div className="flex flex-col gap-4 text-center mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Upgrade to BrainBuddy Premium</p>
          <h1 className="text-4xl font-extrabold text-white">$20/month</h1>
          <p className="max-w-2xl mx-auto text-slate-300">Keep learning with your personal AI tutor in a BrainBuddy-branded checkout experience.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-10">
          {[
            "AI tutor chat",
            "Homework snip/upload help",
            "Saved notes",
            "Past chats",
            "Practice quizzes",
            "Personalized tutoring",
            "Visual explanations",
          ].map((feature) => (
            <div key={feature} className="rounded-3xl border border-white/10 bg-white/5 p-5 text-slate-300">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">✨</span>
                <p className="font-semibold text-white">{feature}</p>
              </div>
              <p className="text-sm text-slate-400">{feature}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-8">
          {loading && <p className="text-slate-300">Loading payment form…</p>}
          {error && <p className="text-sm text-rose-300">{error}</p>}
          {!loading && !error && clientSecret && (
            <Elements stripe={stripePromise} options={options}>
              <PremiumPaymentForm />
            </Elements>
          )}
          {!loading && !error && !clientSecret && (
            <p className="text-slate-300">Unable to load payment flow. Please refresh.</p>
          )}
        </div>
      </div>
    </div>
  );
}
