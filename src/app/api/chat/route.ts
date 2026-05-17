import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createSession } from "@/lib/supabase/queries/sessions";
import { buildSessionIntroMessage } from "@/lib/openai/prompts";

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

  if (session?.id) {
    const { data: student, error: studentError } = await service
      .from("students")
      .select(
        "name, age, grade, learning_style, confidence_level, interests, personality, struggles_with, learning_description, stuck_behavior, confusion_support, error_feedback, teaching_pace, motivation, teaching_avoid"
      )
      .eq("id", studentId)
      .single();

    const { data: subject } = await service
      .from("subjects")
      .select("name")
      .eq("id", subjectId)
      .single();

    if (!student || studentError) {
      console.error("[chat/POST] could not load student profile", studentError);
    } else {
      const introMessage = buildSessionIntroMessage({
        studentName: student.name,
        grade: student.grade,
        age: student.age ?? 10,
        learningStyle: student.learning_style,
        confidenceLevel: student.confidence_level,
        subjectName: subject?.name ?? "your subject",
        interests: student.interests,
        personality: student.personality,
        strugglesWith: student.struggles_with,
        learningDescription: student.learning_description,
        stuckBehavior: student.stuck_behavior,
        confusionSupport: student.confusion_support,
        errorFeedback: student.error_feedback,
        teachingPace: student.teaching_pace,
        motivation: student.motivation,
        teachingAvoid: student.teaching_avoid,
      });

      await service.from("ai_messages").insert({
        session_id: session.id,
        role: "assistant",
        content: introMessage,
      });
    }
  }

  return NextResponse.json(session, { status: 201 });
}
