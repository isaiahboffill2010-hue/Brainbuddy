import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function PremiumSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071019] px-6 py-20">
      <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-950/80 p-10 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white mb-6">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-4">Welcome to BrainBuddy Premium!</h1>
        <p className="text-slate-300 mb-8">Your account has been upgraded. You can keep learning with your AI tutor.</p>
        <Link href="/dashboard">
          <Button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
