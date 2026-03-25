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
    <div className="flex flex-col min-h-screen bg-background">
      <StudentTopbar studentName={studentName} studentEmoji={studentEmoji} />
      <main className="flex-1 pb-20 md:pb-4 px-4 py-4 max-w-2xl mx-auto w-full">
        {children}
      </main>
      <StudentBottomNav />
    </div>
  );
}
