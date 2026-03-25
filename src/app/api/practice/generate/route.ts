import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai/client";

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

  // Fetch student, subject progress, and recent notes in parallel
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { focusTopic?: string; questions?: unknown[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  return NextResponse.json({
    focusTopic: parsed.focusTopic ?? subjectName,
    weakTopics,
    questions: parsed.questions ?? [],
  });
}
