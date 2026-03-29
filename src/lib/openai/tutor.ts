import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { anthropic } from "./client";
import { buildSystemPrompt, buildMemoryExtractionPrompt } from "./prompts";
import { getStudent } from "@/lib/supabase/queries/students";
import { getProgressForSubject } from "@/lib/supabase/queries/progress";
import { getLastSessionSummary } from "@/lib/supabase/queries/sessions";
import { getRecentMessages } from "@/lib/supabase/queries/messages";
import type { TutorContext } from "@/types/app";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, "public", any>;

export async function streamTutorResponse(params: {
  sessionId: string;
  studentId: string;
  subjectId: string;
  subjectName: string;
  userMessage: string;
  imageUrl?: string;
  supabase: Client;
}): Promise<ReadableStream<Uint8Array>> {
  const { sessionId, studentId, subjectId, subjectName, userMessage, imageUrl, supabase } = params;

  const hasSubject = Boolean(subjectId);

  // 1. Load student context
  const [student, progress, learningNotes] = await Promise.all([
    getStudent(supabase, studentId),
    hasSubject ? getProgressForSubject(supabase, studentId, subjectId) : Promise.resolve(null),
    hasSubject ? getLastSessionSummary(supabase, studentId, subjectId) : Promise.resolve(null),
  ]);

  const context: TutorContext = {
    studentName: student.name,
    grade: student.grade,
    age: student.age ?? 10,
    learningStyle: student.learning_style,
    confidenceLevel: student.confidence_level,
    subjectName,
    topicsMastered: progress?.topics_mastered ?? [],
    topicsStruggling: progress?.topics_struggling ?? [],
    learningNotes,
    interests: student.interests,
    personality: student.personality,
    strugglesWith: student.struggles_with,
    learningDescription: student.learning_description,
  };

  // 2. Build system prompt
  const systemPrompt = buildSystemPrompt(context);

  // 3. Load recent message history (last 20)
  const history = await getRecentMessages(supabase, sessionId, 20);

  // 4. Build messages array
  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } }
    | { type: "image"; source: { type: "url"; url: string } };

  type AnthropicMessage = {
    role: "user" | "assistant";
    content: string | ContentBlock[];
  };

  // Build last user message content (with optional image)
  let lastUserContent: string | ContentBlock[];
  if (imageUrl) {
    if (imageUrl.startsWith("data:")) {
      // Base64 data URL — extract media type and data
      const [header, data] = imageUrl.split(",");
      const mediaType = (header.match(/data:(image\/\w+);/)?.[1] ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      lastUserContent = [
        { type: "image", source: { type: "base64", media_type: mediaType, data } },
        { type: "text", text: userMessage },
      ];
    } else {
      lastUserContent = [
        { type: "image", source: { type: "url", url: imageUrl } },
        { type: "text", text: userMessage },
      ];
    }
  } else {
    lastUserContent = userMessage;
  }

  const messages: AnthropicMessage[] = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: lastUserContent },
  ];

  // 5. Stream from Claude
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    system: systemPrompt,
    messages: messages as Parameters<typeof anthropic.messages.stream>[0]["messages"],
    max_tokens: 600,
  });

  // 6. Return ReadableStream
  let fullResponse = "";
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            if (text) {
              fullResponse += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
        return;
      }

      // Background: update learning memory
      if (hasSubject) {
        updateLearningMemory({
          supabase,
          sessionId,
          studentId,
          subjectId,
          conversation: [
            ...history.map((m) => `${m.role}: ${m.content}`),
            `user: ${userMessage}`,
            `assistant: ${fullResponse}`,
          ],
        }).catch(console.error);
      }
    },
  });

  return readable;
}

async function updateLearningMemory(params: {
  supabase: Client;
  sessionId: string;
  studentId: string;
  subjectId: string;
  conversation: string[];
}) {
  const { supabase, sessionId, studentId, subjectId, conversation } = params;

  if (conversation.length < 4) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  type ProgressRow = Database["public"]["Tables"]["student_subject_progress"]["Row"];

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      system: buildMemoryExtractionPrompt(),
      messages: [{ role: "user", content: conversation.join("\n") }],
      max_tokens: 300,
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const extracted = JSON.parse(jsonMatch?.[0] ?? "{}") as {
      mastered?: string[];
      struggling?: string[];
      note?: string;
    };

    await db
      .from("ai_sessions")
      .update({
        learning_notes: extracted.note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    const { data: prevData } = await db
      .from("student_subject_progress")
      .select("topics_mastered, topics_struggling, session_count")
      .eq("student_id", studentId)
      .eq("subject_id", subjectId)
      .single();

    const prev = prevData as Pick<ProgressRow, "topics_mastered" | "topics_struggling" | "session_count"> | null;
    const newMastered = Array.from(
      new Set([...(prev?.topics_mastered ?? []), ...(extracted.mastered ?? [])])
    );
    const newStruggling = Array.from(
      new Set([...(prev?.topics_struggling ?? []), ...(extracted.struggling ?? [])])
    ).filter((t) => !newMastered.includes(t));

    await db
      .from("student_subject_progress")
      .upsert(
        {
          student_id: studentId,
          subject_id: subjectId,
          topics_mastered: newMastered,
          topics_struggling: newStruggling,
          session_count: (prev?.session_count ?? 0) + 1,
          last_session_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,subject_id" }
      );
  } catch (e) {
    console.error("Memory update failed:", e);
  }
}
