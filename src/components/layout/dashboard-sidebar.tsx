"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Brain, MessageSquare, GraduationCap, BookMarked,
  Settings, LogOut, ChevronRight, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", badge: null },
  { href: "/tutor", icon: Brain, label: "AI Tutor", badge: null },
  { href: "/sessions", icon: MessageSquare, label: "My Chats", badge: null },
  { href: "/subjects", icon: GraduationCap, label: "Quizes", badge: null },
  { href: "/notes", icon: BookMarked, label: "Notes", badge: null },
  { href: "/settings", icon: Settings, label: "Settings", badge: null },
];

export function DashboardSidebar({
  userName = "Student",
  userEmoji = "🦊",
  avatarUrl,
}: {
  userName?: string;
  userEmoji?: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-[#111827]/80 backdrop-blur-xl border-r border-white/10 shadow-2xl relative">
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-r-2xl" />
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10 relative z-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/cosmo-logo.png" alt="BrainBuddy" width={40} height={40} className="rounded-2xl" />
          <div>
            <span className="font-bold text-lg text-white">BrainBuddy</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="h-3 w-3 text-cyan-400" />
              <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">AI-Powered</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto relative z-10">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mb-1">
          Main Menu
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all group relative",
                active
                  ? "bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 text-white shadow-lg shadow-purple-500/25 border border-purple-500/30"
                  : "text-slate-300 hover:bg-white/5 hover:text-white hover:shadow-md"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                active
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                  : "bg-white/10 text-slate-400 group-hover:bg-white/20 group-hover:text-white"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="h-5 min-w-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5 shadow-lg">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Student card at bottom */}
      <div className="px-3 py-4 border-t border-white/10 relative z-10">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 backdrop-blur-sm border border-white/10 p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-xl shadow-lg flex-shrink-0 overflow-hidden">
            {avatarUrl
              ? <Image src={avatarUrl} alt={userName} width={40} height={40} className="w-full h-full object-cover" />
              : userEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userName}</p>
            <p className="text-xs text-slate-400">Student</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
