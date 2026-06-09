import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

type AssignmentStatus = "draft" | "assigned";
type HelpLevel = "hints_only" | "explain_then_ask" | "attempt_first" | "practice_mode" | "quiz_mode";
const helpLevels = new Set<HelpLevel>([
  "hints_only",
  "explain_then_ask",
  "attempt_first",
  "practice_mode",
  "quiz_mode",
]);

type QuestionPayload = {
  questionNumber?: unknown;
  questionLabel?: unknown;
  questionText?: unknown;
  correctAnswer?: unknown;
  explanation?: unknown;
  points?: unknown;
};

type AssignmentRequestBody = Record<string, unknown>;

type ParsedAssignmentRequest = {
  body: AssignmentRequestBody;
  worksheetFiles: File[];
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanOptionalText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function cleanPoints(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 1;
  return Math.round(parsed);
}

function cleanHelpLevel(value: unknown): HelpLevel {
  const text = cleanText(value) as HelpLevel;
  return helpLevels.has(text) ? text : "attempt_first";
}

function parseQuestions(value: unknown): QuestionPayload[] {
  if (Array.isArray(value)) return value as QuestionPayload[];
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as QuestionPayload[]) : [];
  } catch {
    return [];
  }
}

function isWorksheetFile(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "worksheet";
}

function isMissingAssignmentSchema(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  return error.code === "PGRST205" || message.includes("schema cache") || message.includes("Could not find the table");
}

async function parseAssignmentRequest(req: Request): Promise<ParsedAssignmentRequest> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const body: AssignmentRequestBody = {};

    for (const key of ["classId", "title", "subject", "status", "dueDate", "totalPoints", "instructions", "teacherNote", "helpLevel", "questions"]) {
      body[key] = formData.get(key);
    }

    return {
      body,
      worksheetFiles: formData.getAll("worksheets").filter(isWorksheetFile),
    };
  }

  return {
    body: await req.json().catch(() => ({})),
    worksheetFiles: [],
  };
}

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

