import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function PremiumCanceledPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#071019] px-6 py-20">
      <div className="max-w-2xl rounded-3xl border border-white/10 bg-slate-950/80 p-10 text-center shadow-2xl shadow-black/40">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/15 text-rose-400 mb-6">
          <XCircle className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-4">Payment not completed.</h1>
        <p className="text-slate-300 mb-8">No worries — your free trial is still active. You can upgrade anytime.</p>
        <Link href="/dashboard">
          <Button className="bg-white text-slate-950 px-8 py-3">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
