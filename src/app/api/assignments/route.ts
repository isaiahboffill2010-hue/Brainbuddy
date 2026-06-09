import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getPrimaryStudentIdForProfile } from "@/lib/supabase/queries/classes";

type RawAssignment = {
  id: string;
  title: string;
  subject: string;
  instructions: string | null;
  due_date: string | null;
  total_points: number;
  status: string;
  created_at: string;
};

type RawStudentAssignment = {
  id: string;
  assignment_id: string;
  status: string;
  total_questions: number;
  created_at: string;
  assignments: RawAssignment | RawAssignment[] | null;
};

type RawWorksheet = {
  assignment_id: string;
  page_number: number;
  file_name: string;
  file_url: string;
};

function getJoinedAssignment(value: RawStudentAssignment["assignments"]) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

function isMissingAssignmentSchema(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return error.code === "PGRST205" || message.includes("schema cache") || message.includes("Could not find the table");
}

async function isStudentForProfile(studentId: string, profileId: string) {
  const service = createServiceClient();

  const { data: linkedStudent } = await service
    .from("parents_students")
    .select("student_id")
    .eq("parent_id", profileId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (linkedStudent) return true;

  const { data: ownStudent } = await service
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .eq("id", studentId)
    .maybeSingle();

  return Boolean(ownStudent);
}

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
  if (!profileId) return NextResponse.json([]);

  const { searchParams } = new URL(req.url);
  const requestedStudentId = searchParams.get("studentId");
  const studentId = requestedStudentId
    ? ((await isStudentForProfile(requestedStudentId, profileId)) ? requestedStudentId : null)
    : await getPrimaryStudentIdForProfile(service, profileId);

  if (!studentId) return NextResponse.json([]);

  const { data, error } = await service
    .from("student_assignments")
    .select(
      "id, assignment_id, status, total_questions, created_at, assignments(id, title, subject, instructions, due_date, total_points, status, created_at)"
    )
    .eq("student_id", studentId)
    .in("status", ["assigned", "in_progress"])
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingAssignmentSchema(error)) {
      return NextResponse.json({ setupRequired: true, assignments: [] });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const assignmentIds = ((data ?? []) as unknown as RawStudentAssignment[]).map((row) => row.assignment_id);
  const worksheetsByAssignment = new Map<string, RawWorksheet[]>();

  if (assignmentIds.length > 0) {
    const { data: worksheetRows, error: worksheetError } = await service
      .from("assignment_worksheets")
      .select("assignment_id, page_number, file_name, file_url")
      .in("assignment_id", assignmentIds)
      .order("page_number", { ascending: true });

    if (worksheetError && !isMissingAssignmentSchema(worksheetError)) {
      return NextResponse.json({ error: worksheetError.message }, { status: 500 });
    }

    for (const worksheet of (worksheetRows ?? []) as RawWorksheet[]) {
      const existing = worksheetsByAssignment.get(worksheet.assignment_id) ?? [];
      existing.push(worksheet);
      worksheetsByAssignment.set(worksheet.assignment_id, existing);
    }
  }

  const assignments = ((data ?? []) as unknown as RawStudentAssignment[])
    .map((row) => {
      const assignment = getJoinedAssignment(row.assignments);
      if (!assignment) return null;

      return {
        id: assignment.id,
        studentAssignmentId: row.id,
        title: assignment.title,
        subject: assignment.subject,
        instructions: assignment.instructions,
        dueDate: assignment.due_date,
        totalPoints: assignment.total_points,
        expectedQuestionCount: row.total_questions || assignment.total_points,
        status: row.status,
        assignedAt: row.created_at,
        worksheets: worksheetsByAssignment.get(assignment.id) ?? [],
      };
    })
    .filter(Boolean);

  return NextResponse.json(assignments);
}
