import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/queries/profiles";
import { StudentBottomNav } from "@/components/layout/student-bottom-nav";
import { StudentTopbar } from "@/components/layout/student-topbar";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Parents who land on /home should still see it
  let studentName: string | undefined;
  let studentEmoji: string | undefined;
  try {
    const profile = await getProfile(supabase, user.id);
    if (profile) studentName = profile.full_name?.split(" ")[0] ?? undefined;
  } catch {
    // ignore
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0B1120] relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-cyan-500/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <StudentTopbar studentName={studentName} studentEmoji={studentEmoji} />
      <main className="flex-1 pb-20 md:pb-4 px-4 py-4 max-w-2xl mx-auto w-full relative z-10">
        {children}
      </main>
      <StudentBottomNav />
    </div>
  );
}
