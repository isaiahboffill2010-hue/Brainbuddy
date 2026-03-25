import { redirect } from "next/navigation";
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

  if (!studentId) redirect("/students/new");

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
