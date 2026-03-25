import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { User, Mail, Shield, Bell, LogOut } from "lucide-react";

export default async function ParentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("user_id", user.id)
    .single();
  const profile = profileData as { full_name: string | null; email: string | null; role: string } | null;

  const displayName = profile?.full_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "—";
  const displayEmail = profile?.email ?? user.email ?? "—";

  return (
    <div className="space-y-6 pb-8 animate-fade-in max-w-2xl">

      <div>
        <h1 className="text-2xl font-extrabold text-[#1F2A44]">Settings</h1>
        <p className="text-sm text-[#9AA4BA] mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-2xl bg-[#EEF3FF] flex items-center justify-center">
            <User className="h-5 w-5 text-[#4F7CFF]" />
          </div>
          <h2 className="font-bold text-[#1F2A44]">Profile</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-[#E8EDF8]">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-[#9AA4BA]" />
              <span className="text-sm text-[#6B7A9A]">Full Name</span>
            </div>
            <span className="text-sm font-semibold text-[#1F2A44]">{displayName}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[#E8EDF8]">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#9AA4BA]" />
              <span className="text-sm text-[#6B7A9A]">Email</span>
            </div>
            <span className="text-sm font-semibold text-[#1F2A44]">{displayEmail}</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-[#9AA4BA]" />
              <span className="text-sm text-[#6B7A9A]">Account Type</span>
            </div>
            <span className="text-sm font-semibold text-[#4F7CFF] bg-[#EEF3FF] rounded-full px-3 py-0.5 capitalize">
              {profile?.role ?? "Parent"}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications card */}
      <div className="bg-white rounded-3xl border border-[#E8EDF8] shadow-card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-2xl bg-[#F3F0FF] flex items-center justify-center">
            <Bell className="h-5 w-5 text-[#8B7FFF]" />
          </div>
          <h2 className="font-bold text-[#1F2A44]">Notifications</h2>
        </div>

        {[
          { label: "Weekly progress report", desc: "Get a summary every Sunday", enabled: true },
          { label: "Session completed", desc: "When your child finishes a session", enabled: true },
          { label: "Badge earned", desc: "When a new badge is unlocked", enabled: true },
          { label: "Homework uploaded", desc: "When a photo is submitted", enabled: false },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-[#E8EDF8] last:border-0">
            <div>
              <p className="text-sm font-semibold text-[#1F2A44]">{item.label}</p>
              <p className="text-xs text-[#9AA4BA]">{item.desc}</p>
            </div>
            <div className={`h-6 w-11 rounded-full relative transition-colors ${item.enabled ? "bg-[#4F7CFF]" : "bg-[#E8EDF8]"}`}>
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${item.enabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-3xl border border-[#FFD5D5] shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-[#FFF0F0] flex items-center justify-center">
            <LogOut className="h-5 w-5 text-[#F87171]" />
          </div>
          <h2 className="font-bold text-[#1F2A44]">Account</h2>
        </div>
        <p className="text-sm text-[#9AA4BA] mb-4">Sign out from your parent account on this device.</p>
        <form action="/api/auth/signout" method="POST">
          <button type="submit"
            className="flex items-center gap-2 rounded-2xl border border-[#FFD5D5] bg-[#FFF0F0] text-[#F87171] px-5 py-2.5 text-sm font-semibold hover:bg-[#FFE4E4] transition-colors">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>

    </div>
  );
}
