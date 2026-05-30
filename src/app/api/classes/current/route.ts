import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  getClassContextForStudent,
  getJoinedClassesForStudent,
  getPrimaryStudentIdForProfile,
} from "@/lib/supabase/queries/classes";

export async function GET(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await service
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const profileId = (profile as { id: string } | null)?.id;
  const { searchParams } = new URL(req.url);
  const returnAll = searchParams.get("all") === "1";

  if (!profileId) return NextResponse.json(returnAll ? [] : null);

  const studentId = await getPrimaryStudentIdForProfile(service, profileId);
  if (!studentId) return NextResponse.json(returnAll ? [] : null);

  if (returnAll) {
    const classes = await getJoinedClassesForStudent(service, studentId).catch(() => []);
    return NextResponse.json(classes);
  }

  const subjectId = searchParams.get("subjectId") || undefined;
  const studentClass = await getClassContextForStudent(service, studentId, subjectId);

  return NextResponse.json(studentClass);
}
