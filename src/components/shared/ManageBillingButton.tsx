"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleManageBilling() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not open billing portal");
      }
      const { url } = await res.json();
      if (!url) throw new Error("No portal URL returned");
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to open billing portal";
      setError(message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleManageBilling} disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg hover:shadow-purple-500/20">
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening portal...</> : "Manage Billing"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
