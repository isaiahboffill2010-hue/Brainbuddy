"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

export default function PremiumPaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!stripe || !elements) {
      setError("Stripe has not loaded yet.");
      return;
    }

    setLoading(true);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/premium/success`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment could not be completed.");
    } else if (result.paymentIntent?.status === "succeeded") {
      setSuccess("Payment successful! Redirecting to confirmation...");
      window.location.assign("/premium/success");
    } else {
      setSuccess("Payment processing. If additional authentication is required, please follow the next prompts.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl bg-slate-950/70 p-6 border border-white/10">
        <PaymentElement />
      </div>

      <div className="space-y-3">
        <Button type="submit" disabled={!stripe || loading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 text-base font-semibold">
          {loading ? "Processing…" : "Subscribe now"}
        </Button>
        {error && <p className="text-sm text-rose-300">{error}</p>}
        {success && <p className="text-sm text-emerald-300">{success}</p>}
      </div>
    </form>
  );
}
