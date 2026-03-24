import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-sm text-white/50">Sign in to continue your learning journey</p>
      </div>
      <LoginForm />
    </div>
  );
}
