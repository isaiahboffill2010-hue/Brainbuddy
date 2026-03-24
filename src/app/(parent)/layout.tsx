import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardTopbar } from "@/components/layout/dashboard-topbar";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch profile for real name; fall back to auth metadata then email
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .single();

  const fullName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "there";

  // Use first name only for greetings
  const firstName = fullName.split(" ")[0];

  return (
    <div className="flex min-h-screen bg-[#F7FAFF]">
      <DashboardSidebar userName={fullName} />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar userName={firstName} />
        <main className="flex-1 p-4 md:p-6 xl:p-8 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
