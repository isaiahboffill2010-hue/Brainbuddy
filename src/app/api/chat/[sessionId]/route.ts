import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { streamTutorResponse } from "@/lib/openai/tutor";
import { generateNote } from "@/lib/openai/note-generator";
import { getSession } from "@/lib/supabase/queries/sessions";
import { saveMessage } from "@/lib/supabase/queries/messages";
import { saveNote, getNotesForSession } from "@/lib/supabase/queries/notes";

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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const { message, imageUrl, imageDataUrl } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // imageDataUrl is a base64 data URL from the snip flow — sent directly to OpenAI,
  // never persisted to storage. imageUrl is a persistent Supabase Storage URL.
  // OpenAI's vision API accepts both formats natively.
  const resolvedImageUrl: string | undefined = imageUrl ?? imageDataUrl ?? undefined;

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

  // Stream AI response
  const stream = await streamTutorResponse({
    sessionId,
    studentId: session.student_id,
    subjectId: session.subject_id ?? "",
    subjectName: sessionWithSubject.subjects?.name ?? "General",
    userMessage: message,
    imageUrl: resolvedImageUrl,
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

    // Generate and save a short study note from this exchange
    const subjectName = sessionWithSubject.subjects?.name ?? "General";
    const [student, existingNotes] = await Promise.all([
      service
        .from("students")
        .select("grade")
        .eq("id", session.student_id)
        .single()
        .then((r) => r.data as { grade: string } | null)
        .catch(() => null),
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
