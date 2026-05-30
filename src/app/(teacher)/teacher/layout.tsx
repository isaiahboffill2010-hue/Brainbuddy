import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = profileData as { full_name: string | null; role: string } | null;
  if (profile?.role !== "teacher") redirect("/dashboard");

  const teacherName = profile.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Teacher";

  return (
    <div className="flex min-h-screen bg-[#0B1120] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 pointer-events-none" />
      <TeacherSidebar teacherName={teacherName} />
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#111827]/80 backdrop-blur-xl px-4 h-16">
          <Link href="/teacher/dashboard" className="flex items-center gap-2">
            <Image src="/cosmo-logo.png" alt="BrainBuddy" width={32} height={32} className="rounded-xl" />
            <span className="font-bold text-white">BrainBuddy Teacher</span>
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button className="text-sm text-slate-300">Sign out</button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6 xl:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
