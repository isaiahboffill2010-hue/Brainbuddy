import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/openai/client";
import { fetchBillingProfile } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId, subjectId } = await req.json();
  if (!studentId || !subjectId) {
    return NextResponse.json({ error: "studentId and subjectId required" }, { status: 400 });
  }

  const service = createServiceClient();

  const billingProfile = await fetchBillingProfile(service, user.id);
  const isPremium = billingProfile?.plan === "premium";
  const quizzesUsed = billingProfile?.quizzes_used ?? 0;
  const quizLimit = billingProfile?.quiz_limit ?? 1;

  if (!isPremium && quizzesUsed >= quizLimit) {
    return NextResponse.json(
      {
        error: "quiz_limit_reached",
        message: "You used your free practice quiz. Upgrade to BrainBuddy Premium for unlimited practice quizzes and personalized tutoring.",
      },
      { status: 403 }
    );
  }

  const [studentRes, progressRes, notesRes, subjectRes] = await Promise.all([
    service
      .from("students")
      .select("name, age, grade, learning_style, confidence_level, interests")
      .eq("id", studentId)
      .single(),
    service
      .from("student_subject_progress")
      .select("topics_struggling, topics_mastered, session_count")
      .eq("student_id", studentId)
      .eq("subject_id", subjectId)
      .maybeSingle(),
    service
      .from("student_notes")
      .select("topic, note")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10),
    service
      .from("subjects")
      .select("name")
      .eq("id", subjectId)
      .single(),
  ]);

  const student = studentRes.data as {
    name: string; age: number | null; grade: string;
    learning_style: string; confidence_level: number; interests: string | null;
  } | null;

  const progress = progressRes.data as {
    topics_struggling: string[] | null;
    topics_mastered: string[] | null;
    session_count: number;
  } | null;

  const notes = (notesRes.data ?? []) as { topic: string | null; note: string }[];
  const subject = subjectRes.data as { name: string } | null;

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const subjectName = subject?.name ?? "General";
  const weakTopics = (progress?.topics_struggling ?? []).filter(Boolean);
  const recentNoteTopics = notes
    .map((n) => n.topic ?? n.note.slice(0, 60))
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");

  const prompt = `You are generating personalized multiple-choice practice questions for a student named ${student.name} in ${student.grade}.

Subject: ${subjectName}
This student STRUGGLES with: ${weakTopics.length > 0 ? weakTopics.join(", ") : "general concepts in this subject"}
Their notes show they had trouble with: ${recentNoteTopics || "no recent notes available"}

Generate exactly 6 multiple-choice questions. Focus on the weak topics first.
Make questions grade-appropriate and clear.

Return ONLY this JSON (no other text):
{
  "focusTopic": "the main weak area you are targeting (short phrase)",
  "questions": [
    {
      "topic": "specific topic this question covers",
      "question": "the question text",
      "choices": ["choice A", "choice B", "choice C", "choice D"],
      "correctIndex": 0,
      "explanation": "why this answer is correct (1-2 short sentences)"
    }
  ]
}

If there are no known weak topics, pick foundational topics for the subject and grade level.`;

  let raw = "{}";
  try {
    const completion = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    raw = completion.content[0]?.type === "text" ? completion.content[0].text : "{}";
  } catch (error) {
    console.error("Practice question generation failed", error);
    return NextResponse.json(
      {
        error: "practice_generation_failed",
        message: "BrainBuddy could not generate practice questions right now. Try again in a minute.",
      },
      { status: 500 }
    );
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let parsed: { focusTopic?: string; questions?: unknown[] };
  try {
    parsed = JSON.parse(jsonMatch?.[0] ?? "{}");
  } catch {
    return NextResponse.json(
      {
        error: "practice_parse_failed",
        message: "BrainBuddy had trouble building those questions. Try again.",
      },
      { status: 500 }
    );
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    return NextResponse.json(
      {
        error: "practice_questions_empty",
        message: "BrainBuddy did not return practice questions. Try again.",
      },
      { status: 500 }
    );
  }

  if (!isPremium) {
    const { error: usageError } = await service
      .from("profiles")
      .update({ quizzes_used: quizzesUsed + 1 })
      .eq("user_id", user.id);

    if (usageError) {
      console.error("Failed to update practice quiz usage", usageError);
    }
  }

  return NextResponse.json({
    focusTopic: parsed.focusTopic ?? subjectName,
    weakTopics,
    questions: parsed.questions ?? [],
  });
}
