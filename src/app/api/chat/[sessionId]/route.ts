import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { streamTutorResponse } from "@/lib/openai/tutor";
import { getSession } from "@/lib/supabase/queries/sessions";
import { saveMessage } from "@/lib/supabase/queries/messages";

export const runtime = "nodejs";

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

  const { message, imageUrl } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  // Get session to find student + subject
  const session = await getSession(supabase, sessionId).catch(() => null);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const sessionWithSubject = session as typeof session & {
    subjects: { name: string; icon: string; color: string } | null;
  };

  // Save user message
  await saveMessage(service, {
    session_id: sessionId,
    role: "user",
    content: message,
    image_url: imageUrl ?? null,
  });

  // Stream AI response
  const stream = await streamTutorResponse({
    sessionId,
    studentId: session.student_id,
    subjectId: session.subject_id ?? "",
    subjectName: sessionWithSubject.subjects?.name ?? "General",
    userMessage: message,
    imageUrl,
    supabase: service,
  });

  // Collect full response and save AI message in parallel with streaming
  const [streamForClient, streamForSave] = teeStream(stream);

  // Save AI message after streaming completes (non-blocking)
  collectStream(streamForSave).then((fullText) =>
    saveMessage(service, {
      session_id: sessionId,
      role: "assistant",
      content: fullText,
    })
  ).catch(console.error);

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
