import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { updateNote, deleteNote } from "@/lib/supabase/queries/notes";

async function resolveStudentId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  const profile = profileRaw as { id: string } | null;
  if (!profile) return null;

  const { data: links } = await supabase
    .from("parents_students")
    .select("student_id")
    .eq("parent_id", profile.id)
    .limit(1);
  return (links as { student_id: string }[] | null)?.[0]?.student_id ?? null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = await resolveStudentId(supabase, user.id);
  if (!studentId) return NextResponse.json({ error: "No student found" }, { status: 404 });

  // Verify this note belongs to the student
  const { data: noteRow } = await supabase
    .from("student_notes")
    .select("student_id")
    .eq("id", noteId)
    .maybeSingle();
  if (!noteRow || (noteRow as { student_id: string }).student_id !== studentId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { note, topic } = await req.json();
  const service = createServiceClient();
  const updated = await updateNote(service, noteId, {
    ...(note !== undefined && { note }),
    ...(topic !== undefined && { topic }),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const { noteId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const studentId = await resolveStudentId(supabase, user.id);
  if (!studentId) return NextResponse.json({ error: "No student found" }, { status: 404 });

  const { data: noteRow } = await supabase
    .from("student_notes")
    .select("student_id")
    .eq("id", noteId)
    .maybeSingle();
  if (!noteRow || (noteRow as { student_id: string }).student_id !== studentId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const service = createServiceClient();
  await deleteNote(service, noteId);
  return NextResponse.json({ ok: true });
}
