import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Create your student account</h1>
      </div>
      <RegisterForm />
      <p className="text-center text-xs text-white/40">
        Teacher? <Link href="/teacher/register" className="text-[#7AA3FF]">Create a teacher account</Link>
      </p>
    </div>
  );
}
