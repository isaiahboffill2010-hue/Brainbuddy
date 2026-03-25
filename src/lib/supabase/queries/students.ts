import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, "public", any>;

export async function getStudentsForParent(
  client: Client,
  parentProfileId: string
): Promise<Database["public"]["Tables"]["students"]["Row"][]> {
  const { data, error } = await client
    .from("parents_students")
    .select("student_id, students(*)")
    .eq("parent_id", parentProfileId);
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data?.map((row) => (row as unknown as { student_id: string; students: Database["public"]["Tables"]["students"]["Row"] | null }).students).filter(Boolean) ?? []) as Database["public"]["Tables"]["students"]["Row"][];
}

export async function getStudent(
  client: Client,
  studentId: string
): Promise<Database["public"]["Tables"]["students"]["Row"]> {
  const { data, error } = await client
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();
  if (error) throw error;
  return data as Database["public"]["Tables"]["students"]["Row"];
}

export async function createStudent(
  client: Client,
  student: Database["public"]["Tables"]["students"]["Insert"],
  parentProfileId: string
) {
  const { data, error } = await client
    .from("students")
    .insert(student)
    .select()
    .single();
  if (error) throw error;

  // Link to parent
  const { error: linkError } = await client
    .from("parents_students")
    .insert({ parent_id: parentProfileId, student_id: data.id });
  if (linkError) throw linkError;

  // Seed progress rows for all subjects
  const { data: subjects } = await client.from("subjects").select("id");
  if (subjects && subjects.length > 0) {
    await client.from("student_subject_progress").insert(
      subjects.map((s) => ({ student_id: data.id, subject_id: s.id }))
    );
  }

  // Seed learning preferences
  await client.from("learning_preferences").insert({
    student_id: data.id,
    preferred_style: student.learning_style ?? "visual",
  });

  return data;
}

export async function updateStudent(
  client: Client,
  studentId: string,
  updates: Database["public"]["Tables"]["students"]["Update"]
) {
  const { data, error } = await client
    .from("students")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", studentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStudent(client: Client, studentId: string) {
  const { error } = await client.from("students").delete().eq("id", studentId);
  if (error) throw error;
}
