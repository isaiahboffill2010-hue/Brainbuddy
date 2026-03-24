import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile, upsertProfile } from "@/lib/supabase/queries/profiles";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getProfile(supabase, user.id);
  return NextResponse.json(profile);
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const profile = await upsertProfile(supabase, user.id, {
    full_name: body.full_name,
    avatar_url: body.avatar_url,
  });
  return NextResponse.json(profile);
}
