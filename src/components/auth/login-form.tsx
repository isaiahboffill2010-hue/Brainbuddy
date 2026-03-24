"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-white/70">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="bg-white/5 border border-white/10 focus:border-[#4F7CFF]/60 h-11 rounded-xl text-white placeholder:text-white/30"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium text-white/70">Password</Label>
          <Link href="/forgot-password" className="text-xs text-primary/80 hover:text-primary transition-colors">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="bg-white/5 border border-white/10 focus:border-[#4F7CFF]/60 h-11 rounded-xl text-white placeholder:text-white/30"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-brand border-0 shadow-glow-sm hover:shadow-glow-md transition-all hover:opacity-90 rounded-xl gap-2 font-semibold"
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
        ) : (
          <>Sign In <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>

      <p className="text-center text-sm text-white/50">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#7AA3FF] hover:text-[#4F7CFF] transition-colors font-medium">
          Sign up free
        </Link>
      </p>
    </form>
  );
}
