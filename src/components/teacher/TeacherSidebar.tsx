import Link from "next/link";
import Image from "next/image";
import { BookOpen, ClipboardList, LayoutDashboard, LogOut } from "lucide-react";

export function TeacherSidebar({ teacherName }: { teacherName: string }) {
  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-[#111827]/80 backdrop-blur-xl border-r border-white/10 shadow-2xl">
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/teacher/dashboard" className="flex items-center gap-3">
          <Image src="/cosmo-logo.png" alt="BrainBuddy" width={40} height={40} className="rounded-2xl" />
          <div>
            <span className="font-bold text-lg text-white">BrainBuddy</span>
            <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">Teacher</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <Link
          href="/teacher/dashboard"
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 text-white border border-purple-500/30"
        >
          <span className="h-8 w-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4" />
          </span>
          Dashboard
        </Link>
        <Link
          href="/teacher/assignments"
          className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <span className="h-8 w-8 rounded-xl bg-white/5 text-slate-300 flex items-center justify-center">
            <ClipboardList className="h-4 w-4" />
          </span>
          Assignments
        </Link>
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="rounded-2xl bg-white/5 border border-white/10 p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{teacherName}</p>
            <p className="text-xs text-slate-400">Teacher</p>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button className="mt-2 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
