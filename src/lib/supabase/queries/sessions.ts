import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, "public", any>;

export async function getSessionsForStudent(client: Client, studentId: string) {
  const { data, error } = await client
    .from("ai_sessions")
    .select("*, subjects(name, icon, color)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSession(client: Client, sessionId: string) {
  const { data, error } = await client
    .from("ai_sessions")
    .select("*, subjects(name, icon, color)")
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data;
}

export async function getLastSessionSummary(
  client: Client,
  studentId: string,
  subjectId: string
) {
  const { data } = await client
    .from("ai_sessions")
    .select("learning_notes")
    .eq("student_id", studentId)
    .eq("subject_id", subjectId)
    .not("learning_notes", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data?.learning_notes ?? null;
}

export async function createSession(
  client: Client,
  studentId: string,
  subjectId: string,
  title?: string
) {
  const { data, error } = await client
    .from("ai_sessions")
    .insert({ student_id: studentId, subject_id: subjectId, title: title ?? "New Session" })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSessionNotes(
  client: Client,
  sessionId: string,
  updates: { learning_notes?: string; session_summary?: string; title?: string }
) {
  const { error } = await client
    .from("ai_sessions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}
