import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StudentCard } from "@/components/students/student-card";
import { PlusCircle, Users } from "lucide-react";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Safely fetch profile and students — tables may not exist yet
  let students: any[] = [];
  try {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    const profile = profileData as { id: string } | null;

    if (profile) {
      const { data } = await supabase
        .from("parents_students")
        .select("student_id, students(*)")
        .eq("parent_id", profile.id);
      students = data?.map((r: any) => r.students).filter(Boolean) ?? [];
    }
  } catch {
    // Tables not set up yet
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1F2A44]">My Students</h1>
          <p className="text-sm text-[#9AA4BA] mt-0.5">
            {students.length} student{students.length !== 1 ? "s" : ""} enrolled
          </p>
        </div>
        <Link href="/students/new">
          <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-4 py-2.5 text-sm font-bold shadow-blue hover:opacity-90 transition-all">
            <PlusCircle className="h-4 w-4" />
            Add Student
          </button>
        </Link>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="h-20 w-20 rounded-3xl bg-[#EEF3FF] flex items-center justify-center text-4xl">
            🧒
          </div>
          <h2 className="text-lg font-bold text-[#1F2A44]">No students yet</h2>
          <p className="text-sm text-[#9AA4BA] text-center max-w-xs">
            Add a student profile to start their personalised learning journey with BrainBuddy.
          </p>
          <Link href="/students/new">
            <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-blue hover:opacity-90 transition-all mt-2">
              <PlusCircle className="h-4 w-4" />
              Add First Student
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((student: any) => (
            <StudentCard key={student.id} student={student} subjectCount={4} />
          ))}
        </div>
      )}
    </div>
  );
}
