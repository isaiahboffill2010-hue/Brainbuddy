import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubjectPicker } from "@/components/chat/subject-picker";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ChatPickerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subjects } = await supabase.from("subjects").select("*");

  // Get profile and first linked student safely
  let firstStudent: { id: string } | null = null;
  try {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    const profile = profileData as { id: string } | null;

    if (profile) {
      const { data: links } = await supabase
        .from("parents_students")
        .select("student_id")
        .eq("parent_id", profile.id)
        .limit(1);
      const studentId = (links as any)?.[0]?.student_id as string | undefined;
      if (studentId) firstStudent = { id: studentId };
    }
  } catch {
    // tables not set up yet
  }

  if (!firstStudent) {
    return (
      <EmptyState
        title="No student profile yet"
        description="Add a student profile first so BrainBuddy knows who they're helping!"
        emoji="🧒"
        action={
          <Link href="/students/new">
            <Button>Create student profile</Button>
          </Link>
        }
      />
    );
  }

  return (
    <SubjectPicker
      subjects={subjects ?? []}
      studentId={firstStudent.id}
    />
  );
}
