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
  { href: "/subjects", icon: GraduationCap, label: "Subjects", badge: null },
  { href: "/notes", icon: BookMarked, label: "Notes", badge: null },
  { href: "/settings", icon: Settings, label: "Settings", badge: null },
];

export function DashboardSidebar({
  userName = "Student",
  userEmoji = "🦊",
}: {
  userName?: string;
  userEmoji?: string;
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
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-white border-r border-[#E8EDF8] shadow-[4px_0_24px_rgba(79,124,255,0.05)]">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#E8EDF8]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/brainbuddy-logo.png" alt="BrainBuddy" width={40} height={40} className="rounded-2xl" />
          <div>
            <span className="font-bold text-lg text-[#1F2A44]">BrainBuddy</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="h-3 w-3 text-[#FFC857]" />
              <span className="text-[10px] text-[#8B7FFF] font-semibold uppercase tracking-wider">AI-Powered</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 mb-1">
          Main Menu
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all group",
                active
                  ? "bg-gradient-soft-blue text-[#4F7CFF]"
                  : "text-[#6B7A9A] hover:bg-[#F7FAFF] hover:text-[#1F2A44]"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
                active
                  ? "bg-[#4F7CFF] text-white shadow-blue"
                  : "bg-[#F7FAFF] text-[#6B7A9A] group-hover:bg-[#EEF3FF] group-hover:text-[#4F7CFF]"
              )}>
                <item.icon className="h-4 w-4" />
              </div>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="h-5 min-w-5 rounded-full bg-[#4F7CFF] text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight className="h-3.5 w-3.5 text-[#4F7CFF]" />}
            </Link>
          );
        })}
      </nav>

      {/* Student card at bottom */}
      <div className="px-3 py-4 border-t border-[#E8EDF8]">
        <div className="rounded-2xl bg-gradient-soft-blue p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-blue flex items-center justify-center text-xl shadow-blue flex-shrink-0">
            {userEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1F2A44] truncate">{userName}</p>
            <p className="text-xs text-[#6B7A9A]">Student</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#6B7A9A] hover:bg-[#F7FAFF] hover:text-[#1F2A44] transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
