import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { saveNote } from "@/lib/supabase/queries/notes";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("student_notes")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subject, topic, note } = await req.json();
  if (!note?.trim()) return NextResponse.json({ error: "note required" }, { status: 400 });

  // Resolve student linked to this user
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  const profile = profileRaw as { id: string } | null;
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: links } = await supabase
    .from("parents_students")
    .select("student_id")
    .eq("parent_id", profile.id)
    .limit(1);
  const studentId = (links as { student_id: string }[] | null)?.[0]?.student_id;
  if (!studentId) return NextResponse.json({ error: "No student found" }, { status: 404 });

  const service = createServiceClient();
  const created = await saveNote(service, {
    student_id: studentId,
    session_id: null,
    subject: subject ?? null,
    topic: topic ?? null,
    note: note.trim(),
  });

  return NextResponse.json(created, { status: 201 });
}
