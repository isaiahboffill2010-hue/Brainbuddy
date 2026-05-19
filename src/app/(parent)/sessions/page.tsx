import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SessionsView } from "@/components/sessions/sessions-view";
import type { SessionItem } from "@/components/sessions/sessions-view";

export default async function SessionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get profile → linked student
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileData as { id: string } | null;

  let studentId = "";
  if (profile) {
    const { data: links } = await supabase
      .from("parents_students")
      .select("student_id")
      .eq("parent_id", profile.id)
      .limit(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    studentId = (links as any)?.[0]?.student_id ?? "";
  }

  if (!studentId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 animate-fade-in">
        <div className="text-5xl">🧒</div>
        <p className="text-lg font-bold text-white">No student added yet</p>
        <p className="text-sm text-slate-400">Add a student profile to start AI tutoring sessions</p>
        <Link href="/students/new">
          <button className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-2xl px-5 py-2.5 text-sm font-bold shadow-lg shadow-indigo-500/30 hover:opacity-90 transition-all mt-2">
            <PlusCircle className="h-4 w-4" /> Add Student
          </button>
        </Link>
      </div>
    );
  }

  // Fetch all sessions with subject info
  const { data: rawSessions } = await supabase
    .from("ai_sessions")
    .select("id, title, created_at, subject_id, subjects(id, name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  // Fetch subjects to build the subjectId map
  const { data: subjectsData } = await supabase.from("subjects").select("id, name");

  const sessions: SessionItem[] = (rawSessions ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    created_at: s.created_at,
    subjectName: s.subjects?.name ?? "General",
    subjectId: s.subject_id ?? "",
  }));

  const subjectIdMap: Record<string, string> = {};
  for (const subj of (subjectsData ?? []) as { id: string; name: string }[]) {
    subjectIdMap[subj.name] = subj.id;
  }

  return (
    <SessionsView
      sessions={sessions}
      studentId={studentId}
      subjectIdMap={subjectIdMap}
    />
  );
}
