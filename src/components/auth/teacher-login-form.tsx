"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function TeacherLoginForm() {
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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/teacher/dashboard");
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
        <Label htmlFor="teacherEmail" className="text-sm font-medium text-white/70">Email</Label>
        <Input id="teacherEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="bg-white/5 border-white/10 h-11 rounded-xl text-white" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teacherPassword" className="text-sm font-medium text-white/70">Password</Label>
        <Input id="teacherPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="bg-white/5 border-white/10 h-11 rounded-xl text-white" />
      </div>

      <Button type="submit" className="w-full h-11 bg-gradient-brand border-0 shadow-glow-sm rounded-xl gap-2 font-semibold" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : <>Open Teacher Dashboard <ArrowRight className="h-4 w-4" /></>}
      </Button>

      <p className="text-center text-sm text-white/50">
        Need a teacher account?{" "}
        <Link href="/teacher/register" className="text-[#7AA3FF] hover:text-[#4F7CFF] font-medium">
          Sign up
        </Link>
      </p>
    </form>
  );
}
