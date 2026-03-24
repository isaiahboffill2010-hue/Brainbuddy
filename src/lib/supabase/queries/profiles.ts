import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getProfile(client: Client, userId: string) {
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertProfile(
  client: Client,
  userId: string,
  updates: { full_name?: string; avatar_url?: string }
) {
  const { data, error } = await client
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
