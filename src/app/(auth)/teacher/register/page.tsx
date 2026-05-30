import Link from "next/link";
import { TeacherRegisterForm } from "@/components/auth/teacher-register-form";

export default function TeacherRegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">Teacher Access</p>
        <h1 className="text-2xl font-bold text-white">Create teacher account</h1>
        <p className="text-sm text-white/50">Set up classes and guide what students learn</p>
      </div>
      <TeacherRegisterForm />
      <p className="text-center text-xs text-white/40">
        Student account? <Link href="/register" className="text-[#7AA3FF]">Use student signup</Link>
      </p>
    </div>
  );
}
