import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, "public", any>;

export type StudentNote = {
  id: string;
  student_id: string;
  session_id: string | null;
  subject: string | null;
  topic: string | null;
  note: string;
  created_at: string;
};

export async function getNotesForSession(
  client: Client,
  sessionId: string
): Promise<StudentNote[]> {
  const { data } = await client
    .from("student_notes")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  return (data as StudentNote[]) ?? [];
}

export async function getAllNotesForStudent(
  client: Client,
  studentId: string
): Promise<StudentNote[]> {
  const { data } = await client
    .from("student_notes")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return (data as StudentNote[]) ?? [];
}

export async function saveNote(
  client: Client,
  note: {
    student_id: string;
    session_id?: string | null;
    subject?: string | null;
    topic?: string | null;
    note: string;
  }
): Promise<StudentNote> {
  const { data, error } = await client
    .from("student_notes")
    .insert(note)
    .select()
    .single();
  if (error) throw error;
  return data as StudentNote;
}

export async function updateNote(
  client: Client,
  noteId: string,
  updates: { note?: string; topic?: string | null }
): Promise<StudentNote> {
  const { data, error } = await client
    .from("student_notes")
    .update(updates)
    .eq("id", noteId)
    .select()
    .single();
  if (error) throw error;
  return data as StudentNote;
}

export async function deleteNote(
  client: Client,
  noteId: string
): Promise<void> {
  const { error } = await client
    .from("student_notes")
    .delete()
    .eq("id", noteId);
  if (error) throw error;
}
