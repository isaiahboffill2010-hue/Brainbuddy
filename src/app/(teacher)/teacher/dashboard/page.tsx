import { redirect } from "next/navigation";
import { BookOpen, GraduationCap, Users } from "lucide-react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { TeacherClassForm } from "@/components/teacher/TeacherClassForm";
import { TeacherClassList } from "@/components/teacher/TeacherClassList";
import { getTeacherClassesWithStudents } from "@/lib/supabase/queries/classes";

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/teacher/login");

  const { data: profileData } = await service
    .from("profiles")
    .select("id, full_name, school_name, role")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = profileData as {
    id: string;
    full_name: string | null;
    school_name: string | null;
    role: string;
  } | null;

  if (profile?.role !== "teacher") redirect("/dashboard");

  const [classes, subjectsRes] = await Promise.all([
    getTeacherClassesWithStudents(service, profile.id).catch(() => []),
    service.from("subjects").select("id, name").order("name", { ascending: true }),
  ]);

  const subjects = (subjectsRes.data ?? []) as { id: string; name: string }[];
  const totalStudents = classes.reduce((sum, item) => sum + item.studentCount, 0);
  const teacherName = profile.full_name?.split(" ")[0] ?? "Teacher";

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      <div className="rounded-3xl bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-cyan-600/20 border border-white/10 p-6 md:p-8 shadow-2xl">
        <p className="text-sm text-slate-300">{profile.school_name ?? "BrainBuddy Classroom"}</p>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-white">Welcome, {teacherName}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Create a class, share the class code, and BrainBuddy will use your class topic when joined students chat.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Classes", value: classes.length, icon: GraduationCap },
          { label: "Joined students", value: totalStudents, icon: Users },
          { label: "Learning topics", value: classes.filter((item) => item.currentUnit || item.learningGoal).length, icon: BookOpen },
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-white/10 bg-[#1E293B]/80 p-5 shadow-2xl">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mb-3">
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-3xl font-extrabold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <TeacherClassForm subjects={subjects} />
        <TeacherClassList initialClasses={classes} />
      </div>
    </div>
  );
}