export async function POST(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getTeacherProfile(user.id);
  if (!teacher) return NextResponse.json({ error: "Teacher account required" }, { status: 403 });

  const { body, worksheetFiles } = await parseAssignmentRequest(req);
  const classId = cleanText(body.classId);
  const title = cleanText(body.title);
  const subject = cleanText(body.subject) || "General";
  const status = cleanText(body.status) as AssignmentStatus;
  const questions = parseQuestions(body.questions);

  if (!classId) return NextResponse.json({ error: "Class is required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "Assignment title is required" }, { status: 400 });
  if (status !== "draft" && status !== "assigned") {
    return NextResponse.json({ error: "Assignment status must be draft or assigned" }, { status: 400 });
  }

  const normalizedQuestions = questions.map((question, index) => {
    const questionText = cleanText(question.questionText);
    const correctAnswer = cleanText(question.correctAnswer);
    return {
      question_number: Number(question.questionNumber) || index + 1,
      question_label: cleanText(question.questionLabel) || String(index + 1),
      question_text: questionText,
      correct_answer: correctAnswer,
      explanation: cleanOptionalText(question.explanation),
      points: cleanPoints(question.points),
    };
  });

  const invalidQuestionIndex = normalizedQuestions.findIndex(
    (question) => !question.question_text || !question.correct_answer
  );
  if (invalidQuestionIndex >= 0) {
    return NextResponse.json(
      { error: `Question ${invalidQuestionIndex + 1} needs question text and a correct answer` },
      { status: 400 }
    );
  }

  const { data: classRow, error: classError } = await service
    .from("teacher_classes")
    .select("id, teacher_profile_id, grade_level")
    .eq("id", classId)
    .eq("teacher_profile_id", teacher.id)
    .maybeSingle();

  if (classError) return NextResponse.json({ error: classError.message }, { status: 500 });
  if (!classRow) return NextResponse.json({ error: "Class not found" }, { status: 404 });

  const questionPointTotal = normalizedQuestions.reduce((sum, question) => sum + question.points, 0);
  const requestedTotalPoints = Number(body.totalPoints);
  const totalPoints =
    Number.isFinite(requestedTotalPoints) && requestedTotalPoints >= 0
      ? Math.round(requestedTotalPoints)
      : questionPointTotal;
  const expectedQuestionCount = normalizedQuestions.length > 0 ? normalizedQuestions.length : totalPoints;

  const { data: assignment, error: assignmentError } = await service
    .from("assignments")
    .insert({
      teacher_id: teacher.id,
      class_id: classId,
      title,
      subject,
      grade_level: (classRow as { grade_level: string | null }).grade_level,
      instructions: cleanOptionalText(body.instructions),
      teacher_note: cleanOptionalText(body.teacherNote),
      source_type: worksheetFiles.length > 0 ? "uploaded_worksheet" : "manual",
      help_level: cleanHelpLevel(body.helpLevel),
      due_date: cleanOptionalText(body.dueDate),
      total_points: totalPoints,
      status,
    })
    .select("id, status")
    .single();

  if (assignmentError) {
    if (isMissingAssignmentSchema(assignmentError)) {
      return NextResponse.json(
        { error: "Assignment tables need to be set up in Supabase before saving assignments." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: assignmentError.message }, { status: 500 });
  }

  const assignmentId = assignment.id;
  const uploadedWorksheetPaths: string[] = [];

  if (worksheetFiles.length > 0) {
    const worksheetRows = [];

    for (const [index, file] of worksheetFiles.entries()) {
      const path = `teacher-worksheets/${teacher.id}/${assignmentId}/${index + 1}-${Date.now()}-${sanitizeFileName(file.name)}`;
      const bytes = await file.arrayBuffer();
      const { error: uploadError } = await service.storage
        .from("homework")
        .upload(path, bytes, { contentType: file.type || "application/octet-stream", upsert: false });

      if (uploadError) {
        if (uploadedWorksheetPaths.length > 0) await service.storage.from("homework").remove(uploadedWorksheetPaths);
        await service.from("assignments").delete().eq("id", assignmentId);
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      uploadedWorksheetPaths.push(path);
      const { data: { publicUrl } } = service.storage.from("homework").getPublicUrl(path);
      worksheetRows.push({
        assignment_id: assignmentId,
        page_number: index + 1,
        file_name: file.name,
        file_url: publicUrl,
        storage_path: path,
        file_type: file.type || null,
        file_size: file.size,
      });
    }

    const { error: worksheetsError } = await service.from("assignment_worksheets").insert(worksheetRows);
    if (worksheetsError) {
      if (uploadedWorksheetPaths.length > 0) await service.storage.from("homework").remove(uploadedWorksheetPaths);
      await service.from("assignments").delete().eq("id", assignmentId);
      if (isMissingAssignmentSchema(worksheetsError)) {
        return NextResponse.json(
          { error: "Assignment worksheet tables need to be set up in Supabase before saving worksheet uploads." },
          { status: 503 }
        );
      }

      return NextResponse.json({ error: worksheetsError.message }, { status: 500 });
    }
  }

  if (normalizedQuestions.length > 0) {
    const { error: questionsError } = await service
      .from("assignment_questions")
      .insert(normalizedQuestions.map((question) => ({ assignment_id: assignmentId, ...question })));

    if (questionsError) {
      await service.from("assignments").delete().eq("id", assignmentId);
      return NextResponse.json({ error: questionsError.message }, { status: 500 });
    }
  }

  let assignedStudents = 0;

  if (status === "assigned") {
    const { data: enrollmentRows, error: enrollmentError } = await service
      .from("class_enrollments")
      .select("student_id")
      .eq("class_id", classId);

    if (enrollmentError) {
      await service.from("assignments").delete().eq("id", assignmentId);
      return NextResponse.json({ error: enrollmentError.message }, { status: 500 });
    }

    const studentRows = ((enrollmentRows ?? []) as { student_id: string }[]).filter((row) => row.student_id);
    assignedStudents = studentRows.length;

    if (studentRows.length > 0) {
      const { error: studentAssignmentsError } = await service.from("student_assignments").insert(
        studentRows.map((row) => ({
          assignment_id: assignmentId,
          student_id: row.student_id,
          class_id: classId,
          status: "assigned" as const,
          total_questions: expectedQuestionCount,
        }))
      );

      if (studentAssignmentsError) {
        await service.from("assignments").delete().eq("id", assignmentId);
        if (isMissingAssignmentSchema(studentAssignmentsError)) {
          return NextResponse.json(
            { error: "Student assignment tables need to be set up in Supabase before assigning to a class." },
            { status: 503 }
          );
        }

        return NextResponse.json({ error: studentAssignmentsError.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json(
    {
      id: assignmentId,
      status: assignment.status,
      questionCount: normalizedQuestions.length,
      worksheetCount: worksheetFiles.length,
      assignedStudents,
    },
    { status: 201 }
  );
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const teacher = await getTeacherProfile(user.id);
  if (!teacher) return NextResponse.json({ error: "Teacher account required" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const assignmentId = cleanText(searchParams.get("assignmentId") ?? body.assignmentId);

  if (!assignmentId) {
    return NextResponse.json({ error: "Assignment is required" }, { status: 400 });
  }

  const { data: assignment, error: assignmentError } = await service
    .from("assignments")
    .select("id, teacher_id")
    .eq("id", assignmentId)
    .eq("teacher_id", teacher.id)
    .maybeSingle();

  if (assignmentError) {
    if (isMissingAssignmentSchema(assignmentError)) {
      return NextResponse.json(
        { error: "Assignment tables need to be set up in Supabase before deleting assignments." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: assignmentError.message }, { status: 500 });
  }

  if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const { data: worksheetRows } = await service
    .from("assignment_worksheets")
    .select("storage_path")
    .eq("assignment_id", assignmentId);

  const storagePaths = ((worksheetRows ?? []) as { storage_path: string | null }[])
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length > 0) {
    await service.storage.from("homework").remove(storagePaths);
  }

  const { error: deleteError } = await service
    .from("assignments")
    .delete()
    .eq("id", assignmentId)
    .eq("teacher_id", teacher.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
