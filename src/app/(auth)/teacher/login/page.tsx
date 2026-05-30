import Link from "next/link";
import { TeacherLoginForm } from "@/components/auth/teacher-login-form";

export default function TeacherLoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">Teacher Access</p>
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-sm text-white/50">Sign in to manage your BrainBuddy classes</p>
      </div>
      <TeacherLoginForm />
      <p className="text-center text-xs text-white/40">
        Student account? <Link href="/login" className="text-[#7AA3FF]">Use student login</Link>
      </p>
    </div>
  );
}
