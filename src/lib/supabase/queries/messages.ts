import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, "public", any>;

export async function getMessagesForSession(client: Client, sessionId: string) {
  const { data, error } = await client
    .from("ai_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getRecentMessages(
  client: Client,
  sessionId: string,
  limit = 20
): Promise<Database["public"]["Tables"]["ai_messages"]["Row"][]> {
  const { data, error } = await client
    .from("ai_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Database["public"]["Tables"]["ai_messages"]["Row"][]).reverse();
}

export async function saveMessage(
  client: Client,
  message: Database["public"]["Tables"]["ai_messages"]["Insert"]
) {
  const { data, error } = await client
    .from("ai_messages")
    .insert(message)
    .select()
    .single();
  if (error) throw error;
  return data;
}
