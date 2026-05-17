import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database, "public", any>;

export type BillingProfile = Database["public"]["Tables"]["profiles"]["Row"];

export function getDefaultBillingProfile() {
  return {
    plan: "free" as const,
    subscription_status: "trial" as const,
    messages_used: 0,
    snips_used: 0,
    quizzes_used: 0,
    message_limit: 15,
    snip_limit: 1,
    quiz_limit: 1,
  };
}

export function isPremiumProfile(profile: Partial<BillingProfile> | null | undefined) {
  return profile?.plan === "premium";
}

export function isFreeProfile(profile: Partial<BillingProfile> | null | undefined) {
  return !isPremiumProfile(profile);
}

export function getProfileLimits(profile: Partial<BillingProfile> | null | undefined) {
  return {
    messageLimit: profile?.message_limit ?? 15,
    snipLimit: profile?.snip_limit ?? 1,
    quizLimit: profile?.quiz_limit ?? 1,
  };
}

export function getProfileUsage(profile: Partial<BillingProfile> | null | undefined) {
  return {
    messagesUsed: profile?.messages_used ?? 0,
    snipsUsed: profile?.snips_used ?? 0,
    quizzesUsed: profile?.quizzes_used ?? 0,
  };
}

export async function fetchBillingProfile(client: Client, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select(
      "id, role, full_name, email, avatar_url, plan, subscription_status, messages_used, snips_used, quizzes_used, message_limit, snip_limit, quiz_limit, stripe_customer_id, stripe_subscription_id"
    )
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data as BillingProfile | null;
}

export function formatLimitLabel(profile: Partial<BillingProfile> | null | undefined) {
  const { messagesUsed } = getProfileUsage(profile);
  const { messageLimit } = getProfileLimits(profile);
  return `${messagesUsed}/${messageLimit} messages used`;
}

export function getLimitMessage(type: "messages" | "snips" | "quizzes") {
  if (type === "messages") {
    return "You used all 15 free AI tutor messages. Upgrade to BrainBuddy Premium for $20/month to keep learning with your personal AI tutor.";
  }
  if (type === "snips") {
    return "You used your free homework snip/upload. Upgrade to BrainBuddy Premium for unlimited homework help and visual explanations.";
  }
  return "You used your free practice quiz. Upgrade to BrainBuddy Premium for unlimited practice quizzes and personalized tutoring.";
}
