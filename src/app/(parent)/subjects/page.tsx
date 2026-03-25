import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PracticeClient } from "@/components/practice/PracticeClient";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject: subjectParam } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get parent profile
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileRaw as { id: string } | null;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="text-5xl">📚</div>
        <p className="text-lg font-bold text-[#1F2A44]">Set up your profile first</p>
        <p className="text-sm text-[#9AA4BA]">Add a student to start practicing</p>
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
        <p className="text-sm text-[#9AA4BA]">Add a student profile to start practicing</p>
        <Link href="/students/new">
          <button className="flex items-center gap-2 bg-gradient-blue text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-blue hover:opacity-90 transition-all mt-2">
            <PlusCircle className="h-4 w-4" /> Add Student
          </button>
        </Link>
      </div>
    );
  }

  // Fetch student, subjects, and progress in parallel
  const [studentRes, subjectsRes, progressRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, age, grade, avatar_emoji, learning_style")
      .eq("id", studentId)
      .single(),
    supabase.from("subjects").select("id, name, icon, color"),
    supabase
      .from("student_subject_progress")
      .select("subject_id, topics_struggling, topics_mastered, session_count")
      .eq("student_id", studentId),
  ]);

  const student = studentRes.data as {
    id: string; name: string; age: number | null; grade: string;
    avatar_emoji: string; learning_style: string;
  } | null;

  const subjects = (subjectsRes.data ?? []) as {
    id: string; name: string; icon: string; color: string;
  }[];

  const progressRows = (progressRes.data ?? []) as {
    subject_id: string;
    topics_struggling: string[] | null;
    topics_mastered: string[] | null;
    session_count: number;
  }[];

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="text-5xl">📚</div>
        <p className="text-lg font-bold text-[#1F2A44]">Student not found</p>
      </div>
    );
  }

  // Build progressBySubject map
  const progressBySubject: Record<string, {
    topicsStruggling: string[];
    topicsMastered: string[];
    sessionCount: number;
  }> = {};

  for (const row of progressRows) {
    progressBySubject[row.subject_id] = {
      topicsStruggling: row.topics_struggling ?? [],
      topicsMastered: row.topics_mastered ?? [],
      sessionCount: row.session_count ?? 0,
    };
  }

  // Find initialSubjectId from ?subject=name query param
  let initialSubjectId: string | undefined;
  if (subjectParam) {
    const match = subjects.find(
      (s) => s.name.toLowerCase() === subjectParam.toLowerCase()
    );
    if (match) initialSubjectId = match.id;
  }

  return (
    <PracticeClient
      student={student}
      subjects={subjects}
      progressBySubject={progressBySubject}
      initialSubjectId={initialSubjectId}
    />
  );
}
