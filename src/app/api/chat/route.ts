import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createSession } from "@/lib/supabase/queries/sessions";

export async function POST(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, subjectId, title } = await req.json();
  if (!studentId || !subjectId) {
    return NextResponse.json({ error: "studentId and subjectId required" }, { status: 400 });
  }

  const session = await createSession(service, studentId, subjectId, title);
  return NextResponse.json(session, { status: 201 });
}
