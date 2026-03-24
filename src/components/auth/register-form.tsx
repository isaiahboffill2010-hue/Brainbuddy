"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, Loader2 } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role: "parent" },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });
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
        <Label htmlFor="fullName" className="text-sm font-medium text-white/70">Your name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Jane Smith"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="bg-white/5 border border-white/10 focus:border-[#4F7CFF]/60 h-11 rounded-xl text-white placeholder:text-white/30"
        />
      </div>

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
        <Label htmlFor="password" className="text-sm font-medium text-white/70">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="bg-white/5 border border-white/10 focus:border-[#4F7CFF]/60 h-11 rounded-xl text-white placeholder:text-white/30"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 bg-gradient-brand border-0 shadow-glow-sm hover:shadow-glow-md transition-all hover:opacity-90 rounded-xl gap-2 font-semibold"
        disabled={loading}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
        ) : (
          <>Create Account <ArrowRight className="h-4 w-4" /></>
        )}
      </Button>

      <p className="text-center text-sm text-white/50">
        Already have an account?{" "}
        <Link href="/login" className="text-[#7AA3FF] hover:text-[#4F7CFF] transition-colors font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
