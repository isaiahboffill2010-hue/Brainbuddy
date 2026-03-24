import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-sm text-white/50">
          Sign up as a parent to start helping your child learn smarter 🎓
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
