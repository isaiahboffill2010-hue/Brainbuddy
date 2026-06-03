import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { normalizeTopicKey } from "@/lib/progress/mastery";

type SubmittedAttempt = {
  topic?: string;
  question?: string;
  selectedIndex?: number;
  correctIndex?: number;
  isCorrect?: boolean;
  masteryCheck?: boolean;
  integrityFlagged?: boolean;
};

function cleanAttempt(attempt: SubmittedAttempt) {
  const topic = attempt.topic?.trim();
  const selectedIndex = Number(attempt.selectedIndex);
  const correctIndex = Number(attempt.correctIndex);

  if (!topic || !Number.isInteger(selectedIndex) || !Number.isInteger(correctIndex)) {
    return null;
  }

  return {
    topic,
    topic_key: normalizeTopicKey(topic),
    question_text: attempt.question?.trim() || null,
    selected_index: selectedIndex,
    correct_index: correctIndex,
    is_correct: Boolean(attempt.isCorrect),
    mastery_check: Boolean(attempt.masteryCheck),
    integrity_flagged: Boolean(attempt.integrityFlagged),
  };
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const studentId = String(body.studentId ?? "");
  const subjectId = String(body.subjectId ?? "");
  const attempts = Array.isArray(body.attempts) ? (body.attempts as SubmittedAttempt[]) : [];

  if (!studentId || !subjectId || attempts.length === 0) {
    return NextResponse.json({ error: "studentId, subjectId, and attempts are required" }, { status: 400 });
  }

  const { data: profileData } = await service
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileData as { id: string } | null;
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const [{ data: parentLink }, { data: directStudent }] = await Promise.all([
    service
      .from("parents_students")
      .select("student_id")
      .eq("parent_id", profile.id)
      .eq("student_id", studentId)
      .maybeSingle(),
    service
      .from("students")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("id", studentId)
      .maybeSingle(),
  ]);

  if (!parentLink && !directStudent) {
    return NextResponse.json({ error: "Student not found for this account" }, { status: 403 });
  }

  const rows = attempts
    .map((attempt: SubmittedAttempt) => cleanAttempt(attempt))
    .filter((attempt): attempt is NonNullable<ReturnType<typeof cleanAttempt>> => Boolean(attempt))
    .map((attempt) => ({
      student_id: studentId,
      subject_id: subjectId,
      ...attempt,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "No completed attempts to save" }, { status: 400 });
  }

  const { error } = await service.from("quiz_question_attempts").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, saved: rows.length });
}
