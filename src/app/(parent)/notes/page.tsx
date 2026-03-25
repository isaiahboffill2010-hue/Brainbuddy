import { createClient } from "@/lib/supabase/server";
import { getAllNotesForStudent } from "@/lib/supabase/queries/notes";
import { NotesClient } from "@/components/notes/NotesClient";
import type { StudentNote } from "@/lib/supabase/queries/notes";

export default async function NotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let notes: StudentNote[] = [];

  if (user) {
    const { data: profileRaw } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = profileRaw as any;

    if (profile?.id) {
      const { data: links } = await supabase
        .from("parents_students")
        .select("student_id")
        .eq("parent_id", profile.id)
        .limit(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studentId = (links as any)?.[0]?.student_id as string | undefined;

      if (studentId) {
        notes = await getAllNotesForStudent(supabase, studentId);
      }
    }
  }

  return <NotesClient initialNotes={notes} />;
}
