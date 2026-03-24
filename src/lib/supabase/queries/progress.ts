import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getProgressForStudent(client: Client, studentId: string) {
  const { data, error } = await client
    .from("student_subject_progress")
    .select("*, subjects(name, icon, color)")
    .eq("student_id", studentId);
  if (error) throw error;
  return data ?? [];
}

export async function getProgressForSubject(
  client: Client,
  studentId: string,
  subjectId: string
) {
  const { data } = await client
    .from("student_subject_progress")
    .select("*")
    .eq("student_id", studentId)
    .eq("subject_id", subjectId)
    .single();
  return data;
}

export async function upsertProgress(
  client: Client,
  studentId: string,
  subjectId: string,
  updates: {
    topics_mastered?: string[];
    topics_struggling?: string[];
    level?: number;
    session_count?: number;
    last_session_at?: string;
    streak_days?: number;
  }
) {
  const { error } = await client
    .from("student_subject_progress")
    .upsert(
      {
        student_id: studentId,
        subject_id: subjectId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id,subject_id" }
    );
  if (error) throw error;
}
