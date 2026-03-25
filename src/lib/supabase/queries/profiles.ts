import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, "public", any>;

export async function getProfile(
  client: Client,
  userId: string
): Promise<Database["public"]["Tables"]["profiles"]["Row"] | null> {
  const { data } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data ?? null) as Database["public"]["Tables"]["profiles"]["Row"] | null;
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
