"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/home", icon: Home, label: "Home" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Me" },
];

export function StudentBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#111827]/90 backdrop-blur-xl md:hidden shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all",
                active
                  ? "text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
