"use client";
import { Bell, Search, ChevronDown } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface DashboardTopbarProps {
  userName?: string;
  userEmoji?: string;
}

export function DashboardTopbar({ userName = "there", userEmoji = "🦊" }: DashboardTopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E8EDF8] px-4 md:px-6 h-16 flex items-center gap-4">
      {/* Mobile logo */}
      <Link href="/dashboard" className="lg:hidden flex items-center gap-2 flex-shrink-0">
        <Image src="/brainbuddy-logo.png" alt="BrainBuddy" width={32} height={32} className="rounded-xl" />
        <span className="font-bold text-[#1F2A44]">BrainBuddy</span>
      </Link>

      {/* Search */}
      <div className={cn(
        "hidden sm:flex items-center gap-2 rounded-2xl border transition-all h-10 px-4",
        searchFocused
          ? "border-[#4F7CFF] bg-white shadow-[0_0_0_3px_rgba(79,124,255,0.12)]"
          : "border-[#E8EDF8] bg-[#F7FAFF]"
      )}>
        <Search className={cn("h-4 w-4 flex-shrink-0 transition-colors", searchFocused ? "text-[#4F7CFF]" : "text-[#9AA4BA]")} />
        <input
          type="text"
          placeholder="Search subjects, topics..."
          className="bg-transparent text-sm text-[#1F2A44] placeholder:text-[#9AA4BA] outline-none w-48 md:w-64"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      <div className="flex-1" />

      {/* Greeting */}
      <p className="hidden md:block text-sm font-medium text-[#6B7A9A]">
        {greeting},{" "}
        <span className="text-[#1F2A44] font-semibold">{userName} 👋</span>
      </p>

      <div className="hidden md:block h-6 w-px bg-[#E8EDF8]" />

      {/* Notifications */}
      <button className="relative h-10 w-10 rounded-2xl bg-[#F7FAFF] border border-[#E8EDF8] flex items-center justify-center hover:bg-[#EEF3FF] hover:border-[#4F7CFF]/30 transition-all">
        <Bell className="h-4 w-4 text-[#6B7A9A]" />
        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#4F7CFF] border-2 border-white text-[9px] text-white font-bold flex items-center justify-center">
          3
        </span>
      </button>

      {/* Avatar — shows the student's emoji + name */}
      <button className="flex items-center gap-2 rounded-2xl bg-[#F7FAFF] border border-[#E8EDF8] px-2 py-1.5 hover:border-[#4F7CFF]/30 hover:bg-[#EEF3FF] transition-all">
        <div className="h-7 w-7 rounded-xl bg-gradient-blue flex items-center justify-center text-base shadow-blue">
          {userEmoji}
        </div>
        <span className="hidden sm:block text-sm font-medium text-[#1F2A44]">{userName}</span>
        <ChevronDown className="hidden sm:block h-3.5 w-3.5 text-[#9AA4BA]" />
      </button>
    </header>
  );
}
