import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { openai } from "./client";
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

  // Treat empty string as "no subject" (e.g. intro session)
  const hasSubject = Boolean(subjectId);

  // 1. Load student context — skip subject-specific queries when no subject
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
  type OpenAIMessage = {
    role: "system" | "user" | "assistant";
    content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  };

  const messages: OpenAIMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: imageUrl
        ? [
            { type: "image_url", image_url: { url: imageUrl } },
            { type: "text", text: userMessage },
          ]
        : userMessage,
    },
  ];

  // 5. Stream from OpenAI
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages as Parameters<typeof openai.chat.completions.create>[0]["messages"],
    stream: true,
    max_tokens: 600,
    temperature: 0.3,
  });

  // 6. Return ReadableStream — properly handle errors so the client isn't left hanging
  let fullResponse = "";
  const encoder = new TextEncoder();

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (e) {
        // Signal the error to the client so it doesn't hang
        controller.error(e);
        return;
      }

      // Background: update learning memory only when there is a real subject
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

  if (conversation.length < 4) return; // Not enough data yet

  // Cast to any for direct .from() calls — SupabaseClient<Database> inference
  // breaks when passed as a parameter (known @supabase/supabase-js TS issue).
  // The runtime behaviour is correct; this is purely a type workaround.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  type ProgressRow = Database["public"]["Tables"]["student_subject_progress"]["Row"];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildMemoryExtractionPrompt() },
        { role: "user", content: conversation.join("\n") },
      ],
      max_tokens: 300,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const extracted = JSON.parse(raw) as {
      mastered?: string[];
      struggling?: string[];
      note?: string;
    };

    // Update session learning notes
    await db
      .from("ai_sessions")
      .update({
        learning_notes: extracted.note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    // Update subject progress (merge arrays, deduplicate)
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
    // Remove from struggling if now mastered
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
