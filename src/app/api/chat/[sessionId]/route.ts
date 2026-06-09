import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { streamTutorResponse } from "@/lib/openai/tutor";
import { generateNote } from "@/lib/openai/note-generator";
import { getSession } from "@/lib/supabase/queries/sessions";
import { saveMessage } from "@/lib/supabase/queries/messages";
import { saveNote, getNotesForSession } from "@/lib/supabase/queries/notes";
import { fetchBillingProfile } from "@/lib/billing";
import { updateAssignmentProgressFromConversation } from "@/lib/openai/assignment-grader";

export const runtime = "nodejs";

// ── Profanity filter ──────────────────────────────────────────────────────
const BANNED_WORDS = [
  "fuck","shit","bitch","ass","asshole","bastard","damn","crap","piss","dick",
  "cock","pussy","cunt","whore","slut","fag","faggot","nigger","nigga","kike",
  "spic","chink","gook","retard","dyke","tranny","wetback","cracker","honky",
];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = lower.split(/\s+/);
  return words.some((w) => BANNED_WORDS.includes(w));
}

function profanityStream(): ReadableStream<Uint8Array> {
  const msg = "NO SAYING CURSE WORDS GUYS!! 🚫";
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(msg));
      controller.close();
    },
  });
}

type AssignmentChatContext = {
  assignmentId?: string;
  studentAssignmentId?: string;
  title?: string;
  subject?: string | null;
  instructions?: string | null;
  totalPoints?: number | null;
  expectedQuestionCount?: number | null;
  worksheetCount?: number;
};

type AssignmentWorksheetForVision = {
  page_number: number;
  file_name: string;
  storage_path: string | null;
  file_type: string | null;
};

