import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getUploadsForStudent(client: Client, studentId: string) {
  const { data, error } = await client
    .from("homework_uploads")
    .select("*, subjects(name, icon, color)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createUpload(
  client: Client,
  upload: Database["public"]["Tables"]["homework_uploads"]["Insert"]
) {
  const { data, error } = await client
    .from("homework_uploads")
    .insert(upload)
    .select()
    .single();
  if (error) throw error;
  return data;
}
