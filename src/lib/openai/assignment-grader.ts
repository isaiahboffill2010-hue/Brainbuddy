import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { anthropic } from "./client";

type Client = SupabaseClient<Database, "public", any>;

export type AssignmentProgressContext = {
  studentAssignmentId: string;
  studentId: string;
  assignmentTitle: string;
  totalPoints: number;
  expectedQuestionCount: number;
};

type ExtractedAssignmentProgress = {
  completed?: boolean;
  totalQuestions?: number;
  totalCorrect?: number;
  missedQuestions?: { question: string; reason?: string; correctAnswer?: string }[];
  summary?: string;
};

function toSafeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function updateAssignmentProgressFromConversation(params: {
  supabase: Client;
  context: AssignmentProgressContext;
  conversation: string[];
}) {
  const { supabase, context, conversation } = params;
  if (conversation.length < 2) return;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    system:
      "You extract assignment progress from a student tutoring conversation. Return JSON only. " +
      "Only mark completed true when the student has clearly finished the whole assignment or the tutor gave a final assignment report.",
    messages: [
      {
        role: "user",
        content:
          `Assignment: ${context.assignmentTitle}\n` +
          `Teacher total points: ${context.totalPoints}\n\n` +
          `Expected question count: ${context.expectedQuestionCount}\n` +
          `If the worksheet has lettered parts like 1a and 1b, count each lettered part as a separate question.\n` +
          `Do not mark completed true unless at least the expected question count has been attempted or graded.\n\n` +
          `Conversation:\n${conversation.join("\n")}\n\n` +
          `Return JSON in this shape:\n` +
          `{"completed":false,"totalQuestions":0,"totalCorrect":0,"missedQuestions":[{"question":"1","reason":"...","correctAnswer":"..."}],"summary":"short teacher-facing summary"}`,
      },
    ],
    max_tokens: 500,
  });

  const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}";
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const extracted = JSON.parse(jsonMatch?.[0] ?? "{}") as ExtractedAssignmentProgress;

  const expectedQuestionCount = toSafeNumber(context.expectedQuestionCount);
  const extractedTotalQuestions = toSafeNumber(extracted.totalQuestions);
  const totalQuestions = expectedQuestionCount > 0
    ? Math.max(extractedTotalQuestions, expectedQuestionCount)
    : extractedTotalQuestions;
  const totalCorrect = clamp(toSafeNumber(extracted.totalCorrect), 0, totalQuestions || Number.MAX_SAFE_INTEGER);
  const totalPoints = Math.max(0, Math.round(context.totalPoints || 0));
  const canComplete = Boolean(extracted.completed) && (
    expectedQuestionCount === 0 || extractedTotalQuestions >= expectedQuestionCount
  );
  const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 10000) / 100 : 0;
  const score = totalQuestions > 0 && totalPoints > 0
    ? Math.round((totalCorrect / totalQuestions) * totalPoints)
    : totalCorrect;

  const update: Database["public"]["Tables"]["student_assignments"]["Update"] = {
    status: canComplete ? "completed" : "in_progress",
    ai_summary: extracted.summary ?? null,
    updated_at: new Date().toISOString(),
  };

  if (totalQuestions > 0) {
    update.total_questions = totalQuestions;
    update.total_correct = totalCorrect;
    update.score = score;
    update.percentage = percentage;
    update.missed_questions = (extracted.missedQuestions ?? []) as Json;
  }

  if (canComplete) {
    update.completed_at = new Date().toISOString();
  }

  await supabase
    .from("student_assignments")
    .update(update)
    .eq("id", context.studentAssignmentId)
    .eq("student_id", context.studentId);
}
