import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { normalizeClassCode } from "@/lib/classes/class-code";
import {
  getJoinedClassesForStudent,
  getPrimaryStudentIdForProfile,
} from "@/lib/supabase/queries/classes";

export async function POST(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  const classCode = normalizeClassCode(String(code ?? ""));
  if (!classCode) return NextResponse.json({ error: "Class code is required" }, { status: 400 });

  const { data: profileData } = await service
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile = profileData as { id: string } | null;
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const studentId = await getPrimaryStudentIdForProfile(service, profile.id);
  if (!studentId) return NextResponse.json({ error: "No student profile found" }, { status: 404 });

  const { data: classData, error: classError } = await service
    .from("teacher_classes")
    .select("id, is_active, period")
    .eq("class_code", classCode)
    .maybeSingle();

  const classroom = classData as { id: string; is_active: boolean; period: string | null } | null;
  if (classError) return NextResponse.json({ error: classError.message }, { status: 500 });
  if (!classroom || !classroom.is_active) {
    return NextResponse.json({ error: "We could not find that class code." }, { status: 404 });
  }

  const joinedClasses = await getJoinedClassesForStudent(service, studentId).catch(() => []);
  const alreadyJoined = joinedClasses.some((item) => item.id === classroom.id);
  if (alreadyJoined) return NextResponse.json({ ok: true });

  if (joinedClasses.length >= 8) {
    return NextResponse.json({ error: "You can join up to 8 period classes." }, { status: 400 });
  }

  if (classroom.period && joinedClasses.some((item) => item.period === classroom.period)) {
    return NextResponse.json({ error: `You already joined a class for ${classroom.period}.` }, { status: 400 });
  }

  const { error } = await service
    .from("class_enrollments")
    .upsert(
      { class_id: classroom.id, student_id: studentId },
      { onConflict: "class_id,student_id", ignoreDuplicates: true }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
