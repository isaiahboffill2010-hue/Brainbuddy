"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function TeacherRegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, school_name: schoolName, role: "teacher" },
        emailRedirectTo: `${location.origin}/auth/callback?next=/teacher/dashboard`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
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
        <Label htmlFor="teacherName" className="text-sm font-medium text-white/70">Full name</Label>
        <Input id="teacherName" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="bg-white/5 border-white/10 h-11 rounded-xl text-white" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="schoolName" className="text-sm font-medium text-white/70">School name</Label>
        <Input id="schoolName" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} required className="bg-white/5 border-white/10 h-11 rounded-xl text-white" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teacherEmail" className="text-sm font-medium text-white/70">Email</Label>
        <Input id="teacherEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="bg-white/5 border-white/10 h-11 rounded-xl text-white" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="teacherPassword" className="text-sm font-medium text-white/70">Password</Label>
        <Input id="teacherPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="bg-white/5 border-white/10 h-11 rounded-xl text-white" />
      </div>

      <Button type="submit" className="w-full h-11 bg-gradient-brand border-0 shadow-glow-sm rounded-xl gap-2 font-semibold" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating teacher account...</> : <>Create Teacher Account <ArrowRight className="h-4 w-4" /></>}
      </Button>

      <p className="text-center text-sm text-white/50">
        Already have a teacher account?{" "}
        <Link href="/teacher/login" className="text-[#7AA3FF] hover:text-[#4F7CFF] font-medium">
          Sign in
        </Link>
      </p>
    </form>
  );
}