function cleanAssignmentContext(value: unknown): AssignmentChatContext | null {
  if (!value || typeof value !== "object") return null;
  const context = value as AssignmentChatContext;
  if (!context.assignmentId || !context.studentAssignmentId || !context.title) return null;

  return {
    assignmentId: String(context.assignmentId),
    studentAssignmentId: String(context.studentAssignmentId),
    title: String(context.title),
    subject: context.subject ? String(context.subject) : null,
    instructions: context.instructions ? String(context.instructions) : null,
    totalPoints: Number(context.totalPoints) || 0,
    expectedQuestionCount: Number(context.expectedQuestionCount) || Number(context.totalPoints) || 0,
    worksheetCount: Number(context.worksheetCount) || 0,
  };
}

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function getWorksheetMediaType(worksheet: AssignmentWorksheetForVision, downloadedType?: string | null) {
  const storedType = (worksheet.file_type ?? "").toLowerCase();
  const blobType = (downloadedType ?? "").toLowerCase();
  if (supportedImageTypes.has(storedType)) return storedType;
  if (supportedImageTypes.has(blobType)) return blobType;

  const lowerName = worksheet.file_name.toLowerCase();
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".gif")) return "image/gif";
  if (lowerName.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

async function loadAssignmentWorksheetImages(params: {
  service: ReturnType<typeof createServiceClient>;
  assignmentContext: AssignmentChatContext | null;
  studentId: string;
}) {
  const { service, assignmentContext, studentId } = params;
  if (!assignmentContext?.assignmentId || !assignmentContext.studentAssignmentId) return [];

  const { data: studentAssignment } = await service
    .from("student_assignments")
    .select("assignment_id")
    .eq("id", assignmentContext.studentAssignmentId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!studentAssignment || studentAssignment.assignment_id !== assignmentContext.assignmentId) return [];

  const { data: worksheets, error } = await service
    .from("assignment_worksheets")
    .select("page_number, file_name, storage_path, file_type")
    .eq("assignment_id", assignmentContext.assignmentId)
    .order("page_number", { ascending: true });

  if (error || !worksheets) return [];

  const imageDataUrls: string[] = [];
  for (const worksheet of worksheets as AssignmentWorksheetForVision[]) {
    if (!worksheet.storage_path) continue;

    const { data: blob, error: downloadError } = await service.storage
      .from("homework")
      .download(worksheet.storage_path);

    if (downloadError || !blob) continue;

    const bytes = await blob.arrayBuffer();
    if (bytes.byteLength === 0) continue;

    const mediaType = getWorksheetMediaType(worksheet, blob.type);
    imageDataUrls.push(`data:${mediaType};base64,${Buffer.from(bytes).toString("base64")}`);
  }

  return imageDataUrls;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const billingProfile = await fetchBillingProfile(service, user.id);
  const isPremium = billingProfile?.plan === "premium";
  const messagesUsed = billingProfile?.messages_used ?? 0;
  const messageLimit = billingProfile?.message_limit ?? 15;

  if (!isPremium && messagesUsed >= messageLimit) {
    return NextResponse.json(
      {
        error: "message_limit_reached",
        message: "You used all 15 free AI tutor messages. Upgrade to BrainBuddy Premium for $20/month to keep learning with your personal AI tutor.",
      },
      { status: 403 }
    );
  }

  if (!isPremium) {
    await service.from("profiles").update({ messages_used: messagesUsed + 1 }).eq("user_id", user.id);
  }

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return NextResponse.json(messages ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const service = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, imageUrl, imageDataUrl, imageUrls, assignmentContext: rawAssignmentContext } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // imageDataUrl is a base64 data URL from the snip flow — sent directly to OpenAI,
  // never persisted to storage. imageUrl is a persistent Supabase Storage URL.
  // OpenAI's vision API accepts both formats natively.
  const resolvedImageUrl: string | undefined = imageUrl ?? imageDataUrl ?? undefined;
  const clientImageUrls = Array.isArray(imageUrls)
    ? imageUrls.filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    : [];
  const assignmentContext = cleanAssignmentContext(rawAssignmentContext);

  // Get session to find student + subject
  const session = await getSession(supabase, sessionId).catch(() => null);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const sessionWithSubject = session as typeof session & {
    subjects: { name: string; icon: string; color: string } | null;
  };

  // Save user message — only persist a URL if it came from storage (not ephemeral base64)
  await saveMessage(service, {
    session_id: sessionId,
    role: "user",
    content: message,
    image_url: imageUrl ?? null,
  });

  if (assignmentContext?.studentAssignmentId) {
    await service
      .from("student_assignments")
      .update({
        status: "in_progress",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentContext.studentAssignmentId)
      .eq("student_id", session.student_id)
      .neq("status", "completed");
  }

  // Profanity check — block and warn before calling AI
  if (containsProfanity(message)) {
    const warningText = "NO SAYING CURSE WORDS GUYS!! 🚫";
    saveMessage(service, {
      session_id: sessionId,
      role: "assistant",
      content: warningText,
    }).catch(console.error);
    return new Response(profanityStream(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
      },
    });
  }

  const assignmentWorksheetImages = await loadAssignmentWorksheetImages({
    service,
    assignmentContext,
    studentId: session.student_id,
  });
  const expectedWorksheetCount = assignmentContext?.worksheetCount ?? 0;
  const resolvedImageUrls = uniqueStrings(
    expectedWorksheetCount > 0 && assignmentWorksheetImages.length >= expectedWorksheetCount
      ? assignmentWorksheetImages
      : [...assignmentWorksheetImages, ...clientImageUrls]
  );
  const modelUserMessage =
    assignmentContext && resolvedImageUrls.length > 0
      ? `${message}\n\nTeacher-uploaded worksheet image(s) are attached to this message as vision input. Use those worksheet image(s) as the source of truth for the assignment.`
      : message;

  // Stream AI response
  const stream = await streamTutorResponse({
    sessionId,
    studentId: session.student_id,
    subjectId: session.subject_id ?? "",
    subjectName: sessionWithSubject.subjects?.name ?? "General",
    userMessage: modelUserMessage,
    imageUrl: resolvedImageUrl,
    imageUrls: resolvedImageUrls,
    assignmentContext: assignmentContext
      ? {
          assignmentId: assignmentContext.assignmentId!,
          studentAssignmentId: assignmentContext.studentAssignmentId!,
          title: assignmentContext.title!,
          subject: assignmentContext.subject,
          instructions: assignmentContext.instructions,
          totalPoints: assignmentContext.totalPoints,
          expectedQuestionCount: assignmentContext.expectedQuestionCount,
          worksheetCount: assignmentContext.worksheetCount,
        }
      : null,
    supabase: service,
  });

  // Collect full response and save AI message in parallel with streaming
  const [streamForClient, streamForSave] = teeStream(stream);

  // Save AI message + generate study note after streaming completes (non-blocking)
  collectStream(streamForSave).then(async (fullText) => {
    await saveMessage(service, {
      session_id: sessionId,
      role: "assistant",
      content: fullText,
    });

    if (assignmentContext?.studentAssignmentId && assignmentContext.title) {
      const { data: recentMessages } = await service
        .from("ai_messages")
        .select("role, content")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(40);

      const conversation = ((recentMessages ?? []) as { role: string; content: string }[])
        .reverse()
        .map((row) => `${row.role}: ${row.content}`);

      await updateAssignmentProgressFromConversation({
        supabase: service,
        context: {
          studentAssignmentId: assignmentContext.studentAssignmentId,
          studentId: session.student_id,
          assignmentTitle: assignmentContext.title,
          totalPoints: Number(assignmentContext.totalPoints) || 0,
          expectedQuestionCount: Number(assignmentContext.expectedQuestionCount) || Number(assignmentContext.totalPoints) || 0,
        },
        conversation,
      }).catch(console.error);
    }

    // Generate and save a short study note from this exchange
    const subjectName = sessionWithSubject.subjects?.name ?? "General";
    const [student, existingNotes] = await Promise.all([
      service
        .from("students")
        .select("grade")
        .eq("id", session.student_id)
        .single()
        .then((r) => r.data as { grade: string } | null, () => null),
      getNotesForSession(service, sessionId),
    ]);

    // Pass existing topics so GPT won't repeat already-noted concepts
    const existingTopics = existingNotes
      .map((n) => n.topic ?? n.note.slice(0, 60))
      .filter(Boolean) as string[];

    const note = await generateNote(message, fullText, subjectName, student?.grade ?? "school", existingTopics);

    if (note) {
      // Hard dedup: skip if this topic is already saved (catches edge cases the prompt misses)
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedNew = normalize(note.topic);
      const isDuplicate = existingNotes.some(
        (n) => n.topic && normalize(n.topic) === normalizedNew
      );

      if (!isDuplicate) {
        await saveNote(service, {
          student_id: session.student_id,
          session_id: sessionId,
          subject: subjectName,
          topic: note.topic,
          note: note.note,
        }).catch(console.error);
      }
    }
  }).catch(console.error);

  return new Response(streamForClient, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
    },
  });
}

function teeStream(stream: ReadableStream<Uint8Array>): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] {
  const [a, b] = stream.tee();
  return [a, b];
}

async function collectStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  return result;
}
