"use client";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface DashboardTopbarProps {
  userName?: string;
  userEmoji?: string;
  avatarUrl?: string | null;
}

export function DashboardTopbar({ userName = "there", userEmoji = "🦊", avatarUrl }: DashboardTopbarProps) {
  const router = useRouter();
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl px-4 md:px-6 h-16 shadow-2xl">
      {/* Mobile logo */}
      <Link href="/dashboard" className="lg:hidden flex items-center gap-2 flex-shrink-0">
        <Image src="/cosmo-logo.png" alt="BrainBuddy" width={32} height={32} className="rounded-xl" />
        <span className="font-bold text-white">BrainBuddy</span>
      </Link>

      <div className="flex-1" />

      {/* Greeting */}
      <p className="hidden md:block text-sm font-medium text-slate-400">
        {greeting},{" "}
        <span className="text-white font-semibold">{userName} 👋</span>
      </p>

      <div className="hidden md:block h-6 w-px bg-white/10" />

      {/* Avatar — shows the student's emoji + name */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-2 py-1.5 hover:bg-white/10 transition-all"
          title="Profile menu"
          aria-expanded={menuOpen}
        >
          <div className="h-7 w-7 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-base shadow-glow-purple overflow-hidden flex-shrink-0">
            {avatarUrl
              ? <Image src={avatarUrl} alt={userName} width={28} height={28} className="w-full h-full object-cover" />
              : userEmoji}
          </div>
          <span className="hidden sm:block text-sm font-medium text-white">{userName}</span>
          <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-slate-400" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-44 rounded-3xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-xl overflow-hidden">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/5 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
