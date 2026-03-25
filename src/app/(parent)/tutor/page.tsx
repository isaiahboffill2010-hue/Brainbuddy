import { createClient } from "@/lib/supabase/server";
import { TutorClient } from "@/components/tutor/TutorClient";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session: initialSessionId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get parent profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user?.id ?? "")
    .maybeSingle();
  const profile = profileRaw as { id: string } | null;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="text-5xl">🧠</div>
        <p className="text-lg font-bold text-[#1F2A44]">Set up your profile first</p>
        <p className="text-sm text-[#9AA4BA]">Add a student to start using the AI tutor</p>
        <Link href="/students/new">
          <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-blue hover:opacity-90 transition-all mt-2">
            <PlusCircle className="h-4 w-4" /> Add Student
          </button>
        </Link>
      </div>
    );
  }

  // Get linked student
  const { data: links } = await supabase
    .from("parents_students")
    .select("student_id")
    .eq("parent_id", profile.id)
    .limit(1);

  const studentId = (links as any)?.[0]?.student_id ?? null;

  if (!studentId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="text-5xl">🧒</div>
        <p className="text-lg font-bold text-[#1F2A44]">No student added yet</p>
        <p className="text-sm text-[#9AA4BA]">Add a student profile to start AI tutoring sessions</p>
        <Link href="/students/new">
          <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-blue hover:opacity-90 transition-all mt-2">
            <PlusCircle className="h-4 w-4" /> Add Student
          </button>
        </Link>
      </div>
    );
  }

  // Fetch student, subjects, and past sessions in parallel
  const [studentRes, subjectsRes, sessionsRes] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).single(),
    supabase.from("subjects").select("*"),
    supabase
      .from("ai_sessions")
      .select("*, subjects(name, icon, color)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const student = studentRes.data as any;
  const subjects = (subjectsRes.data ?? []) as any[];
  const sessions = (sessionsRes.data ?? []) as any[];

  return (
    <TutorClient
      student={student}
      subjects={subjects}
      initialSessions={sessions}
      initialSessionId={initialSessionId}
    />
  );
}
