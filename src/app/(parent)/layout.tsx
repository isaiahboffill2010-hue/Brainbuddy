import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get parent profile id
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("user_id", user.id)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profile = profileData as { id: string; full_name: string | null } | null;

  // Look up the linked student — use their name, emoji, and photo throughout the UI
  let studentName: string | null = null;
  let studentEmoji = "🦊";
  let studentAvatarUrl: string | null = null;

  if (profile?.id) {
    const { data: links } = await supabase
      .from("parents_students")
      .select("students(name, avatar_emoji, avatar_url)")
      .eq("parent_id", profile.id)
      .limit(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const student = (links as any)?.[0]?.students as {
      name: string; avatar_emoji: string; avatar_url: string | null;
    } | null;
    if (student) {
      studentName = student.name;
      studentEmoji = student.avatar_emoji ?? "🦊";
      studentAvatarUrl = student.avatar_url ?? null;
    }
  }

  // Prefer the student's name; fall back to email prefix only (never parent profile name)
  const displayName =
    studentName ??
    user.user_metadata?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="flex min-h-screen bg-[#F7FAFF]">
      <DashboardSidebar userName={displayName} userEmoji={studentEmoji} avatarUrl={studentAvatarUrl} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar userName={displayName} userEmoji={studentEmoji} avatarUrl={studentAvatarUrl} />
        <main className="flex-1 p-4 md:p-6 xl:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
