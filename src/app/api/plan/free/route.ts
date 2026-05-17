import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await service
    .from("profiles")
    .update({
      plan: "free",
      subscription_status: "trial",
      messages_used: 0,
      snips_used: 0,
      quizzes_used: 0,
      message_limit: 15,
      snip_limit: 1,
      quiz_limit: 1,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profile);
}
