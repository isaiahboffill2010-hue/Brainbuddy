"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentTopbarProps {
  studentName?: string;
  studentEmoji?: string;
}

export function StudentTopbar({ studentName, studentEmoji = "🧠" }: StudentTopbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl px-4 h-14">
      <Link href="/home" className="flex items-center gap-2.5">
        <Image src="/cosmo-logo.png" alt="BrainBuddy" width={32} height={32} className="rounded-xl" />
        {studentName && (
          <div>
            <span className="font-semibold text-sm">Hi, {studentName}!</span>
            <span className="ml-1.5 text-sm">👋</span>
          </div>
        )}
      </Link>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSignOut}
        className="hover:bg-white/5 text-muted-foreground hover:text-foreground"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
