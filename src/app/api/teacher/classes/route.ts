import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateClassCode } from "@/lib/classes/class-code";
import { getTeacherClassesWithStudents } from "@/lib/supabase/queries/classes";

async function getTeacherProfile(userId: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("id, role")
    .eq("user_id", userId)
    .maybeSingle();

  const profile = data as { id: string; role: string } | null;
  return profile?.role === "teacher" ? profile : null;
}

export async function GET() {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getTeacherProfile(user.id);
  if (!teacher) return NextResponse.json({ error: "Teacher account required" }, { status: 403 });

  const classes = await getTeacherClassesWithStudents(service, teacher.id);
  return NextResponse.json(classes);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getTeacherProfile(user.id);
  if (!teacher) return NextResponse.json({ error: "Teacher account required" }, { status: 403 });

  const body = await req.json();
  const period = String(body.period ?? "").trim();
  const className = period || String(body.className ?? "").trim();
  if (!className) return NextResponse.json({ error: "Period is required" }, { status: 400 });

  let classCode = generateClassCode();
  for (let i = 0; i < 8; i += 1) {
    const { data: existing } = await service
      .from("teacher_classes")
      .select("id")
      .eq("class_code", classCode)
      .maybeSingle();

    if (!existing) break;
    classCode = generateClassCode();
  }

  const { data, error } = await service
    .from("teacher_classes")
    .insert({
      teacher_profile_id: teacher.id,
      class_name: className,
      school_level: body.schoolLevel || null,
      grade_level: body.gradeLevel || null,
      subject_id: body.subjectId || null,
      period: period || null,
      current_unit: String(body.currentUnit ?? "").trim() || null,
      learning_goal: String(body.learningGoal ?? "").trim() || null,
      brainbuddy_instructions: String(body.brainbuddyInstructions ?? "").trim() || null,
      class_code: classCode,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getTeacherProfile(user.id);
  if (!teacher) return NextResponse.json({ error: "Teacher account required" }, { status: 403 });

  const body = await req.json();
  const classId = String(body.classId ?? "").trim();
  if (!classId) return NextResponse.json({ error: "Class is required" }, { status: 400 });

  const { data, error } = await service
    .from("teacher_classes")
    .update({
      current_unit: String(body.currentUnit ?? "").trim() || null,
      learning_goal: String(body.learningGoal ?? "").trim() || null,
      brainbuddy_instructions: String(body.brainbuddyInstructions ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", classId)
    .eq("teacher_profile_id", teacher.id)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getTeacherProfile(user.id);
  if (!teacher) return NextResponse.json({ error: "Teacher account required" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const classId = String(body.classId ?? "").trim();
  if (!classId) return NextResponse.json({ error: "Class is required" }, { status: 400 });

  const { data: classRow, error: classError } = await service
    .from("teacher_classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_profile_id", teacher.id)
    .maybeSingle();

  if (classError) return NextResponse.json({ error: classError.message }, { status: 500 });
  if (!classRow) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  const { data: assignmentRows } = await service
    .from("assignments")
    .select("id")
    .eq("class_id", classId)
    .eq("teacher_id", teacher.id);

  const assignmentIds = ((assignmentRows ?? []) as { id: string }[]).map((row) => row.id);
  if (assignmentIds.length > 0) {
    const { data: worksheetRows } = await service
      .from("assignment_worksheets")
      .select("storage_path")
      .in("assignment_id", assignmentIds);

    const storagePaths = ((worksheetRows ?? []) as { storage_path: string | null }[])
      .map((row) => row.storage_path)
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      await service.storage.from("homework").remove(storagePaths);
    }

    const { error: assignmentsError } = await service
      .from("assignments")
      .delete()
      .eq("class_id", classId)
      .eq("teacher_id", teacher.id);

    if (assignmentsError) return NextResponse.json({ error: assignmentsError.message }, { status: 500 });
  }

  const { error: enrollmentError } = await service
    .from("class_enrollments")
    .delete()
    .eq("class_id", classId);

  if (enrollmentError) return NextResponse.json({ error: enrollmentError.message }, { status: 500 });

  const { error: deleteError } = await service
    .from("teacher_classes")
    .delete()
    .eq("id", classId)
    .eq("teacher_profile_id", teacher.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
